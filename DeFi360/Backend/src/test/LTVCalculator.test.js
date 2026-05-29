const LTVRiskStrategy = require('../strategies/LTVRiskStrategy');

class LTVCalculator {
  constructor(config = {}) {
    this.normal = config.normal ?? 50;
    this.alert = config.alert ?? 90;
    this.liquidation = config.liquidation ?? 95;
  }

  calc(loan, collateral) {
    if (collateral <= 0) {
      throw new Error('El colateral (garantía) debe ser mayor a 0');
    }
    if (loan < 0) {
      throw new Error('El préstamo no puede ser negativo');
    }

    const ltv = (loan / collateral) * 100;
    const ratio = ltv.toFixed(2);

    let level = 'low';
    let msg = 'Safe';
    let healthy = true;

    // Aquí había un pequeño bug lógico en el código original de la IA:
    // Si la liquidación es 95, ¿qué pasa si el ltv es EXACTAMENTE 95?
    // Usaremos '>=' para ser más estrictos.
    if (ltv >= this.liquidation) {
      level = 'liquidation';
      msg = 'CRITICAL - Liquidation incoming';
      healthy = false;
    } else if (ltv >= this.alert) {
      level = 'alert';
      msg = 'HIGH RISK';
      healthy = false;
    } else if (ltv >= this.normal) {
      level = 'medium';
      msg = 'Moderate risk';
      healthy = true;
    }

    return { ltv: parseFloat(ratio), ratio, level, healthy, msg };
  }

  getConfig() {
    return { normal: this.normal, alert: this.alert, liquidation: this.liquidation };
  }

  setConfig(cfg) {
    if (cfg.normal !== undefined) this.normal = cfg.normal;
    if (cfg.alert !== undefined) this.alert = cfg.alert;
    if (cfg.liquidation !== undefined) this.liquidation = cfg.liquidation;
  }

  isHealthy(ltv) {
    // Corregimos la lógica para que coincida con el cálculo de arriba
    return ltv < this.liquidation; 
  }
}

module.exports = LTVCalculator;
