class ISpecification {
    async isSatisfiedBy(candidate) {
    throw new Error('ISpecification.isSatisfiedBy() debe ser implementado');
  }

    and(other) {
    const AndSpecification = require('./AndSpecification');
    return new AndSpecification(this, other);
  }
}

module.exports = ISpecification;
