

function equal(a, b, msg) {
  if (a !== b) throw new Error(msg || `Esperado ${b} pero fue ${a}`);
}
function ok(val, msg) {
  if (!val) throw new Error(msg || 'No es verdadero');
}

const SimulatedOracleAdapter = require('../services/SimulatedOracleAdapter');
const CachedPriceOracle = require('../services/CachedPriceOracle');
const { _factories } = require('../controllers/loanController');
const marketplaceController = require('../controllers/marketplaceController');

function buildOracle() {
  const adapter = new SimulatedOracleAdapter();
  const oracle = new CachedPriceOracle(adapter, 30000);
  oracle.adapter = adapter;
  return oracle;
}

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };
}

describe('GET /marketplace/prices (getPrices)', () => {
  test('Devuelve { success, prices, ttlMs } con todos los símbolos soportados', async () => {
    const oracle = buildOracle();

    const getPrices = (priceOracle) => async (req, res) => {
      const symbols = priceOracle.adapter.getSupportedSymbols();
      const prices = await priceOracle.getPrices(symbols);
      res.json({ success: true, prices, ttlMs: priceOracle.ttlMs });
    };

    const res = mockRes();
    await getPrices(oracle)({}, res);

    equal(res.body.success, true);
    equal(res.body.ttlMs, 30000);
    equal(res.body.prices.ETH, 3000);
    equal(res.body.prices.BTC, 50000);
    ok(Object.keys(res.body.prices).length >= 8, 'Debe traer todos los símbolos soportados');
  });

  test('El singleton real expone getPrices y devuelve precios deterministas', async () => {
    const res = mockRes();
    await marketplaceController.getPrices({}, res);
    equal(res.body.success, true);
    equal(res.body.prices.ETH, 3000);
  });
});

describe('POST /loans/simulate (simulate)', () => {
  test('Sin shock: LTV saludable (riesgo bajo)', async () => {
    const oracle = buildOracle();
    const handler = _factories.simulate(oracle);

    const req = { body: { loanAmount: 1000, collateralType: 'ETH', collateralAmount: 1, priceShockPct: 0 } };
    const res = mockRes();
    await handler(req, res);

    equal(res.body.basePrice, 3000);
    equal(res.body.shockedPrice, 3000);
    equal(res.body.collateralValue, 3000);

    ok(res.body.ltv < 75, 'LTV debería ser bajo sin shock');
    equal(res.body.riskLevel, 'low');
    equal(res.body.isHealthy, true);
  });

  test('Shock negativo de precio SUBE el LTV y dispara riskLevel alto/crítico', async () => {
    const oracle = buildOracle();
    const handler = _factories.simulate(oracle);

    const req = { body: { loanAmount: 2000, collateralType: 'ETH', collateralAmount: 1, priceShockPct: -40 } };
    const res = mockRes();
    await handler(req, res);

    equal(res.body.basePrice, 3000);
    equal(res.body.shockedPrice, 1800);
    ok(res.body.ltv > 95, `El shock negativo debió elevar el LTV por encima de 95 (fue ${res.body.ltv})`);
    ok(res.body.riskLevel === 'high' || res.body.riskLevel === 'critical',
      `riskLevel debió ser alto/crítico (fue ${res.body.riskLevel})`);
    equal(res.body.isHealthy, false);
  });

  test('Monotonía: a mayor caída de precio, mayor LTV', async () => {
    const oracle = buildOracle();
    const handler = _factories.simulate(oracle);
    const run = async (shock) => {
      const res = mockRes();
      await handler({ body: { loanAmount: 1500, collateralType: 'ETH', collateralAmount: 1, priceShockPct: shock } }, res);
      return res.body.ltv;
    };
    const ltv0 = await run(0);
    const ltv20 = await run(-20);
    const ltv40 = await run(-40);
    ok(ltv20 > ltv0 && ltv40 > ltv20, 'El LTV debe crecer al profundizar el shock negativo');
  });

  test('Faltan campos obligatorios -> HTTP 400', async () => {
    const handler = _factories.simulate(buildOracle());
    const res = mockRes();
    await handler({ body: { collateralAmount: 1 } }, res);
    equal(res.statusCode, 400);
  });
});
