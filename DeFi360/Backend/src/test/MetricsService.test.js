const MetricsService = require('../services/MetricsService');

function makeDeps({ dbOk = true, breakerState = 'CLOSED' } = {}) {
  return {
    Loan: { async count({ where }) { return ({ active: 3, paid: 2, defaulted: 1, liquidated: 1 })[where.status] || 0; } },
    Notification: { async count(opts = {}) { return opts.where && opts.where.read === false ? 2 : 5; } },
    Liquidation: { async count() { return 1; } },
    LedgerEntry: {
      async sum(field, { where }) {
        return ({ DISBURSEMENT: 10000, PAYMENT: 4000, LIQUIDATION: 1500 })[where.type] || 0;
      }
    },
    sequelize: { async authenticate() { if (!dbOk) throw new Error('db down'); } },
    priceOracle: {
      getStats: () => ({ hits: 9, misses: 1, hitRate: 0.9 }),
      getState: () => ({ state: breakerState, failureCount: 0 })
    },
    getRateLimitStats: () => ({ totalRequests: 100, throttled: 2, windowMs: 60000, max: 100 }),
    startTime: Date.now() - 5000
  };
}

describe('MetricsService (HU-14)', () => {
  test('getHealth devuelve status ok y uptime', () => {
    const service = new MetricsService(makeDeps());
    const health = service.getHealth();
    expect(health.status).toBe('ok');
    expect(health.uptime).toBeGreaterThanOrEqual(4);
  });

  test('getReadiness reporta db up y estado del breaker cuando todo está sano', async () => {
    const service = new MetricsService(makeDeps({ dbOk: true, breakerState: 'CLOSED' }));
    const readiness = await service.getReadiness();
    expect(readiness.db).toBe('up');
    expect(readiness.oracle).toBe('CLOSED');
    expect(readiness.ready).toBe(true);
  });

  test('getReadiness ready=false si la BD está caída', async () => {
    const service = new MetricsService(makeDeps({ dbOk: false }));
    const readiness = await service.getReadiness();
    expect(readiness.db).toBe('down');
    expect(readiness.ready).toBe(false);
  });

  test('getReadiness ready=false si el breaker está OPEN', async () => {
    const service = new MetricsService(makeDeps({ dbOk: true, breakerState: 'OPEN' }));
    const readiness = await service.getReadiness();
    expect(readiness.ready).toBe(false);
  });

  test('getReadiness ready=true si el breaker está HALF_OPEN (probando recuperación, no caído)', async () => {
    const service = new MetricsService(makeDeps({ dbOk: true, breakerState: 'HALF_OPEN' }));
    const readiness = await service.getReadiness();
    expect(readiness.oracle).toBe('HALF_OPEN');
    expect(readiness.ready).toBe(true);
  });

  test('getMetrics agrega caché, breaker, rate-limit, préstamos por estado y conteos', async () => {
    const service = new MetricsService(makeDeps());
    const metrics = await service.getMetrics();
    expect(metrics.cache.hitRate).toBe(0.9);
    expect(metrics.breaker.state).toBe('CLOSED');
    expect(metrics.rateLimit.max).toBe(100);
    expect(metrics.loansByStatus.active).toBe(3);
    expect(metrics.loansByStatus.liquidated).toBe(1);
    expect(metrics.notifications).toBe(5);
    expect(metrics.liquidations).toBe(1);
  });

  test('getMetrics deriva totalLoans, liquidationRate y notificaciones no leídas', async () => {
    const service = new MetricsService(makeDeps());
    const metrics = await service.getMetrics();
    expect(metrics.totalLoans).toBe(7);
    expect(metrics.liquidationRate).toBeCloseTo(1 / 7, 4);
    expect(metrics.unreadNotifications).toBe(2);
  });

  test('getMetrics agrega el volumen del libro mayor y su saldo neto', async () => {
    const service = new MetricsService(makeDeps());
    const metrics = await service.getMetrics();
    expect(metrics.ledger.disbursed).toBe(10000);
    expect(metrics.ledger.repaid).toBe(4000);
    expect(metrics.ledger.liquidated).toBe(1500);
    expect(metrics.ledger.netOutstanding).toBe(4500);
  });

  test('getMetrics reporta su propia latencia (autoobservabilidad)', async () => {
    const service = new MetricsService(makeDeps());
    const metrics = await service.getMetrics();
    expect(typeof metrics.generatedInMs).toBe('number');
    expect(metrics.generatedInMs).toBeGreaterThanOrEqual(0);
  });

  test('getMetrics tolera un libro mayor sin datos (netOutstanding 0)', async () => {
    const deps = makeDeps();
    deps.LedgerEntry = { async sum() { return null; } };
    const service = new MetricsService(deps);
    const metrics = await service.getMetrics();
    expect(metrics.ledger.disbursed).toBe(0);
    expect(metrics.ledger.netOutstanding).toBe(0);
  });
});
