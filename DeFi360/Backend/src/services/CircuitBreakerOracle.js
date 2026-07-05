const IPriceOracle = require('../interfaces/IPriceOracle');
const retry = require('../utils/retry');

class CircuitBreakerOracle extends IPriceOracle {
  constructor(oracle, options = {}) {
    super();
    this.oracle = oracle;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.retryOptions = options.retry ?? { retries: 2, baseDelay: 10 };

    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = 0;

    this.lastKnownPrice = new Map();
  }

    async getPrice(symbol) {
    const key = String(symbol).toUpperCase();

    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttempt) {

        this.state = 'HALF_OPEN';
      } else {
        return this._serveFallback(key, symbol);
      }
    }

    try {
      const price = await retry(() => this.oracle.getPrice(symbol), this.retryOptions);
      this._onSuccess(key, price);
      return price;
    } catch (error) {
      this._onFailure();

      const fallback = this.lastKnownPrice.get(key);
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  }

  async getPrices(symbols) {
    const result = {};
    for (const symbol of symbols) {
      try {
        result[String(symbol).toUpperCase()] = await this.getPrice(symbol);
      } catch (error) {
        result[String(symbol).toUpperCase()] = null;
      }
    }
    return result;
  }

  async isSymbolSupported(symbol) {
    return this.oracle.isSymbolSupported(symbol);
  }

    _serveFallback(key, symbol) {
    const fallback = this.lastKnownPrice.get(key);
    if (fallback !== undefined) {
      return Promise.resolve(fallback);
    }
    return Promise.reject(
      new Error(`Circuit breaker OPEN y sin precio en caché para '${symbol}'`)
    );
  }

    _onSuccess(key, price) {
    this.lastKnownPrice.set(key, price);
    this.successCount++;
    this.failureCount = 0;

    this.state = 'CLOSED';
  }

    _onFailure() {
    this.failureCount++;
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this._open();
    }
  }

    _open() {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.resetTimeoutMs;
  }

    getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold
    };
  }

  getStats() {

    if (this.oracle && typeof this.oracle.getStats === 'function') {
      return this.oracle.getStats();
    }
    return { hits: 0, misses: 0, hitRate: 0 };
  }

  get ttlMs() {
    return this.oracle ? this.oracle.ttlMs : undefined;
  }

  invalidate(symbol) {
    if (this.oracle && typeof this.oracle.invalidate === 'function') {
      this.oracle.invalidate(symbol);
    }
  }

  clear() {
    if (this.oracle && typeof this.oracle.clear === 'function') {
      this.oracle.clear();
    }
  }
}

module.exports = CircuitBreakerOracle;
