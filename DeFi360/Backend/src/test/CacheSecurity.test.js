

function equal(a, b, msg) {
  if (a !== b) throw new Error(msg || `Esperado ${b} pero fue ${a}`);
}
function ok(val, msg) {
  if (!val) throw new Error(msg || 'No es verdadero');
}

const SimulatedOracleAdapter = require('../services/SimulatedOracleAdapter');
const CachedPriceOracle = require('../services/CachedPriceOracle');

describe('Táctica de caché - mitigaciones de seguridad', () => {

  describe('1) Validación de fuente (no cache poisoning)', () => {
    test('Símbolo no soportado: el oráculo base lanza error', async () => {
      const adapter = new SimulatedOracleAdapter();
      let threw = false;
      try {
        await adapter.getPrice('FAKECOIN');
      } catch (e) {
        threw = true;
        ok(/no soportado/i.test(e.message), 'El mensaje debe indicar símbolo no soportado');
      }
      ok(threw, 'Un símbolo inválido DEBE lanzar error, no devolver basura');
    });

    test('La caché NO almacena una entrada para un símbolo inválido', async () => {
      const adapter = new SimulatedOracleAdapter();
      const cached = new CachedPriceOracle(adapter, 30000);

      let threw = false;
      try {
        await cached.getPrice('FAKECOIN');
      } catch (e) {
        threw = true;
      }
      ok(threw, 'getPrice debe propagar el error del símbolo inválido');

      equal(cached.cache.has('FAKECOIN'), false, 'No debe haber entrada en caché para símbolo inválido');
      equal(cached.cache.size, 0, 'La caché debe quedar vacía tras el intento inválido');
    });

    test('getPrices marca null para inválidos sin contaminar los válidos', async () => {
      const adapter = new SimulatedOracleAdapter();
      const cached = new CachedPriceOracle(adapter, 30000);

      const prices = await cached.getPrices(['ETH', 'FAKECOIN']);
      equal(prices.ETH, 3000, 'El válido se resuelve con precio real');
      equal(prices.FAKECOIN, null, 'El inválido queda en null, no en un valor basura cacheado');
      equal(cached.cache.has('FAKECOIN'), false, 'El inválido no se cachea');
    });
  });

  describe('2) Staleness acotada por TTL', () => {
    test('Tras expirar el TTL hay un MISS (relectura) que acota lo obsoleto', async () => {
      let served = 3000;
      const oracleSpy = {
        calls: 0,
        async getPrice() { this.calls++; return served; },
        async isSymbolSupported() { return true; }
      };

      const cached = new CachedPriceOracle(oracleSpy, 10);

      const first = await cached.getPrice('ETH');
      equal(first, 3000);
      equal(oracleSpy.calls, 1);

      const hit = await cached.getPrice('ETH');
      equal(hit, 3000);
      equal(oracleSpy.calls, 1, 'Dentro del TTL debe servir de caché (HIT)');

      served = 2500;
      await new Promise((r) => setTimeout(r, 20));

      const afterTtl = await cached.getPrice('ETH');
      equal(afterTtl, 2500, 'Tras el TTL debe releer el precio actualizado');
      equal(oracleSpy.calls, 2, 'La expiración del TTL fuerza un nuevo MISS');
    });

    test('TTL=0 nunca sirve datos obsoletos (cota = 0)', async () => {
      const oracleSpy = {
        calls: 0,
        async getPrice() { this.calls++; return 100 + this.calls; },
        async isSymbolSupported() { return true; }
      };
      const cached = new CachedPriceOracle(oracleSpy, 0);
      await cached.getPrice('ETH');
      await cached.getPrice('ETH');
      equal(oracleSpy.calls, 2, 'Con TTL=0 cada lectura relee (sin ventana obsoleta)');
    });
  });
});
