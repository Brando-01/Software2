
const IPriceOracle = require('../interfaces/IPriceOracle');

class SimulatedOracleAdapter extends IPriceOracle {
    constructor() {
        super();

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



        this.volatility = 0;
    }


    async getPrice(symbol) {
        const symbol_upper = symbol.toUpperCase();

        if (!this.prices.hasOwnProperty(symbol_upper)) {
            throw new Error(`Activo '${symbol}' no soportado en el oráculo simulado`);
        }


        const basePrice = this.prices[symbol_upper];
        const variation = (Math.random() - 0.5) * 2 * this.volatility;
        const volatilePrice = basePrice * (1 + variation);

        return parseFloat(volatilePrice.toFixed(2));
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
        return this.prices.hasOwnProperty(symbol.toUpperCase());
    }


    setPrice(symbol, price) {
        this.prices[symbol.toUpperCase()] = price;
    }


    getSupportedSymbols() {
        return Object.keys(this.prices);
    }


    setVolatility(volatility) {
        this.volatility = Math.max(0, Math.min(1, volatility));
    }
}

module.exports = SimulatedOracleAdapter;
