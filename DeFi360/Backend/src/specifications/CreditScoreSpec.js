const ISpecification = require('./ISpecification');

class CreditScoreSpec extends ISpecification {
  constructor(minCreditScore, creditScoreService) {
    super();
    this.minCreditScore = minCreditScore;
    this.creditScoreService = creditScoreService;
  }

  async isSatisfiedBy(offer) {
    if (this.minCreditScore == null) return true;

    let score = offer.creditScore;
    if (score == null && this.creditScoreService) { 
      const borrowerId = offer.userId;
      const result = await this.creditScoreService.getScore(borrowerId);
      score = result.score;
      offer.creditScore = score;
      offer.creditCategory = result.category;
    }

    if (score == null) return false;
    return parseInt(score, 10) >= parseInt(this.minCreditScore, 10);
  }
}

module.exports = CreditScoreSpec;
