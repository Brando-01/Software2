const ISpecification = require('./ISpecification');

class LtvSpec extends ISpecification {
  constructor(maxLtv) {
    super();
    this.maxLtv = maxLtv;
  }

  async isSatisfiedBy(offer) {
    if (this.maxLtv == null) return true;
    if (offer.ltv == null) return true;
    return parseFloat(offer.ltv) <= parseFloat(this.maxLtv);
  }
}

module.exports = LtvSpec;
