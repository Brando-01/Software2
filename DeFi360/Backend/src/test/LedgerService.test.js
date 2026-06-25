const LedgerService = require('../services/LedgerService');

function makeFakeModel() {
  const rows = [];
  let seq = 1;
  return {
    rows,
    async create(data) {
      const row = { id: seq++, createdAt: new Date(Date.now() + seq), ...data };
      rows.push(row);
      return row;
    },
    async findOne({ where, order }) {
      const filtered = rows.filter((r) => r.userId === where.userId);
      filtered.sort((a, b) => b.createdAt - a.createdAt);
      return filtered[0] || null;
    },
    async findAndCountAll({ where, limit, offset }) {
      const filtered = rows.filter((r) => r.userId === where.userId)
        .sort((a, b) => b.createdAt - a.createdAt);
      return { rows: filtered.slice(offset, offset + limit), count: filtered.length };
    },
    async findAll({ where }) {
      return rows.filter((r) => r.userId === where.userId)
        .sort((a, b) => a.createdAt - b.createdAt);
    }
  };
}

describe('LedgerService (HU-10 · append-only)', () => {
  let model;
  let ledger;

  beforeEach(() => {
    model = makeFakeModel();
    ledger = new LedgerService(model);
  });

  test('record crea un asiento PAYMENT con balanceAfter acumulado', async () => {
    const entry = await ledger.record(1, 'PAYMENT', 100, 'loan', 5);
    expect(entry.type).toBe('PAYMENT');
    expect(parseFloat(entry.amount)).toBe(100);
    expect(parseFloat(entry.balanceAfter)).toBe(100);
  });

  test('balanceAfter suma créditos y resta liquidaciones', async () => {
    await ledger.record(1, 'DISBURSEMENT', 1000, 'loan', 1);
    await ledger.record(1, 'PAYMENT', 200, 'loan', 1);
    const liq = await ledger.record(1, 'LIQUIDATION', 500, 'liquidation', 1);
    expect(parseFloat(liq.balanceAfter)).toBe(700);
  });

  test('getEntries pagina y devuelve los más recientes primero', async () => {
    for (let i = 0; i < 5; i++) {
      await ledger.record(1, 'PAYMENT', 10, 'loan', i);
    }
    const result = await ledger.getEntries(1, 1, 2);
    expect(result.entries.length).toBe(2);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.totalPages).toBe(3);
  });

  test('getStatement agrega totales por tipo y saldo resultante', async () => {
    await ledger.record(2, 'DISBURSEMENT', 1000, 'loan', 1);
    await ledger.record(2, 'PAYMENT', 300, 'loan', 1);
    await ledger.record(2, 'PAYMENT', 200, 'loan', 1);

    const statement = await ledger.getStatement(2);
    expect(statement.totalDisbursed).toBe(1000);
    expect(statement.totalPaid).toBe(500);
    expect(statement.balance).toBe(1500);
    expect(statement.entryCount).toBe(3);
  });

  test('no expone métodos de UPDATE/DELETE de asientos (append-only)', () => {
    expect(typeof ledger.update).toBe('undefined');
    expect(typeof ledger.delete).toBe('undefined');
    expect(typeof ledger.record).toBe('function');
  });
});
