const IRiskObserver = require('../interfaces/IRiskObserver');

class LiquidationObserver extends IRiskObserver {
    constructor(liquidationService, loanModel = null) {
    super();
    this.liquidationService = liquidationService;
    this.loanModel = loanModel || require('../models').Loan;
    this.Offer = require('../models').Offer;
    this.triggered = [];
  }

  async onRiskEvent(event) {
    if (event.type !== 'RISK_ALERT_CRITICAL') return;

    try {
      const loan = await this.loanModel.findByPk(event.loanId, {
        include: [{ model: this.Offer }]
      });
      if (!loan || loan.status !== 'active') return;

      const result = await this.liquidationService.liquidateAutomatic(loan, {
        ltv: event.ltv,
        reason: 'auto_critical_ltv'
      });
      this.triggered.push({ loanId: event.loanId, at: new Date() });
      return result;
    } catch (error) {
      console.error('[LiquidationObserver] Error al liquidar automáticamente:', error.message);
    }
  }
}

module.exports = LiquidationObserver;
