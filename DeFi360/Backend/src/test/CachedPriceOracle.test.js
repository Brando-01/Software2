const CachedPriceOracle = require('../services/CachedPriceOracle');

function equal(a, b, msg) {
  if (a !== b) throw new Error(msg || `Esperado ${b} pero fue ${a}`);
}
function ok(val, msg) {
  if (!val) throw new Error(msg || 'No es verdadero');
}

class SpyOracle {
  constructor() {
    this.calls = 0;
    this.value = 3000;
  }
  async getPrice() {
    this.calls++;
    return this.value;
  }
  async isSymbolSupported() {
    return true;
  }
}

describe('CachedPriceOracle', () => {

  test('La segunda lectura del mismo activo es un HIT y no toca al oráculo', async () => {
    const spy = new SpyOracle();
    const cached = new CachedPriceOracle(spy, 30000);

    await cached.getPrice('ETH');
    await cached.getPrice('ETH');
    await cached.getPrice('ETH');

    equal(spy.calls, 1, 'El oráculo debió consultarse una sola vez');

    const stats = cached.getStats();
    equal(stats.misses, 1);
    equal(stats.hits, 2);
  });

  test('Un precio expirado por TTL fuerza un nuevo MISS', async () => {
    const spy = new SpyOracle();
    const cached = new CachedPriceOracle(spy, 0);

    await cached.getPrice('ETH');
    await cached.getPrice('ETH');

    equal(spy.calls, 2, 'Con TTL=0 cada lectura debe golpear al oráculo');
  });

  test('invalidate fuerza la relectura de un activo puntual', async () => {
    const spy = new SpyOracle();
    const cached = new CachedPriceOracle(spy, 30000);

    await cached.getPrice('ETH');
    cached.invalidate('ETH');
    await cached.getPrice('ETH');

    equal(spy.calls, 2);
  });

  test('Sigue siendo un IPriceOracle (intercambiable por DIP)', async () => {
    const cached = new CachedPriceOracle(new SpyOracle());
    ok(typeof cached.getPrice === 'function');
    ok(typeof cached.getPrices === 'function');
    ok(typeof cached.isSymbolSupported === 'function');
  });
});
