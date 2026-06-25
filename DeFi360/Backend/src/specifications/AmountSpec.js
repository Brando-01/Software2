const ISpecification = require('./ISpecification');

class AmountSpec extends ISpecification {
  constructor(maxAmount) {
    super();
    this.maxAmount = maxAmount;
  }

  async isSatisfiedBy(offer) {
    if (this.maxAmount == null) return true;
    return parseFloat(offer.amount) <= parseFloat(this.maxAmount);
  }
}

module.exports = AmountSpec;
