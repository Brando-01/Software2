
const MonitorRiesgo = require('./MonitorRiesgo');
const NotificationObserver = require('./NotificationObserver');
const LogObserver = require('./LogObserver');
const LTVRiskStrategy = require('../strategies/LTVRiskStrategy');

class RiskMonitoringService {
    constructor(riskStrategy = null, notificationService = null) {
        this.riskStrategy = riskStrategy || new LTVRiskStrategy();


        this.monitor = new MonitorRiesgo(this.riskStrategy);


        this.notificationObserver = new NotificationObserver(notificationService);
        this.logObserver = new LogObserver();

        this.monitor.subscribe(this.notificationObserver);
        this.monitor.subscribe(this.logObserver);
    }


    subscribe(observer) {
        this.monitor.subscribe(observer);
    }


    async evaluateLoanRisk(loan, collateralPrice) {
        return await this.monitor.evaluateLoanRisk(loan, collateralPrice);
    }


    async startMonitoring(loan, priceOracle, intervalMs = 60000) {
        return await this.monitor.startMonitoring(loan, priceOracle, intervalMs);
    }


    stopMonitoring(monitoringId) {
        this.monitor.stopMonitoring(monitoringId);
    }


    getRiskReport(loanId = null) {
        return {
            activeObservers: this.monitor.getObserverCount(),
            notificationsHistory: this.notificationObserver.getNotificationHistory(5),
            recentAlerts: this.logObserver.getRecentAlerts(5),
            statistics: this.logObserver.getStatistics(),
            loanRiskStatus: loanId ? this.monitor.getLoanRiskStatus(loanId) : null
        };
    }


    getAuditLog(loanId = null, limit = 10) {
        if (loanId) {
            return this.logObserver.getEventsByLoan(loanId);
        }
        return this.logObserver.getEventHistory(limit);
    }


    clearForTesting() {
        this.notificationObserver.clearHistory();
        this.logObserver.clearHistory();
    }
}

module.exports = RiskMonitoringService;
