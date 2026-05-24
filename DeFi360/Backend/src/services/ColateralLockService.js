const ICollateralService = require('../interfaces/ICollateralService');

class ColateralLockService extends ICollateralService {
    async lockFunds(wallet, amount) {
        await wallet.update({
            availableBalance: parseFloat(wallet.availableBalance) - parseFloat(amount),
            blockedBalance: parseFloat(wallet.blockedBalance) + parseFloat(amount)
        });
    }

    async unlockFunds(wallet, amount) {
        await wallet.update({
            availableBalance: parseFloat(wallet.availableBalance) + parseFloat(amount),
            blockedBalance: parseFloat(wallet.blockedBalance) - parseFloat(amount)
        });
    }

    async getPrice(collateralType) {
        throw new Error('getPrice() no aplica en ColateralLockService');
    }

    async calculateValue(collateralType, collateralAmount) {
        throw new Error('calculateValue() no aplica en ColateralLockService');
    }

    async isSufficient(loanAmount, collateralType, collateralAmount) {
        throw new Error('isSufficient() no aplica en ColateralLockService');
    }
}

module.exports = ColateralLockService;