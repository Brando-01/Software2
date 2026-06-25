const MetricsService = require('../services/MetricsService');

function makeDeps({ dbOk = true, breakerState = 'CLOSED' } = {}) {
  return {
    Loan: { async count({ where }) { return ({ active: 3, paid: 2, defaulted: 1, liquidated: 1 })[where.status] || 0; } },
    Notification: { async count() { return 5; } },
    Liquidation: { async count() { return 1; } },
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
});
