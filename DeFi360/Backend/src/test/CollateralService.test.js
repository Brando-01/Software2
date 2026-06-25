

function equal(a, b, msg) {
  if (a !== b) throw new Error(msg || `Esperado ${b} pero fue ${a}`);
}
function ok(val, msg) {
  if (!val) throw new Error(msg || 'No es verdadero');
}

const CollateralService = require('../services/CollateralService');

describe('CollateralService (DIP)', () => {

  test('Delega getPrice en el oráculo inyectado', async () => {
    let askedFor = null;
    const fakeOracle = {
      getPrice: async (symbol) => { askedFor = symbol; return 1234; }
    };
    const svc = new CollateralService(fakeOracle);

    const price = await svc.getPrice('ETH');
    equal(price, 1234);
    equal(askedFor, 'ETH', 'Debió consultar al oráculo inyectado');
  });

  test('calculateValue = amount * precioDelOráculo (no precios propios)', async () => {
    const fakeOracle = { getPrice: async () => 2000 };
    const svc = new CollateralService(fakeOracle);

    const value = await svc.calculateValue('ETH', 3);
    equal(value, 6000, '3 ETH * 2000 = 6000');
  });

  test('Si cambia el oráculo, cambia el resultado (sin estado de precios propio)', async () => {
    const svcA = new CollateralService({ getPrice: async () => 100 });
    const svcB = new CollateralService({ getPrice: async () => 999 });
    equal(await svcA.calculateValue('ETH', 1), 100);
    equal(await svcB.calculateValue('ETH', 1), 999);
  });

  test('isSufficient compara contra el valor que da el oráculo', async () => {
    const svc = new CollateralService({ getPrice: async () => 3000 });
    equal(await svc.isSufficient(1000, 'ETH', 1), true);
    equal(await svc.isSufficient(5000, 'ETH', 1), false);
  });

  test('NO declara un mapa de precios propio en la instancia', () => {
    const svc = new CollateralService({ getPrice: async () => 1 });
    ok(svc.prices === undefined, 'CollateralService ya no debe tener mapa de precios propio');
    ok(typeof svc.oracle.getPrice === 'function', 'Debe apoyarse en el oráculo inyectado');
  });
});
