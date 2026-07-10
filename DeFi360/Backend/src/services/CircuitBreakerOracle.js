const IPriceOracle = require('../interfaces/IPriceOracle');
const retry = require('../utils/retry');
// Clase que implementa un oráculo de precios con un patrón de "circuit breaker" para manejar fallas en la obtención de precios y proporcionar un mecanismo de recuperación.
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
  // Obtención del precio de un símbolo específico, manejando el estado del "circuit breaker" y proporcionando un precio en caché en caso de fallas.
  async getPrice(symbol) {
    const key = String(symbol).toUpperCase();

    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttempt) {

        this.state = 'HALF_OPEN';
      } else {
        return this._serveFallback(key, symbol);
      }
    }
    // Intento de obtener el precio del oráculo subyacente con reintentos en caso de fallas.
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
  // Obtención de los precios de múltiples símbolos, manejando cada símbolo individualmente y proporcionando precios en caché en caso de fallas.
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
  // Verificación de si un símbolo específico es compatible con el oráculo subyacente.
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
  // Manejo de un intento exitoso de obtención de precio, actualizando el estado del "circuit breaker" y almacenando el precio en caché.
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
  // Obtención de estadísticas del oráculo, incluyendo el número de aciertos, fallos y la tasa de aciertos.
  getStats() {

    if (this.oracle && typeof this.oracle.getStats === 'function') {
      return this.oracle.getStats();
    }
    return { hits: 0, misses: 0, hitRate: 0 };
  }

  get ttlMs() {
    return this.oracle ? this.oracle.ttlMs : undefined;
  }
  // Invalidación del precio en caché para un símbolo específico, si el oráculo subyacente proporciona esta funcionalidad.
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
