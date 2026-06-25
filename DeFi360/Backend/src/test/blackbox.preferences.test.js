const { _factories } = require('../controllers/preferenceController');

function makeModel() {
  const store = { rows: [], seq: 1 };
  return {
    store,
    async findOne({ where }) {
      return store.rows.find((r) => r.lenderId === where.lenderId) || null;
    },
    async create(data) {
      const row = {
        id: store.seq++,
        ...data,
        async update(patch) { Object.assign(this, patch); return this; }
      };
      store.rows.push(row);
      return row;
    }
  };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };
}

describe('POST /api/preferences (Caja Negra · HU-15 · 6 campos de entrada)', () => {

  test('CE1 (todos válidos): persiste las 6 preferencias y responde 201', async () => {
    const handler = _factories.savePreferences(makeModel());
    const req = {
      user: { id: 20 },
      body: {
        maxAmount: 5000,
        minApy: 5.5,
        collateralTypes: ['ETH', 'BTC'],
        maxLtv: 80,
        minCreditScore: 650,
        autoMatch: true
      }
    };
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(parseFloat(res.body.preference.maxAmount)).toBe(5000);
    expect(res.body.preference.minCreditScore).toBe(650);
    expect(res.body.preference.collateralTypes).toEqual(['ETH', 'BTC']);
    expect(res.body.preference.autoMatch).toBe(true);
  });

  test('CE2 (body vacío): aplica valores por defecto (null y autoMatch=false), 201', async () => {
    const handler = _factories.savePreferences(makeModel());
    const req = { user: { id: 21 }, body: {} };
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.preference.maxAmount).toBeNull();
    expect(res.body.preference.minApy).toBeNull();
    expect(res.body.preference.collateralTypes).toBeNull();
    expect(res.body.preference.maxLtv).toBeNull();
    expect(res.body.preference.minCreditScore).toBeNull();
    expect(res.body.preference.autoMatch).toBe(false);
  });

  test('CE3 (límites: 0 en numéricos, [] en colateral): se respetan, 201', async () => {
    const handler = _factories.savePreferences(makeModel());
    const req = {
      user: { id: 22 },
      body: {
        maxAmount: 0,
        minApy: 0,
        collateralTypes: [],
        maxLtv: 0,
        minCreditScore: 300,
        autoMatch: false
      }
    };
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(201);
    expect(parseFloat(res.body.preference.maxAmount)).toBe(0);
    expect(res.body.preference.minCreditScore).toBe(300);
    expect(res.body.preference.collateralTypes).toEqual([]);
  });

  test('CE4 (upsert): segunda llamada del mismo lender actualiza la fila existente', async () => {
    const model = makeModel();
    const handler = _factories.savePreferences(model);

    await handler({ user: { id: 23 }, body: { minApy: 4, autoMatch: false } }, makeRes());
    const res2 = makeRes();
    await handler({ user: { id: 23 }, body: { minApy: 9, autoMatch: true } }, res2);

    expect(res2.statusCode).toBe(201);
    expect(model.store.rows.length).toBe(1);
    expect(parseFloat(res2.body.preference.minApy)).toBe(9);
    expect(res2.body.preference.autoMatch).toBe(true);
  });

  test('CE5 (fallo de modelo): error de persistencia responde 500 controlado', async () => {
    const failingModel = {
      async findOne() { return null; },
      async create() { throw new Error('DB caída'); }
    };
    const handler = _factories.savePreferences(failingModel);
    const res = makeRes();
    await handler({ user: { id: 24 }, body: { maxAmount: 1, minApy: 1, maxLtv: 1, minCreditScore: 1, collateralTypes: ['ETH'], autoMatch: true } }, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/preferencias/i);
  });
});
