
const LedgerService = require('../services/LedgerService');
const PaymentHistoryScoringStrategy = require('../strategies/PaymentHistoryScoringStrategy');
const NotificationService = require('../services/NotificationService');
const { authorize } = require('../middleware/authMiddleware');
const MetricsService = require('../services/MetricsService');

function makeLedgerModel() {
  const rows = [];
  let seq = 1;
  return {
    rows,
    async create(data) { const r = { id: seq, createdAt: new Date(Date.now() + seq), ...data }; seq++; rows.push(r); return r; },
    async findOne({ where }) {
      return rows.filter((r) => r.userId === where.userId).sort((a, b) => b.createdAt - a.createdAt)[0] || null;
    }
  };
}

describe('LedgerService.record (Caja Negra · HU-10 · 5 campos)', () => {
  test('CE1 (type=DISBURSEMENT crédito): suma al saldo y guarda refType/refId', async () => {
    const ledger = new LedgerService(makeLedgerModel());
    const e = await ledger.record(1, 'DISBURSEMENT', 1000, 'loan', 7);
    expect(parseFloat(e.balanceAfter)).toBe(1000);
    expect(e.refType).toBe('loan');
    expect(e.refId).toBe(7);
  });

  test('CE2 (type=LIQUIDATION débito): resta al saldo acumulado', async () => {
    const ledger = new LedgerService(makeLedgerModel());
    await ledger.record(2, 'DISBURSEMENT', 1000, 'loan', 1);
    const e = await ledger.record(2, 'LIQUIDATION', 400, 'liquidation', 3);
    expect(parseFloat(e.balanceAfter)).toBe(600);
  });

  test('CE3 (refType/refId omitidos): se aceptan como null (valor límite)', async () => {
    const ledger = new LedgerService(makeLedgerModel());
    const e = await ledger.record(3, 'PAYMENT', 50);
    expect(e.refType).toBeNull();
    expect(e.refId).toBeNull();
    expect(parseFloat(e.balanceAfter)).toBe(50);
  });

  test('CE4 (amount no numérico): clase inválida -> lanza error', async () => {
    const ledger = new LedgerService(makeLedgerModel());
    await expect(ledger.record(4, 'PAYMENT', 'abc', 'loan', 1)).rejects.toThrow(/numérico/);
  });
});

describe('PaymentHistoryScoringStrategy.score (Caja Negra · HU-11 · >4 campos)', () => {
  test('CE1 (onTime alto, 0 moras): categoría excellent', () => {
    const r = new PaymentHistoryScoringStrategy().score({ onTime: 4, late: 0, defaults: 0 });
    expect(r.score).toBeGreaterThanOrEqual(750);
    expect(r.category).toBe('excellent');
  });

  test('CE2 (moras y defaults dominan): categoría poor con clamp inferior', () => {
    const r = new PaymentHistoryScoringStrategy().score({ onTime: 1, late: 3, defaults: 0 });
    expect(r.score).toBeLessThan(500);
    expect(r.category).toBe('poor');
  });

  test('CE3 (todo en cero): valor límite -> base neutro 650 / fair', () => {
    const r = new PaymentHistoryScoringStrategy().score({ onTime: 0, late: 0, defaults: 0 });
    expect(r.score).toBe(650);
    expect(r.category).toBe('fair');
  });

  test('CE4 (config inyectada cambia pesos/base · OCP): salida varía', () => {
    const r = new PaymentHistoryScoringStrategy({ base: 700, weights: { onTime: 10, late: -10, default: -10 } })
      .score({ onTime: 5, late: 0, defaults: 0 });
    expect(r.score).toBe(750);
    expect(r.category).toBe('excellent');
  });

  test('CE5 (clamp superior): no supera max=850', () => {
    const r = new PaymentHistoryScoringStrategy().score({ onTime: 100, late: 0, defaults: 0 });
    expect(r.score).toBe(850);
  });
});

function makeNotifModel() {
  const rows = [];
  let seq = 1;
  return {
    rows,
    async create(data) { const r = { id: seq++, createdAt: new Date(), ...data }; rows.push(r); return r; }
  };
}

