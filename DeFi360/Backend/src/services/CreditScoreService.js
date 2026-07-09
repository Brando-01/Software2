const PaymentHistoryScoringStrategy = require('../strategies/PaymentHistoryScoringStrategy');
const { LedgerEntry, Loan } = require('../models');

class CreditScoreService {
  constructor(strategy = new PaymentHistoryScoringStrategy(), models = {}) {
    this.strategy = strategy;
    this.ledgerModel = models.LedgerEntry || LedgerEntry;
    this.loanModel = models.Loan || Loan;
  }

  // Método auxiliar para validar userId
  _validateUserId(userId) {
    if (!userId && userId !== 0) {
      throw new Error('userId is required');
    }
    return userId;
  }

  // Método auxiliar para parsear userId
  _parseUserId(userId) {
    const parsed = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    return isNaN(parsed) ? userId : parsed;
  }

  async buildHistory(userId) {
    this._validateUserId(userId);

    const [payments, loans] = await Promise.all([
      this.ledgerModel.findAll({
        where: { userId, type: 'PAYMENT' }
      }),
      this.loanModel.findAll({
        where: { borrowerId: userId }
      })
    ]);

    let late = 0;
    let defaults = 0;
    
    for (const loan of loans) {
      if (loan.status === 'defaulted') {
        defaults++;
      } else if (loan.status === 'liquidated') {
        late++;
      }
    }

    return {
      onTime: payments.length,
      late,
      defaults
    };
  }

  async getScore(userId) {
    this._validateUserId(userId);
    
    const history = await this.buildHistory(userId);
    const { score, category } = this.strategy.score(history);
    
    return { 
      userId: this._parseUserId(userId), 
      score, 
      category, 
      history 
    };
  }
}

module.exports = CreditScoreService;