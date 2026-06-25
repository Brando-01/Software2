const IRiskStrategy = require('../interfaces/IRiskStrategy');
const RISK_THRESHOLDS = require('../services/riskThresholds');

class LTVRiskStrategy extends IRiskStrategy {

    constructor(thresholds = {}) {
        super();
        this.thresholds = {
            medium: thresholds.medium ?? RISK_THRESHOLDS.MEDIUM,
            high: thresholds.high ?? RISK_THRESHOLDS.HIGH,
            critical: thresholds.critical ?? RISK_THRESHOLDS.CRITICAL
        };
    }

    evaluate(loanAmount, collateralValue) {
        if (collateralValue <= 0) {
            throw new Error('El valor del colateral debe ser mayor a cero');
        }

        const ltv = (loanAmount / collateralValue) * 100;
        const ratio = ltv.toFixed(2);
        const { medium, high, critical } = this.thresholds;

        let riskLevel = 'low';
        if (ltv >= critical) riskLevel = 'critical';
        else if (ltv >= high) riskLevel = 'high';
        else if (ltv >= medium) riskLevel = 'medium';

        const isHealthy = ltv < high;
        const message = isHealthy ? 'LTV aceptable.' : 'LTV alto, riesgo de liquidación.';

        return { ratio, riskLevel, isHealthy, message };
    }
}

module.exports = LTVRiskStrategy;
