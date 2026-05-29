export class IPriceOracle {
    async getPrice(symbol) {
        throw new Error("getPrice() debe ser implementado");
    }

    async getPrices(symbols) {
        throw new Error("getPrices() debe ser implementado");
    }

    async isSymbolSupported(symbol) {
        throw new Error("isSymbolSupported() debe ser implementado");
    }
}