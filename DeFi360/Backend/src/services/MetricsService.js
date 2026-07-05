const { Loan, Notification, Liquidation } = require('../models');
const { sequelize } = require('../config/database');
const priceOracle = require('./priceOracle');
const { getStats: getRateLimitStats } = require('../middleware/rateLimiter');

class MetricsService {
  constructor(deps = {}) {
    this.models = {
      Loan: deps.Loan || Loan,
      Notification: deps.Notification || Notification,
      Liquidation: deps.Liquidation || Liquidation
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
    const cache = typeof this.priceOracle.getStats === 'function'
      ? this.priceOracle.getStats()
      : { hits: 0, misses: 0, hitRate: 0 };

    const breaker = typeof this.priceOracle.getState === 'function'
      ? this.priceOracle.getState()
      : { state: 'UNKNOWN' };

    const rateLimit = this.getRateLimitStats();

    const loansByStatus = await this._countLoansByStatus();
    const notifications = await this.models.Notification.count();
    const liquidations = await this.models.Liquidation.count();

    return {
      cache,
      breaker,
      rateLimit,
      loansByStatus,
      notifications,
      liquidations,
      timestamp: new Date().toISOString()
    };
  }

    async _countLoansByStatus() {
    const statuses = ['active', 'paid', 'defaulted', 'liquidated'];
    const result = {};
    for (const status of statuses) {
      result[status] = await this.models.Loan.count({ where: { status } });
    }
    return result;
  }
}

module.exports = MetricsService;
