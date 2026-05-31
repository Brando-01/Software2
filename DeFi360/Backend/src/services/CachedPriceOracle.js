/**
 * CachedPriceOracle: Táctica de performance "Caché con TTL" sobre el oráculo de precios.
 *
 * Decora cualquier IPriceOracle y mantiene en memoria el último precio consultado
 * por activo durante una ventana de tiempo (ttlMs). Mientras el precio siga vigente
 * se sirve desde memoria (HIT); si expiró o nunca se consultó, se delega al oráculo
 * envuelto (MISS) y se vuelve a cachear.
 *
 * Motivación: el Marketplace consulta el precio del colateral una vez por oferta.
 * Sin caché, 40 ofertas con colateral ETH disparan 40 lecturas al oráculo para el
 * mismo símbolo. En DeFi real el oráculo (ej. Chainlink) tiene costo y rate-limit,
 * por lo que el precio se refresca por intervalos, no en cada lectura.
 *
 * SOLID: DIP/OCP - implementa IPriceOracle, por lo que es intercambiable con el
 * oráculo real sin tocar a sus consumidores.
 */
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
            console.log(`[Oracle] HIT  ${key} = ${entry.price} (desde caché)`);
            return entry.price;
        }

        this.stats.misses++;
        const price = await this.oracle.getPrice(symbol);
        this.cache.set(key, { price, expiresAt: now + this.ttlMs });
        console.log(`[Oracle] MISS ${key} = ${price} (consulta al oráculo, cacheado ${this.ttlMs}ms)`);
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
