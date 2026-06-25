const PaymentHistoryScoringStrategy = require('../strategies/PaymentHistoryScoringStrategy');
const { LedgerEntry, Loan } = require('../models');

class CreditScoreService {
  constructor(strategy = new PaymentHistoryScoringStrategy(), models = {}) {
    this.strategy = strategy;
    this.ledgerModel = models.LedgerEntry || LedgerEntry;
    this.loanModel = models.Loan || Loan;
  }

    async buildHistory(userId) {
    const payments = await this.ledgerModel.findAll({
      where: { userId, type: 'PAYMENT' }
    });

    const loans = await this.loanModel.findAll({
      where: { borrowerId: userId }
    });

    let late = 0;
    let defaults = 0;
    for (const loan of loans) {
      if (loan.status === 'defaulted') defaults++;
      else if (loan.status === 'liquidated') late++;
    }

    return {
      onTime: payments.length,
      late,
      defaults
    };
  }

    async getScore(userId) {
    const history = await this.buildHistory(userId);
    const { score, category } = this.strategy.score(history);
    return { userId: parseInt(userId, 10), score, category, history };
  }
}

module.exports = CreditScoreService;
