const { authorize } = require('../middleware/authMiddleware');

function makeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };
}

describe('authorize(...roles) — RBAC (HU-13)', () => {
  test('401 si no hay usuario autenticado', () => {
    const res = makeRes();
    let nextCalled = false;
    authorize('admin')({}, res, () => { nextCalled = true; });
    expect(res.statusCode).toBe(401);
    expect(nextCalled).toBe(false);
  });

  test('403 si el rol es insuficiente', () => {
    const res = makeRes();
    let nextCalled = false;
    const req = { user: { id: 1, role: 'borrower' }, method: 'POST', originalUrl: '/api/loans/1/liquidate' };
    authorize('admin')(req, res, () => { nextCalled = true; });
    expect(res.statusCode).toBe(403);
    expect(nextCalled).toBe(false);
  });

  test('next() si el rol es suficiente', () => {
    const res = makeRes();
    let nextCalled = false;
    const req = { user: { id: 1, role: 'admin' } };
    authorize('admin')(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeNull();
  });

  test('authorize acepta múltiples roles permitidos', () => {
    const res = makeRes();
    let nextCalled = false;
    const req = { user: { id: 2, role: 'lender' } };
    authorize('lender', 'admin')(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  test('un rol no incluido en la lista recibe 403 aunque sea válido', () => {
    const res = makeRes();
    const req = { user: { id: 3, role: 'lender' }, method: 'GET', originalUrl: '/api/metrics' };
    authorize('admin')(req, res, () => {});
    expect(res.statusCode).toBe(403);
  });
});
