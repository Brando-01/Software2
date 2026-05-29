/**
 * SimulatedOracleAdapter: Implementación simulada de price oracle
 * Usada para desarrollo, testing y ambientes simulados
 * Proporciona precios de activos ficticios para pruebas
 * SOLID: DIP - Implementa IPriceOracle
 */
const IPriceOracle = require('../interfaces/IPriceOracle');

class SimulatedOracleAdapter extends IPriceOracle {
    constructor() {
        super();
        // Precios simulados iniciales para activos comunes
        this.prices = {
            'ETH': 3000.00,
            'BTC': 50000.00,
            'USDC': 1.00,
            'DAI': 1.00,
            'USDT': 1.00,
            'LINK': 25.00,
            'AAVE': 350.00,
            'UNI': 6.50
        };
        
        // Variabilidad de precios (para simular cambios)
        this.volatility = 0.02; // 2% de variación máxima
    }

    /**
     * Obtiene el precio de un activo (con variabilidad simulada)
     */
    async getPrice(symbol) {
        const symbol_upper = symbol.toUpperCase();
        
        if (!this.prices.hasOwnProperty(symbol_upper)) {
            throw new Error(`Activo '${symbol}' no soportado en el oráculo simulado`);
        }

        // Simular variabilidad en el precio
        const basePrice = this.prices[symbol_upper];
        const variation = (Math.random() - 0.5) * 2 * this.volatility;
        const volatilePrice = basePrice * (1 + variation);

        return parseFloat(volatilePrice.toFixed(2));
    }

    /**
     * Obtiene precios de múltiples activos
     */
    async getPrices(symbols) {
        const result = {};
        
        for (const symbol of symbols) {
            try {
                result[symbol.toUpperCase()] = await this.getPrice(symbol);
            } catch (error) {
                // Continuar con otros símbolos si uno falla
                result[symbol.toUpperCase()] = null;
            }
        }

        return result;
    }

    /**
     * Valida si un símbolo es soportado
     */
    async isSymbolSupported(symbol) {
        return this.prices.hasOwnProperty(symbol.toUpperCase());
    }

    /**
     * Actualiza el precio base de un activo (útil para tests)
     */
    setPrice(symbol, price) {
        this.prices[symbol.toUpperCase()] = price;
    }

    /**
     * Obtiene lista de símbolos soportados
     */
    getSupportedSymbols() {
        return Object.keys(this.prices);
    }

    /**
     * Configura la volatilidad de precios (0 a 1)
     */
    setVolatility(volatility) {
        this.volatility = Math.max(0, Math.min(1, volatility));
    }
}

module.exports = SimulatedOracleAdapter;
