const { Loan, Notification, Liquidation, LedgerEntry } = require('../models');
const { sequelize } = require('../config/database');
const priceOracle = require('./priceOracle');
const { getStats: getRateLimitStats } = require('../middleware/rateLimiter');

const LOAN_STATUSES = ['active', 'paid', 'defaulted', 'liquidated'];

class MetricsService {
  constructor(deps = {}) {
    this.models = {
      Loan: deps.Loan || Loan,
      Notification: deps.Notification || Notification,
      Liquidation: deps.Liquidation || Liquidation,
      LedgerEntry: deps.LedgerEntry || LedgerEntry
    };
    this.sequelize = deps.sequelize || sequelize;
    this.priceOracle = deps.priceOracle || priceOracle;
    this.getRateLimitStats = deps.getRateLimitStats || getRateLimitStats;
    this.startTime = deps.startTime || Date.now();
  }

  getHealth() {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString()
    };
  }

  async getReadiness() {
    let db = 'down';
    try {
      await this.sequelize.authenticate();
      db = 'up';
    } catch (error) {
      db = 'down';
    }

    const breaker = typeof this.priceOracle.getState === 'function'
      ? this.priceOracle.getState()
      : { state: 'UNKNOWN' };

    return {
      ready: db === 'up' && breaker.state !== 'OPEN',
      db,
      oracle: breaker.state
    };
  }

  async getMetrics() {
    const startedAt = Date.now();

    const cache = typeof this.priceOracle.getStats === 'function'
      ? this.priceOracle.getStats()
      : { hits: 0, misses: 0, hitRate: 0 };

    const breaker = typeof this.priceOracle.getState === 'function'
      ? this.priceOracle.getState()
      : { state: 'UNKNOWN' };

    const rateLimit = this.getRateLimitStats();

    const [loansByStatus, notifications, unreadNotifications, liquidations, ledger] =
      await Promise.all([
        this._countLoansByStatus(),
        this.models.Notification.count(),
        this.models.Notification.count({ where: { read: false } }),
        this.models.Liquidation.count(),
        this._ledgerVolume()
      ]);

    const totalLoans = LOAN_STATUSES.reduce((sum, s) => sum + (loansByStatus[s] || 0), 0);
    const liquidationRate = totalLoans === 0
      ? 0
      : parseFloat((loansByStatus.liquidated / totalLoans).toFixed(4));

    return {
      cache,
      breaker,
      rateLimit,
      loansByStatus,
      totalLoans,
      liquidationRate,
      notifications,
      unreadNotifications,
      liquidations,
      ledger,
      generatedInMs: Date.now() - startedAt,
      timestamp: new Date().toISOString()
    };
  }

  async _countLoansByStatus() {
    const counts = await Promise.all(
      LOAN_STATUSES.map((status) => this.models.Loan.count({ where: { status } }))
    );
    return LOAN_STATUSES.reduce((acc, status, i) => {
      acc[status] = counts[i];
      return acc;
    }, {});
  }

  async _ledgerVolume() {
    const sumByType = async (type) => {
      try {
        const total = await this.models.LedgerEntry.sum('amount', { where: { type } });
        return parseFloat(total || 0);
      } catch (error) {
        return 0;
      }
    };

    const [disbursed, repaid, liquidated] = await Promise.all([
      sumByType('DISBURSEMENT'),
      sumByType('PAYMENT'),
      sumByType('LIQUIDATION')
    ]);

    return {
      disbursed,
      repaid,
      liquidated,
      netOutstanding: parseFloat((disbursed - repaid - liquidated).toFixed(2))
    };
  }
}

module.exports = MetricsService;
