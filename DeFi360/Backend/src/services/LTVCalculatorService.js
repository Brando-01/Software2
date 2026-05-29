
class LTVCalculatorService {
  /** 
   * @param {number} loanAmount
   * @param {number} collateralValue 
   * @returns {Object} LTVResult 
   */
  static calculateLTV(loanAmount, collateralValue) {
    if (!collateralValue || collateralValue <= 0) {
      throw new Error("El valor del colateral debe ser mayor a 0");
    }

    const ratio = (loanAmount / collateralValue) * 100;
    let riskLevel = 'LOW';
    let isHealthy = true;
    let message = 'LTV Saludable';

    if (ratio >= 95) {
      riskLevel = 'LIQUIDATION';
      isHealthy = false;
      message = 'ALERTA: Riesgo inminente de liquidación';
    } else if (ratio >= 90) {
      riskLevel = 'HIGH';
      isHealthy = false;
      message = 'PRECAUCIÓN: LTV cerca del límite de liquidación';
    } else if (ratio >= 75) {
      riskLevel = 'MEDIUM';
    }

    // Retorna la estructura LTVResult esperada
    return {
      ratio: parseFloat(ratio.toFixed(2)),
      isHealthy,
      riskLevel,
      message
    };
  }
}

module.exports = LTVCalculatorService;