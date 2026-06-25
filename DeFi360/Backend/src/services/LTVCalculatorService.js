const RISK_THRESHOLDS = require('./riskThresholds');

class LTVCalculatorService {

  static calculateLTV(loanAmount, collateralValue) {
    if (!collateralValue || collateralValue <= 0) {
      throw new Error("El valor del colateral debe ser mayor a 0");
    }

    const ratio = (loanAmount / collateralValue) * 100;
    let riskLevel = 'low';
    let isHealthy = true;
    let message = 'LTV saludable';

    if (ratio >= RISK_THRESHOLDS.CRITICAL) {
      riskLevel = 'critical';
      isHealthy = false;
      message = 'ALERTA: riesgo inminente de liquidación';
    } else if (ratio >= RISK_THRESHOLDS.HIGH) {
      riskLevel = 'high';
      isHealthy = false;
      message = 'PRECAUCIÓN: LTV cerca del límite de liquidación';
    } else if (ratio >= RISK_THRESHOLDS.MEDIUM) {
      riskLevel = 'medium';
    }

    return {
      ratio: parseFloat(ratio.toFixed(2)),
      isHealthy,
      riskLevel,
      message
    };
  }
}

module.exports = LTVCalculatorService;