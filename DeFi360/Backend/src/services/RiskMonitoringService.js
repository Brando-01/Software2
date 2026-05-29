/**
 * RiskMonitoringService: Servicio que orquesta el monitoreo de riesgos
 * Integra MonitorRiesgo con observers (NotificationObserver y LogObserver)
 * Facilita el uso en controladores
 */
const MonitorRiesgo = require('./MonitorRiesgo');
const NotificationObserver = require('./NotificationObserver');
const LogObserver = require('./LogObserver');
const LTVRiskStrategy = require('../strategies/LTVRiskStrategy');

class RiskMonitoringService {
    constructor(riskStrategy = null, notificationService = null) {
        this.riskStrategy = riskStrategy || new LTVRiskStrategy({
            medium: 50,
            high: 70,
            critical: 80
        });

        // Crear monitor
        this.monitor = new MonitorRiesgo(this.riskStrategy);

        // Registrar observers
        this.notificationObserver = new NotificationObserver(notificationService);
        this.logObserver = new LogObserver();

        this.monitor.subscribe(this.notificationObserver);
        this.monitor.subscribe(this.logObserver);
    }

    /**
     * Evalúa el riesgo de un préstamo
     */
    async evaluateLoanRisk(loan, collateralPrice) {
        return await this.monitor.evaluateLoanRisk(loan, collateralPrice);
    }

    /**
     * Inicia monitoreo continuo de un préstamo
     */
    async startMonitoring(loan, priceOracle, intervalMs = 60000) {
        return await this.monitor.startMonitoring(loan, priceOracle, intervalMs);
    }

    /**
     * Detiene monitoreo de un préstamo
     */
    stopMonitoring(monitoringId) {
        this.monitor.stopMonitoring(monitoringId);
    }

    /**
     * Obtiene reporte de riesgo
     */
    getRiskReport(loanId = null) {
        return {
            activeObservers: this.monitor.getObserverCount(),
            notificationsHistory: this.notificationObserver.getNotificationHistory(5),
            recentAlerts: this.logObserver.getRecentAlerts(5),
            statistics: this.logObserver.getStatistics(),
            loanRiskStatus: loanId ? this.monitor.getLoanRiskStatus(loanId) : null
        };
    }

    /**
     * Obtiene logs de auditoría
     */
    getAuditLog(loanId = null, limit = 10) {
        if (loanId) {
            return this.logObserver.getEventsByLoan(loanId);
        }
        return this.logObserver.getEventHistory(limit);
    }

    /**
     * Limpia datos de prueba
     */
    clearForTesting() {
        this.notificationObserver.clearHistory();
        this.logObserver.clearHistory();
    }
}

module.exports = RiskMonitoringService;
