const path = require('path');
const { _factories } = require('../controllers/loanController');

function equal(a, b, msg) {
  if (a !== b) throw new Error(msg || `Esperado ${b} pero fue ${a}`);
}

describe('LoanController - Pruebas de Rutas', () => {

  test('payLoan: Debe procesar el pago exitosamente y retornar HTTP 200', async () => {
    const mockPaymentProcessor = {
      processPayment: async () => ({
        loanStatus: 'paid',
        newRemainingBalance: 0,
        newLTV: 0
      })
    };

    const payLoanHandler = _factories.payLoan(mockPaymentProcessor);

    const req = {
      params: { id: '1' },
      body: { amount: 100 },
      user: { id: 42 }
    };

    let respData = null;
    const res = {
      status: function() { return this; },
      json: function(data) { respData = data; return this; }
    };

    await payLoanHandler(req, res);

    equal(respData.success, true);
    equal(respData.loanStatus, 'paid');
  });

  test('payLoan: Manejo de errores genéricos (Ej. parámetros incorrectos)', async () => {
    const mockErrorProcessor = {
      processPayment: async () => {
        throw new Error('Préstamo no encontrado');
      }
    };

    const payLoanHandler = _factories.payLoan(mockErrorProcessor);

    const req = { params: { id: '999' }, body: { amount: 30 }, user: { id: 1 } };
    let statusCode = null;
    let respData = null;

    const res = {
      status: function(code) { statusCode = code; return this; },
      json: function(data) { respData = data; return this; }
    };

    await payLoanHandler(req, res);

    equal(statusCode, 400);
    equal(respData.message, 'Préstamo no encontrado');
  });
});