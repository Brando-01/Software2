const path = require('path');
const { setMock, clearMock } = require('./testHelpers');

function equal(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Esperado ${expected} pero fue ${actual}`);
  }
}

function ok(value, message) {
  if (!value) {
    throw new Error(message || `Esperado valor verdadero pero fue ${value}`);
  }
}

const modelsPath = path.resolve(__dirname, '../models');
const servicePath = path.resolve(__dirname, '../services/StandardPaymentProcessor');

const borrowerWallet = {
  availableBalance: 150,
  update: async (data) => Object.assign(borrowerWallet, data)
};

const lenderWallet = {
  availableBalance: 50,
  blockedBalance: 20,
  update: async (data) => Object.assign(lenderWallet, data)
};

const loan = {
  status: 'active',
  remainingBalance: 100,
  Offer: { collateralAmount: '1' },
  update: async (data) => Object.assign(loan, data)
};

const mockModels = {
  Loan: {
    findByPk: async () => loan
  },
  Wallet: {
    findOne: async ({ where: { userId } }) => {
      return userId === 10 ? borrowerWallet : lenderWallet;
    }
  },
  Offer: {}
};

setMock(modelsPath, mockModels);
const StandardPaymentProcessor = require(servicePath);
clearMock(modelsPath);

describe('StandardPaymentProcessor', () => {
  test('recalcula LTV correctamente con colateral positivo', () => {
    const processor = new StandardPaymentProcessor();
    const ltv = processor.recalculateLTV(50, 0.2, 2000);
    ok(Math.abs(ltv - 12.5) < 0.0001, `LTV esperaba 12.5 pero fue ${ltv}`);
  });

  test('procesa pago completo y actualiza balances', async () => {
    const processor = new StandardPaymentProcessor();
    const result = await processor.processPayment({
      loanId: 1,
      amount: 100,
      borrowerId: 10,
      lenderId: 20
    });

    equal(borrowerWallet.availableBalance, 50);
    equal(lenderWallet.availableBalance, 150);
    equal(lenderWallet.blockedBalance, 0);
    equal(loan.remainingBalance, 0);
    equal(loan.status, 'paid');
    equal(result.success, true);
    equal(result.loanStatus, 'paid');
  });
});
