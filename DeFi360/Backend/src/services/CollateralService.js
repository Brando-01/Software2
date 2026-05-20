const ICollateralService = require('../interfaces/ICollateralService');

const DEFAULT_PRICES = {
    ETH: 3000,
    BTC: 60000,
    USDC: 1,
    USDT: 1
};

class CollateralService extends ICollateralService {

    constructor(priceMap = DEFAULT_PRICES) {
        super();
        this.priceMap = priceMap;
    }

    async getPrice(collateralType) {
        const price = this.priceMap[collateralType?.toUpperCase()];
        if (price === undefined) {
            throw new Error(`Tipo de colateral no soportado: ${collateralType}`);
        }
        return price;
    }

    async calculateValue(collateralType, collateralAmount) {
        const price = await this.getPrice(collateralType);
        return parseFloat(collateralAmount) * price;
    }

    async isSufficient(loanAmount, collateralType, collateralAmount) {
        const collateralValue = await this.calculateValue(collateralType, collateralAmount);
        return collateralValue >= parseFloat(loanAmount);
    }
}

module.exports = CollateralService;

