const path = require('path');
const { setMock, clearMock } = require('./testHelpers');

function equal(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Esperado ${expected} pero fue ${actual}`);
  }
}

function deepEqual(actual, expected, message) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(message || `Esperado ${expectedJson} pero fue ${actualJson}`);
  }
}

function throws(fn, expectedMessage) {
  try {
    fn();
    throw new Error('Se esperaba que la función lanzara un error');
  } catch (err) {
    if (!err.message.includes(expectedMessage)) {
      throw new Error(`Error esperado "${expectedMessage}", pero fue "${err.message}"`);
    }
  }
}

const modelsPath = path.resolve(__dirname, '../models');
const controllerPath = path.resolve(__dirname, '../controllers/loanController');

const mockModels = {
  Loan: {
    findByPk: async (id) => {
      if (id === 1) {
        return { borrowerId: 42, lenderId: 99 };
      }
      return null;
    }
  }
};

setMock(modelsPath, mockModels);
const { _factories } = require(controllerPath);
clearMock(modelsPath);

describe('loanController payLoan - Dependency Injection', () => {
  test('Debe usar el procesador inyectado y retornar respuesta exitosa', async () => {
    const mockPaymentProcessor = {
      processPayment: async () => ({
        loanStatus: 'paid',
        newRemainingBalance: 0,
        newLTV: 0
      })
    };

    const req = {
      params: { id: '1' },
      body: { amount: 100 },
      user: { id: 42 }
    };

    let sentResponse = null;
    const res = {
      json: (payload) => { sentResponse = payload; },
      status: () => res
    };

    const handler = _factories.payLoan(mockPaymentProcessor);
    await handler(req, res);

    equal(sentResponse.success, true);
    equal(sentResponse.loanStatus, 'paid');
  });

  test('Debe retornar 404 si el préstamo no existe', async () => {
    const mockModels404 = {
      Loan: {
        findByPk: async () => null
      }
    };

    setMock(modelsPath, mockModels404);
    const { _factories: _factories404 } = require(controllerPath);
    clearMock(modelsPath);

    const req = {
      params: { id: '10' },
      body: { amount: 30 },
      user: { id: 1 }
    };

    let statusCode = null;
    let sentJson = null;
    const res = {
      json: (payload) => { sentJson = payload; },
      status: (code) => { statusCode = code; return res; }
    };

    const handler = _factories404.payLoan({ processPayment: async () => ({}) });
    await handler(req, res);

    equal(statusCode, 404);
    deepEqual(sentJson, { message: 'Préstamo no encontrado' });
  });
});
