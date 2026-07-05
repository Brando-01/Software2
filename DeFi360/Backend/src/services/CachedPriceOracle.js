const IPriceOracle = require('../interfaces/IPriceOracle');

class CachedPriceOracle extends IPriceOracle {
    constructor(oracle, ttlMs = 30000) {
        super();
        this.oracle = oracle;
        this.ttlMs = ttlMs;
        this.cache = new Map();
        this.stats = { hits: 0, misses: 0 };
    }

    async getPrice(symbol) {
        const key = symbol.toUpperCase();
        const entry = this.cache.get(key);
        const now = Date.now();

        if (entry && entry.expiresAt > now) {
            this.stats.hits++;
            console.log(`[Oracle] HIT  ${key} = ${entry.price}`);
            return entry.price;
        }

        this.stats.misses++;
        const price = await this.oracle.getPrice(symbol);
        this.cache.set(key, { price, expiresAt: now + this.ttlMs });
        console.log(`[Oracle] MISS ${key} = ${price}`);
        return price;
    }

    async getPrices(symbols) {
        const result = {};
        for (const symbol of symbols) {
            try {
                result[symbol.toUpperCase()] = await this.getPrice(symbol);
            } catch (error) {
                result[symbol.toUpperCase()] = null;
            }
        }
        return result;
    }

    async isSymbolSupported(symbol) {
        return this.oracle.isSymbolSupported(symbol);
    }

    invalidate(symbol) {
        this.cache.delete(symbol.toUpperCase());
    }

    clear() {
        this.cache.clear();
    }

    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total === 0 ? 0 : this.stats.hits / total;
        return { ...this.stats, hitRate: parseFloat(hitRate.toFixed(2)) };
    }
}

module.exports = CachedPriceOracle;
