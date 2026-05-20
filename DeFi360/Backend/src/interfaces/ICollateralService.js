class ICollateralService {
    async getPrice(collateralType) {
        throw new Error('ICollateralService.getPrice() debe ser implementado');
    }

    async calculateValue(collateralType, collateralAmount) {
        throw new Error('ICollateralService.calculateValue() debe ser implementado');
    }

    async isSufficient(loanAmount, collateralType, collateralAmount) {
        throw new Error('ICollateralService.isSufficient() debe ser implementado');
    }
}

module.exports = ICollateralService;