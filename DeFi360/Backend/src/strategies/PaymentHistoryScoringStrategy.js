const ICreditScoringStrategy = require('../interfaces/ICreditScoringStrategy');

class PaymentHistoryScoringStrategy extends ICreditScoringStrategy {
  constructor(config = {}) {
    super();
    this.base = config.base ?? 650;
    this.min = config.min ?? 300;
    this.max = config.max ?? 850;
    this.weights = {
      onTime: config.weights?.onTime ?? 40,
      late: config.weights?.late ?? -70,
      default: config.weights?.default ?? -120
    };
    this.thresholds = {
      poor: config.thresholds?.poor ?? 500,
      fair: config.thresholds?.fair ?? 650,
       good: config.thresholds?.good ?? 750
    };
  }

    score(history = {}) {
    const onTime = history.onTime ?? 0;
    const late = history.late ?? 0;
    const defaults = history.defaults ?? 0;

    if (onTime === 0 && late === 0 && defaults === 0) {
      return { score: this.base, category: this.categorize(this.base) };
    }

    let raw = this.base
      + onTime * this.weights.onTime
      + late * this.weights.late
      + defaults * this.weights.default;

    const score = Math.round(Math.max(this.min, Math.min(this.max, raw)));
    return { score, category: this.categorize(score) };
  }

    categorize(score) {
     if (score < this.thresholds.poor) return 'poor';
    if (score <= this.thresholds.fair) return 'fair';
    if (score < this.thresholds.good) return 'good';
    return 'excellent';
  }
}

module.exports = PaymentHistoryScoringStrategy;
