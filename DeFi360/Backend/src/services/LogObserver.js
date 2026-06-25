
const IRiskObserver = require('../interfaces/IRiskObserver');

class LogObserver extends IRiskObserver {
    constructor(logger = null) {
        super();
        this.logger = logger || console;
        this.eventLog = [];
    }


    onRiskEvent(event) {
        const logEntry = this._formatLogEntry(event);


        switch (event.severity) {
            case 'CRITICAL':
                this.logger.error(`🚨 ${logEntry}`);
                break;
            case 'HIGH':
                this.logger.warn(`⚠️ ${logEntry}`);
                break;
            case 'INFO':
                this.logger.info(`ℹ️ ${logEntry}`);
                break;
            default:
                this.logger.debug(`🔍 ${logEntry}`);
        }


        this.eventLog.push({
            ...event,
            loggedAt: new Date(),
            severity: event.severity || 'INFO'
        });
    }


    _formatLogEntry(event) {
        const parts = [
            `[${event.type}]`,
            `Préstamo: ${event.loanId}`,
            `LTV: ${event.ltv}%`
        ];

        if (event.borrowerId) parts.push(`Prestatario: ${event.borrowerId}`);
        if (event.lenderId) parts.push(`Prestamista: ${event.lenderId}`);
        if (event.alertMessage) parts.push(`Msg: ${event.alertMessage}`);

        return parts.join(' | ');
    }


    getEventHistory(limit = null) {
        if (limit) {
            return this.eventLog.slice(-limit);
        }
        return this.eventLog;
    }


    getEventsByType(eventType) {
        return this.eventLog.filter(e => e.type === eventType);
    }


    getEventsByLoan(loanId) {
        return this.eventLog.filter(e => e.loanId === loanId);
    }


    getEventsBySeverity(severity) {
        return this.eventLog.filter(e => e.severity === severity);
    }


    getStatistics() {
        const stats = {
            totalEvents: this.eventLog.length,
            byType: {},
            bySeverity: {},
            byLoan: {}
        };

        this.eventLog.forEach(event => {

            stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;


            stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;


            stats.byLoan[event.loanId] = (stats.byLoan[event.loanId] || 0) + 1;
        });

        return stats;
    }


    exportAsJSON() {
        return JSON.stringify(this.eventLog, null, 2);
    }


    clearHistory() {
        this.eventLog = [];
    }


    getRecentAlerts(limit = 5) {
        return this.eventLog
            .filter(e => e.severity && ['CRITICAL', 'HIGH'].includes(e.severity))
            .slice(-limit);
    }
}

module.exports = LogObserver;