describe('NotificationService.notify (Caja Negra · HU-12 · 5 campos)', () => {
  test('CE1 (canal por defecto in_app): persiste no leída', async () => {
    const model = makeNotifModel();
    const n = await new NotificationService(model).notify(10, 'PAYMENT', 'Pago', 'Cuota aplicada');
    expect(n.channel).toBe('in_app');
    expect(n.read).toBe(false);
    expect(model.rows.length).toBe(1);
  });

  test('CE2 (channel=email · Strategy): usa el canal email simulado', async () => {
    const model = makeNotifModel();
    const svc = new NotificationService(model);
    const n = await svc.notify(10, 'MATCH', 'Match', 'Tienes un match', { channel: 'email' });
    expect(n.channel).toBe('email');
    expect(svc.email.sent.length).toBe(1);
  });

  test('CE3 (userId null): valor límite -> no persiste y retorna null', async () => {
    const model = makeNotifModel();
    const n = await new NotificationService(model).notify(null, 'PAYMENT', 't', 'm');
    expect(n).toBeNull();
    expect(model.rows.length).toBe(0);
  });

  test('CE4 (type LIQUIDATION + título/mensaje arbitrarios): se conservan tal cual', async () => {
    const model = makeNotifModel();
    const n = await new NotificationService(model).notify(20, 'LIQUIDATION', 'Liquidado', 'Préstamo #1 liquidado');
    expect(n.type).toBe('LIQUIDATION');
    expect(n.title).toBe('Liquidado');
    expect(n.message).toBe('Préstamo #1 liquidado');
  });
});

function makeRes() {
  return {
    statusCode: null, body: null,
    status(c) { this.statusCode = c; return this; },
    json(d) { this.body = d; return this; }
  };
}

describe('RBAC authorize (Caja Negra · HU-13 · >4 campos)', () => {
  test('CE1 (sin user / sin token): 401', () => {
    const res = makeRes();
    authorize('admin')({ method: 'GET', originalUrl: '/api/metrics' }, res, () => {});
    expect(res.statusCode).toBe(401);
  });

  test('CE2 (rol insuficiente): 403 y no llama next', () => {
    const res = makeRes();
    let next = false;
    authorize('admin')({ user: { id: 1, role: 'borrower' }, method: 'POST', originalUrl: '/api/loans/1/liquidate' }, res, () => { next = true; });
    expect(res.statusCode).toBe(403);
    expect(next).toBe(false);
  });

  test('CE3 (rol correcto): pasa (next, sin status de error)', () => {
    const res = makeRes();
    let next = false;
    authorize('admin')({ user: { id: 1, role: 'admin' }, method: 'GET', originalUrl: '/api/metrics' }, res, () => { next = true; });
    expect(next).toBe(true);
    expect(res.statusCode).toBeNull();
  });

  test('CE4 (lista multi-rol): un rol contenido en la lista pasa', () => {
    const res = makeRes();
    let next = false;
    authorize('lender', 'admin')({ user: { id: 2, role: 'lender' }, method: 'GET', originalUrl: '/api/x' }, res, () => { next = true; });
    expect(next).toBe(true);
  });
});

function makeMetricsDeps({ dbOk = true, breakerState = 'CLOSED', hitRate = 0.9 } = {}) {
  return {
    Loan: { async count({ where }) { return ({ active: 3, paid: 2, defaulted: 1, liquidated: 1 })[where.status] || 0; } },
    Notification: { async count() { return 5; } },
    Liquidation: { async count() { return 1; } },
    sequelize: { async authenticate() { if (!dbOk) throw new Error('down'); } },
    priceOracle: {
      getStats: () => ({ hits: 9, misses: 1, hitRate }),
      getState: () => ({ state: breakerState, failureCount: 0 })
    },
    getRateLimitStats: () => ({ totalRequests: 100, throttled: 2, windowMs: 60000, max: 100 }),
    startTime: Date.now() - 5000
  };
}

describe('MetricsService.getMetrics (Caja Negra · HU-14 · >4 fuentes)', () => {
  test('CE1 (todo sano): agrega las 6 fuentes en un único objeto', async () => {
    const m = await new MetricsService(makeMetricsDeps()).getMetrics();
    expect(m.cache.hitRate).toBe(0.9);
    expect(m.breaker.state).toBe('CLOSED');
    expect(m.rateLimit.max).toBe(100);
    expect(m.loansByStatus.active).toBe(3);
    expect(m.notifications).toBe(5);
    expect(m.liquidations).toBe(1);
  });

  test('CE2 (breaker OPEN): se refleja en la salida sin romper la agregación', async () => {
    const m = await new MetricsService(makeMetricsDeps({ breakerState: 'OPEN' })).getMetrics();
    expect(m.breaker.state).toBe('OPEN');
    expect(m.loansByStatus.liquidated).toBe(1);
  });

  test('CE3 (readiness con DB caída): ready=false (valor límite de dependencia)', async () => {
    const r = await new MetricsService(makeMetricsDeps({ dbOk: false })).getReadiness();
    expect(r.db).toBe('down');
    expect(r.ready).toBe(false);
  });

  test('CE4 (hitRate=0): caso borde de caché fría, agregación válida', async () => {
    const m = await new MetricsService(makeMetricsDeps({ hitRate: 0 })).getMetrics();
    expect(m.cache.hitRate).toBe(0);
    expect(typeof m.timestamp).toBe('string');
  });
});
