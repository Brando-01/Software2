const ICollateralService = require('../interfaces/ICollateralService');
const priceOracle = require('./priceOracle');

class CollateralService extends ICollateralService {

    constructor(oracle = priceOracle) {
        super();
        this.oracle = oracle;
    }

    async getPrice(collateralType) {
        return this.oracle.getPrice(collateralType);
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
