function equal(a, b, msg) {
  if (a !== b) throw new Error(msg || `Esperado ${b} pero fue ${a}`);
}
function ok(val, msg) {
  if (!val) throw new Error(msg || 'No es verdadero');
}

const borrowerWallet = {
  availableBalance: 150,
  blockedBalance: 0,
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
  borrowerId: 10,
  lenderId: 20,
  Offer: { collateralAmount: '1' },
  update: async (data) => Object.assign(loan, data)
};

jest.mock('../models', () => ({
  Loan: { findByPk: async () => loan },
  Wallet: {
    findOne: async ({ where: { userId } }) => (userId === 10 ? borrowerWallet : lenderWallet)
  },
  Offer: {}
}));

const StandardPaymentProcessor = require('../services/StandardPaymentProcessor');

describe('StandardPaymentProcessor', () => {

  beforeEach(() => {
    borrowerWallet.availableBalance = 150;
    borrowerWallet.blockedBalance = 0;
    lenderWallet.availableBalance = 50;
    lenderWallet.blockedBalance = 20;
    loan.status = 'active';
    loan.remainingBalance = 100;
    loan.borrowerId = 10;
    loan.lenderId = 20;
  });

  test('Recalcula LTV correctamente usando matemáticas simples', () => {
    const processor = new StandardPaymentProcessor();
    const ltv = processor.recalculateLTV(50, 0.2, 2000);
    ok(Math.abs(ltv - 12.5) < 0.0001, 'El cálculo del LTV falló');
  });

  test('Procesa pago completo y actualiza balances', async () => {
    const processor = new StandardPaymentProcessor();

    const result = await processor.processPayment({
      loanId: 1,
      amount: 100,
      borrowerId: 10,
      lenderId: 20
    });

    equal(borrowerWallet.availableBalance, 50);
    equal(lenderWallet.availableBalance, 150);
    equal(loan.remainingBalance, 0);
    equal(loan.status, 'paid');
    equal(result.success, true);
  });

  test('Resuelve lenderId/borrowerId desde el préstamo cuando no se pasan (fix bug pago)', async () => {
    const processor = new StandardPaymentProcessor();

    const result = await processor.processPayment({
      loanId: 1,
      amount: 100
    });

    equal(result.success, true);
    equal(borrowerWallet.availableBalance, 50, 'Debió descontar del deudor resuelto del préstamo');
    equal(lenderWallet.availableBalance, 150, 'Debió acreditar al prestamista resuelto del préstamo');
    equal(loan.status, 'paid');
  });
});
const path = require('path');

function equal(a, b, msg) {
  if (a !== b) throw new Error(msg || `Esperado ${b} pero fue ${a}`);
}
function ok(val, msg) {
  if (!val) throw new Error(msg || 'No es verdadero');
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
  Loan: { findByPk: async () => loan },
  Wallet: {
    findOne: async ({ where: { userId } }) => {
      return userId === 10 ? borrowerWallet : lenderWallet;
    }
  },
  Offer: {}
};

const modelsPath = path.resolve(__dirname, '../models');
require.cache[modelsPath] = { exports: mockModels };
require.cache[path.join(modelsPath, 'index.js')] = { exports: mockModels };

delete require.cache[require.resolve('../services/StandardPaymentProcessor')];
const StandardPaymentProcessor = require('../services/StandardPaymentProcessor');

describe('StandardPaymentProcessor', () => {
  
  test('Recalcula LTV correctamente usando matemáticas simples', () => {
    const processor = new StandardPaymentProcessor();
    const ltv = processor.recalculateLTV(50, 0.2, 2000); 
    ok(Math.abs(ltv - 12.5) < 0.0001, 'El cálculo del LTV falló');
  });

  test('Procesa pago completo y actualiza balances', async () => {
    const processor = new StandardPaymentProcessor();
    
    borrowerWallet.availableBalance = 150;
    lenderWallet.availableBalance = 50;
    loan.remainingBalance = 100;

    const result = await processor.processPayment({
      loanId: 1,
      amount: 100,
      borrowerId: 10,
      lenderId: 20
    });

    equal(borrowerWallet.availableBalance, 50); 
    equal(lenderWallet.availableBalance, 150);  
    equal(loan.remainingBalance, 0);            
    equal(loan.status, 'paid');
    equal(result.success, true);
  });
});
