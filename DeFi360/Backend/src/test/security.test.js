const { authorize } = require('../middleware/authMiddleware');
const { rateLimiter, reset: resetRateLimiter } = require('../middleware/rateLimiter');
const { _factories: loanFactories } = require('../controllers/loanController');
const { _factories: creditFactories } = require('../controllers/creditScoreController');

function makeRes() {
  return {
    statusCode: null, headers: {}, body: null,
    set(k, v) { this.headers[k] = v; return this; },
    status(c) { this.statusCode = c; return this; },
    json(d) { this.body = d; return this; }
  };
}

describe('(1) RBAC — autenticación y autorización', () => {
  test('401 cuando no hay sesión/token (no autenticado)', () => {
    const res = makeRes();
    authorize('admin')({ method: 'POST', originalUrl: '/api/loans/1/liquidate' }, res, () => {});
    expect(res.statusCode).toBe(401);
  });

  test('403 cuando el rol es insuficiente (borrower intenta operación admin)', () => {
    const res = makeRes();
    let next = false;
    authorize('admin')(
      { user: { id: 9, role: 'borrower' }, method: 'POST', originalUrl: '/api/loans/1/liquidate' },
      res, () => { next = true; }
    );
    expect(res.statusCode).toBe(403);
    expect(next).toBe(false);
  });

  test('200/next cuando el rol es correcto (admin en endpoint admin)', () => {
    const res = makeRes();
    let next = false;
    authorize('admin')({ user: { id: 1, role: 'admin' } }, res, () => { next = true; });
    expect(next).toBe(true);
    expect(res.statusCode).toBeNull();
  });
});

describe('(2) Rate Limiting — disponibilidad / anti-abuso', () => {
  beforeEach(() => resetRateLimiter());

  test('429 al exceder el límite de la ventana', () => {
    const mw = rateLimiter({ windowMs: 1000, max: 2 });
    const req = { ip: '9.9.9.9', headers: {} };
    mw(req, makeRes(), () => {});
    mw(req, makeRes(), () => {});
    const res = makeRes();
    mw(req, res, () => {});
    expect(res.statusCode).toBe(429);
    expect(res.headers['Retry-After']).toBeDefined();
  });

  test('el exceso de un cliente no afecta a otro (aislamiento)', () => {
    const mw = rateLimiter({ windowMs: 1000, max: 1 });
    const a = { ip: '10.0.0.1', headers: {} };
    const b = { ip: '10.0.0.2', headers: {} };
    mw(a, makeRes(), () => {});
    const resA = makeRes(); mw(a, resA, () => {});
    expect(resA.statusCode).toBe(429);
    let bOk = false; mw(b, makeRes(), () => { bOk = true; });
    expect(bOk).toBe(true);
  });
});

describe('(3) Validación de entradas — rechazo de payloads inválidos', () => {
  test('requestLoan rechaza (400) cuando faltan campos obligatorios', async () => {
    const handler = loanFactories.requestLoan({ async calculateValue() { return 99999; } });
    const res = makeRes();
    await handler({ body: { amount: 1000  }, user: { id: 1 } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/requeridos|duration/i);
  });

  test('requestLoan rechaza (400) colateral no numérico', async () => {
    const handler = loanFactories.requestLoan({ async calculateValue() { return 99999; } });
    const res = makeRes();
    await handler({ body: { amount: 1000, duration: 30, collateralAmount: 'NaN-ish' }, user: { id: 1 } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/número válido|collateralAmount/i);
  });

  test('simulate rechaza (400) cuando faltan loanAmount/collateralAmount', async () => {
    const handler = loanFactories.simulate({ async getPrice() { return 3000; } });
    const res = makeRes();
    await handler({ body: { collateralType: 'ETH' } }, res);
    expect(res.statusCode).toBe(400);
  });

  test('getCreditScore rechaza (400) id de usuario no numérico', async () => {
    const handler = creditFactories.getCreditScore({ async getScore() { return {}; } });
    const res = makeRes();
    await handler({ params: { id: 'abc' } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/inválido/i);
  });
});
