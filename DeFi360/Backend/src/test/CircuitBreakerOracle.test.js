const CircuitBreakerOracle = require('../services/CircuitBreakerOracle');

function makeFakeOracle() {
  return {
    shouldFail: false,
    calls: 0,
    price: 3000,
    async getPrice(symbol) {
      this.calls++;
      if (this.shouldFail) throw new Error('oracle down');
      return this.price;
    },
    async isSymbolSupported() { return true; }
  };
}

describe('CircuitBreakerOracle (Circuit Breaker + Retry)', () => {
  test('CLOSED: pasa la llamada al oráculo interno y devuelve el precio', async () => {
    const fake = makeFakeOracle();
    const breaker = new CircuitBreakerOracle(fake, { failureThreshold: 3, retry: { retries: 0 } });

    const price = await breaker.getPrice('ETH');
    expect(price).toBe(3000);
    expect(breaker.getState().state).toBe('CLOSED');
  });

  test('Abre el circuito (OPEN) tras alcanzar el umbral de fallos', async () => {
    const fake = makeFakeOracle();
    fake.shouldFail = true;
    const breaker = new CircuitBreakerOracle(fake, { failureThreshold: 3, retry: { retries: 0 } });

    for (let i = 0; i < 3; i++) {
      await expect(breaker.getPrice('ETH')).rejects.toThrow();
    }

    expect(breaker.getState().state).toBe('OPEN');
  });

  test('OPEN: sirve el último precio cacheado (fallback) sin llamar al oráculo', async () => {
    const fake = makeFakeOracle();
    const breaker = new CircuitBreakerOracle(fake, { failureThreshold: 2, retry: { retries: 0 } });

    await breaker.getPrice('ETH');
    const callsAfterSuccess = fake.calls;

    fake.shouldFail = true;
    await breaker.getPrice('ETH');
    await breaker.getPrice('ETH');
    expect(breaker.getState().state).toBe('OPEN');

    const callsBefore = fake.calls;
    const price = await breaker.getPrice('ETH');
    expect(price).toBe(3000);
    expect(fake.calls).toBe(callsBefore);
    expect(callsAfterSuccess).toBeGreaterThan(0);
  });

  test('HALF_OPEN -> CLOSED: tras el timeout, una llamada exitosa cierra el circuito', async () => {
    const fake = makeFakeOracle();
    fake.shouldFail = true;
    const breaker = new CircuitBreakerOracle(fake, {
      failureThreshold: 2,
      resetTimeoutMs: 5,
      retry: { retries: 0 }
    });

    await breaker.getPrice('ETH').catch(() => {});
    await breaker.getPrice('ETH').catch(() => {});
    expect(breaker.getState().state).toBe('OPEN');

    await new Promise((r) => setTimeout(r, 10));
    fake.shouldFail = false;
    const price = await breaker.getPrice('ETH');
    expect(price).toBe(3000);
    expect(breaker.getState().state).toBe('CLOSED');
  });

  test('Retry: reintenta la llamada interna antes de contar el fallo', async () => {
    let attempts = 0;
    const flaky = {
      async getPrice() {
        attempts++;
        if (attempts < 2) throw new Error('transient');
        return 1234;
      },
      async isSymbolSupported() { return true; }
    };
    const breaker = new CircuitBreakerOracle(flaky, { retry: { retries: 2, baseDelay: 1 } });

    const price = await breaker.getPrice('BTC');
    expect(price).toBe(1234);
    expect(attempts).toBe(2);
    expect(breaker.getState().state).toBe('CLOSED');
  });
});
