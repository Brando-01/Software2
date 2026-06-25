const ISpecification = require('./ISpecification');

class CollateralSpec extends ISpecification {
  constructor(collateralTypes) {
    super();

    this.collateralTypes = Array.isArray(collateralTypes)
      ? collateralTypes.map((t) => String(t).toUpperCase())
      : null;
  }

  async isSatisfiedBy(offer) {
    if (!this.collateralTypes || this.collateralTypes.length === 0) return true;
    if (!offer.collateralType) return false;
    return this.collateralTypes.includes(String(offer.collateralType).toUpperCase());
  }
}

module.exports = CollateralSpec;
