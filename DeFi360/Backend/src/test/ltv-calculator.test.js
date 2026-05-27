const LTVRiskStrategy = require('../strategies/LTVRiskStrategy');

function equal(a, b, msg) {
  if (a !== b) throw new Error(msg || `${b} !== ${a}`);
}

function ok(val, msg) {
  if (!val) throw new Error(msg || 'Not ok');
}

class LTVCalculator {
  constructor(config = {}) {
    this.normal = config.normal ?? 50;
    this.alert = config.alert ?? 90;
    this.liquidation = config.liquidation ?? 95;
  }

  calc(loan, collateral) {
    if (collateral <= 0) {
      throw new Error('Collateral must be > 0');
    }
    if (loan < 0) {
      throw new Error('Loan cannot be negative');
    }

    const ltv = (loan / collateral) * 100;
    const ratio = ltv.toFixed(2);

    let level = 'low';
    let msg = 'Safe';
    let healthy = true;

    if (ltv > this.liquidation) {
      level = 'liquidation';
      msg = 'CRITICAL - Liquidation incoming';
      healthy = false;
    } else if (ltv > this.alert) {
      level = 'alert';
      msg = 'HIGH RISK';
      healthy = false;
    } else if (ltv > this.normal) {
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
    return ltv <= this.liquidation;
  }
}

describe('LTV - Basic Calc', () => {
  let calc;

  beforeEach(() => {
    calc = new LTVCalculator({ normal: 50, alert: 90, liquidation: 95 });
  });

  test('LTV 50% = medium risk, healthy true', () => {
    const res = calc.calc(500, 1000);
    equal(res.ltv, 50);
    equal(res.level, 'medium');
    equal(res.healthy, true);
  });

  test('LTV 40% = low risk, healthy true', () => {
    const res = calc.calc(400, 1000);
    equal(res.ltv, 40);
    equal(res.level, 'low');
    equal(res.healthy, true);
  });

  test('LTV 90% = alert, healthy false', () => {
    const res = calc.calc(900, 1000);
    equal(res.ltv, 90);
    equal(res.level, 'alert');
    equal(res.healthy, false);
  });

  test('LTV 75% = alert, healthy false', () => {
    const res = calc.calc(750, 1000);
    equal(res.ltv, 75);
    equal(res.level, 'alert');
    equal(res.healthy, false);
  });

  test('LTV 95% = liquidation, healthy false', () => {
    const res = calc.calc(950, 1000);
    equal(res.ltv, 95);
    equal(res.level, 'liquidation');
    equal(res.healthy, false);
  });

  test('LTV 97% = liquidation', () => {
    const res = calc.calc(9700, 10000);
    equal(res.ltv, 97);
    equal(res.level, 'liquidation');
  });

  test('Zero collateral throws error', () => {
    try {
      calc.calc(500, 0);
      throw new Error('Should have thrown');
    } catch (err) {
      ok(err.message.includes('Collateral'));
    }
  });

  test('Negative collateral throws error', () => {
    try {
      calc.calc(500, -100);
      throw new Error('Should have thrown');
    } catch (err) {
      ok(err.message.includes('Collateral'));
    }
  });

  test('Negative loan throws error', () => {
    try {
      calc.calc(-500, 1000);
      throw new Error('Should have thrown');
    } catch (err) {
      ok(err.message.includes('negative'));
    }
  });

  test('Decimal precision 33.33%', () => {
    const res = calc.calc(333.33, 1000);
    equal(res.ratio, '33.33');
    equal(res.level, 'low');
  });
});

describe('LTV - Config', () => {
  test('Custom config on init', () => {
    const calc = new LTVCalculator({ normal: 60, alert: 85, liquidation: 92 });
    const cfg = calc.getConfig();
    equal(cfg.normal, 60);
    equal(cfg.alert, 85);
    equal(cfg.liquidation, 92);
  });

  test('Custom config affects calc', () => {
    const calc = new LTVCalculator({ normal: 40, alert: 70, liquidation: 85 });
    const res = calc.calc(750, 1000);
    equal(res.ltv, 75);
    equal(res.level, 'liquidation');
  });

  test('setConfig updates thresholds', () => {
    const calc = new LTVCalculator({ normal: 50, alert: 90, liquidation: 95 });
    calc.setConfig({ alert: 80, liquidation: 90 });
    
    const res = calc.calc(850, 1000);
    equal(res.ltv, 85);
    equal(res.level, 'liquidation');
  });

  test('setConfig partial update', () => {
    const calc = new LTVCalculator({ normal: 50, alert: 90, liquidation: 95 });
    calc.setConfig({ normal: 45 });
    
    const cfg = calc.getConfig();
    equal(cfg.normal, 45);
    equal(cfg.alert, 90);
    equal(cfg.liquidation, 95);
  });

  test('Default config if none provided', () => {
    const calc = new LTVCalculator();
    const cfg = calc.getConfig();
    equal(cfg.normal, 50);
    equal(cfg.alert, 90);
    equal(cfg.liquidation, 95);
  });
});

describe('LTV - Utils', () => {
  let calc;

  beforeEach(() => {
    calc = new LTVCalculator({ normal: 50, alert: 90, liquidation: 95 });
  });

  test('isHealthy returns true for safe LTV', () => {
    equal(calc.isHealthy(85), true);
  });

  test('isHealthy returns false for liquidation LTV', () => {
    equal(calc.isHealthy(97), false);
  });

  test('isHealthy false at exact liquidation boundary', () => {
    equal(calc.isHealthy(95), false);
  });

  test('getConfig returns copy, not reference', () => {
    const cfg = calc.getConfig();
    cfg.normal = 999;
    
    const cfg2 = calc.getConfig();
    equal(cfg2.normal, 50);
  });
});

describe('LTV - Complex', () => {
  test('Loan changes through lifecycle', () => {
    const calc = new LTVCalculator();
    
    const start = calc.calc(400, 1000);
    equal(start.level, 'low');
    
    const drop = calc.calc(400, 435);
    equal(drop.level, 'liquidation');
  });

  test('Dynamic config by regulation', () => {
    const calc = new LTVCalculator();
    
    calc.setConfig({ alert: 70, liquidation: 80 });
    
    const res = calc.calc(750, 1000);
    equal(res.level, 'liquidation');
  });

  test('Multiple instances independent', () => {
    const strict = new LTVCalculator({ alert: 60, liquidation: 75 });
    const loose = new LTVCalculator({ alert: 85, liquidation: 95 });
    
    const loan = 750;
    const collateral = 1000;
    
    const r1 = strict.calc(loan, collateral);
    const r2 = loose.calc(loan, collateral);
    
    equal(r1.level, 'liquidation');
    equal(r2.level, 'alert');
  });
});

module.exports = LTVCalculator;
