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

// Forzar recarga del servicio para que capture los modelos simulados aunque
// otro test lo haya cargado antes con los modelos reales.
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