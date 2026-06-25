const { rateLimiter, getStats, reset } = require('../middleware/rateLimiter');

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    set(k, v) { this.headers[k] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };
}

describe('rateLimiter (HU transversal · seguridad)', () => {
  beforeEach(() => reset());

  test('permite requests por debajo del límite y agrega cabeceras', () => {
    const mw = rateLimiter({ windowMs: 1000, max: 3 });
    const req = { ip: '1.1.1.1', headers: {} };

    let nextCount = 0;
    for (let i = 0; i < 3; i++) {
      const res = makeRes();
      mw(req, res, () => nextCount++);
      expect(res.headers['X-RateLimit-Limit']).toBe('3');
    }
    expect(nextCount).toBe(3);
  });

  test('responde 429 al superar el límite', () => {
    const mw = rateLimiter({ windowMs: 1000, max: 2 });
    const req = { ip: '2.2.2.2', headers: {} };

    mw(req, makeRes(), () => {});
    mw(req, makeRes(), () => {});

    const res = makeRes();
    let nextCalled = false;
    mw(req, res, () => { nextCalled = true; });
    expect(res.statusCode).toBe(429);
    expect(nextCalled).toBe(false);
    expect(res.headers['Retry-After']).toBeDefined();
  });

  test('no afecta a otros clientes (aislamiento por IP)', () => {
    const mw = rateLimiter({ windowMs: 1000, max: 1 });
    const reqA = { ip: '3.3.3.3', headers: {} };
    const reqB = { ip: '4.4.4.4', headers: {} };

    mw(reqA, makeRes(), () => {});
    const resA = makeRes();
    mw(reqA, resA, () => {});
    expect(resA.statusCode).toBe(429);

    const resB = makeRes();
    let bAllowed = false;
    mw(reqB, resB, () => { bAllowed = true; });
    expect(bAllowed).toBe(true);
  });

  test('getStats expone contadores agregados (observabilidad HU-14)', () => {
    const mw = rateLimiter({ windowMs: 1000, max: 1 });
    const req = { ip: '5.5.5.5', headers: {} };
    mw(req, makeRes(), () => {});
    mw(req, makeRes(), () => {});

    const stats = getStats();
    expect(stats.totalRequests).toBeGreaterThanOrEqual(2);
    expect(stats.throttled).toBeGreaterThanOrEqual(1);
    expect(stats.max).toBe(1);
  });
});
