const IRiskStrategy = require('../interfaces/IRiskStrategy');

class LTVThresholdStrategy extends IRiskStrategy {

    constructor(thresholds = {}) {
        super();
        this.thresholds = {
            moderado: thresholds.moderado ?? 75,
            alto: thresholds.alto ?? 90,
            liquidacion: thresholds.liquidacion ?? 95,
        };
    }

    evaluate(loan, currentPrice) {
        if (!loan || loan.remainingBalance === undefined) {
            throw new Error('LTVThresholdStrategy: loan inválido o sin remainingBalance');
        }
        if (!currentPrice || currentPrice <= 0) {
            throw new Error('LTVThresholdStrategy: currentPrice debe ser mayor a cero');
        }

        const collateralAmount = loan.collateral?.amount ?? loan.collateralAmount;
        if (!collateralAmount || collateralAmount <= 0) {
            throw new Error('LTVThresholdStrategy: loan no tiene colateral válido');
        }

        const collateralValueUSD = collateralAmount * currentPrice;
        const ltv = (parseFloat(loan.remainingBalance) / collateralValueUSD) * 100;

        const { moderado, alto, liquidacion } = this.thresholds;
        const { RiskLevel } = IRiskStrategy;

        if (ltv >= liquidacion) return RiskLevel.LIQUIDACION_INMINENTE;
        if (ltv >= alto) return RiskLevel.RIESGO_ALTO;
        if (ltv >= moderado) return RiskLevel.RIESGO_MODERADO;
        return RiskLevel.NORMAL;
    }
}

module.exports = LTVThresholdStrategy;
