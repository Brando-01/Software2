const ISpecification = require('./ISpecification');

class AndSpecification extends ISpecification {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }

  async isSatisfiedBy(candidate) {
    const okLeft = await this.left.isSatisfiedBy(candidate);
    if (!okLeft) return false;
    return this.right.isSatisfiedBy(candidate);
  }
}

module.exports = AndSpecification;
