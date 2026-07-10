const { _factories } = require('../controllers/metricsController');

function makeRes() {
  const res = { statusCode: 200, body: null };
  res.status = function (code) { this.statusCode = code; return this; };
  res.json = function (data) { this.body = data; return this; };
  return res;
}

describe('metricsController (HU-14) — health, readiness y metrics', () => {

  test('health: responde 200 con el objeto de salud del servicio', () => {
    const mockService = { getHealth: () => ({ status: 'ok', uptime: 42, timestamp: '2026-07-09T00:00:00.000Z' }) };
    const handler = _factories.health(mockService);
    const res = makeRes();

    handler({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBe(42);
  });

  test('ready: responde 200 cuando el sistema está listo', async () => {
    const mockService = { getReadiness: async () => ({ ready: true, db: 'up', oracle: 'CLOSED' }) };
    const handler = _factories.ready(mockService);
    const res = makeRes();

    await handler({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ready: true, db: 'up', oracle: 'CLOSED' });
  });

  test('ready: responde 503 cuando la BD o el oráculo no están sanos', async () => {
    const mockService = { getReadiness: async () => ({ ready: false, db: 'down', oracle: 'OPEN' }) };
    const handler = _factories.ready(mockService);
    const res = makeRes();

    await handler({}, res);

    expect(res.statusCode).toBe(503);
    expect(res.body.ready).toBe(false);
  });

  test('ready: responde 503 con el mensaje de error si el servicio lanza una excepción', async () => {
    const mockService = { getReadiness: async () => { throw new Error('conexión rechazada'); } };
    const handler = _factories.ready(mockService);
    const res = makeRes();

    await handler({}, res);

    expect(res.statusCode).toBe(503);
    expect(res.body.ready).toBe(false);
    expect(res.body.error).toBe('conexión rechazada');
  });

  test('metrics: responde 200 con success y las métricas agregadas', async () => {
    const fakeMetrics = { cache: { hitRate: 0.9 }, breaker: { state: 'CLOSED' }, totalLoans: 7 };
    const mockService = { getMetrics: async () => fakeMetrics };
    const handler = _factories.metrics(mockService);
    const res = makeRes();

    await handler({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics).toEqual(fakeMetrics);
  });

  test('metrics: responde 500 si el servicio falla al agregar las métricas', async () => {
    const mockService = { getMetrics: async () => { throw new Error('fallo en el agregador'); } };
    const handler = _factories.metrics(mockService);
    const res = makeRes();

    await handler({}, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Error al obtener métricas');
  });
});

describe('metricsRoutes (HU-14) — RBAC del dashboard de observabilidad', () => {
  test('GET /metrics exige protect + authorize("admin") en la definición de rutas', () => {
    const source = require('fs').readFileSync(
      require('path').join(__dirname, '../routes/metricsRoutes.js'),
      'utf8'
    );
    expect(source).toMatch(/router\.get\(\s*['"]\/metrics['"]\s*,\s*protect\s*,\s*authorize\(\s*['"]admin['"]\s*\)/);
  });

  test('GET /health y GET /ready NO exigen autenticación (son públicos por diseño)', () => {
    const source = require('fs').readFileSync(
      require('path').join(__dirname, '../routes/metricsRoutes.js'),
      'utf8'
    );
    expect(source).toMatch(/router\.get\(\s*['"]\/health['"]\s*,\s*health\s*\)/);
    expect(source).toMatch(/router\.get\(\s*['"]\/ready['"]\s*,\s*ready\s*\)/);
  });
});
