const ISpecification = require('./ISpecification');

class ApySpec extends ISpecification {
  constructor(minApy) {
    super();
    this.minApy = minApy; 
  }

  async isSatisfiedBy(offer) {
    if (this.minApy == null) return true;
    return parseFloat(offer.apy) >= parseFloat(this.minApy);
  }
}

module.exports = ApySpec;
