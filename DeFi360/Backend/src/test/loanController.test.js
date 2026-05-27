const path = require('path');

function equal(a, b, msg) {
  if (a !== b) throw new Error(msg || `${b} !== ${a}`);
}

function deepEqual(a, b, msg) {
  const aJson = JSON.stringify(a);
  const bJson = JSON.stringify(b);
  if (aJson !== bJson) throw new Error(msg || `${bJson} !== ${aJson}`);
}

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

const { _factories } = require(path.resolve(__dirname, '../controllers/loanController'));

// Restaurar require original
Module.prototype.require = originalRequire;

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
