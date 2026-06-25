
class IPriceOracle {

    async getPrice(symbol) {
        throw new Error('IPriceOracle.getPrice() debe ser implementado');
    }


    async getPrices(symbols) {
        throw new Error('IPriceOracle.getPrices() debe ser implementado');
    }


    async isSymbolSupported(symbol) {
        throw new Error('IPriceOracle.isSymbolSupported() debe ser implementado');
    }
}

module.exports = IPriceOracle;
