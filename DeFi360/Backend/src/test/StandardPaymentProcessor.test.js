const path = require('path');

function equal(a, b, msg) {
  if (a !== b) throw new Error(msg || `${b} !== ${a}`);
}

function ok(val, msg) {
  if (!val) throw new Error(msg || 'Not ok');
}

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

// Mock require() para devolver nuestros modelos
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  const modelsPath = path.resolve(__dirname, '../models');
  if (id === modelsPath) {
    return mockModels;
  }
  return originalRequire.apply(this, arguments);
};

const StandardPaymentProcessor = require(path.resolve(__dirname, '../services/StandardPaymentProcessor'));

// Restaurar require original
Module.prototype.require = originalRequire;

describe('StandardPaymentProcessor', () => {
  test('recalcula LTV correctamente', () => {
    const processor = new StandardPaymentProcessor();
    const ltv = processor.recalculateLTV(50, 0.2, 2000);
    ok(Math.abs(ltv - 12.5) < 0.0001);
  });

  test('procesa pago completo', async () => {
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
