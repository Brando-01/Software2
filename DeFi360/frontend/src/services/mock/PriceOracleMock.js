import { IPriceOracle } from "../interfaces/IPriceOracle";

export class PriceOracleMock extends IPriceOracle {
    constructor(){
        super();

        this.mockPrices = {
            BTC: 65000,
            ETH: 3200,
            USDC: 1,
            DAI: 1,
            LINK: 25,
            AAVE: 350
        };
    }

    async getPrice(symbol){
        const upperSymbol = symbol.toUpperCase();
        if (!this.mockPrices.hasOwnProperty(upperSymbol)) {
            throw new Error(`Asset '${symbol}' no soportado en el mock oracle`);
        }
        return this.mockPrices[upperSymbol];
    }

    async getPrices(symbols){
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

    async isSymbolSupported(symbol){
        return this.mockPrices.hasOwnProperty(symbol.toUpperCase());
    }
}