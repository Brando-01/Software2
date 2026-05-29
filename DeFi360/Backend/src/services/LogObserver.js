/**
 * LogObserver: Implementación de observer que registra eventos de riesgo en logs
 * Proporciona auditoría y trazabilidad de cambios de riesgo
 * SOLID: SRP - Solo responsable de registrar en logs
 */
const IRiskObserver = require('../interfaces/IRiskObserver');

class LogObserver extends IRiskObserver {
    constructor(logger = null) {
        super();
        this.logger = logger || console; // Usar logger externo o console por defecto
        this.eventLog = []; // Almacenar eventos para auditoría
    }

    /**
     * Procesa evento de riesgo y lo registra en logs
     */
    onRiskEvent(event) {
        const logEntry = this._formatLogEntry(event);
        
        // Registrar según severidad
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

        // Almacenar en historial
        this.eventLog.push({
            ...event,
            loggedAt: new Date(),
            severity: event.severity || 'INFO'
        });
    }

    /**
     * Formatea la entrada de log
     * @private
     */
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

    /**
     * Obtiene el historial de eventos registrados
     */
    getEventHistory(limit = null) {
        if (limit) {
            return this.eventLog.slice(-limit);
        }
        return this.eventLog;
    }

    /**
     * Filtra eventos por tipo
     */
    getEventsByType(eventType) {
        return this.eventLog.filter(e => e.type === eventType);
    }

    /**
     * Filtra eventos por ID de préstamo
     */
    getEventsByLoan(loanId) {
        return this.eventLog.filter(e => e.loanId === loanId);
    }

    /**
     * Filtra eventos por severidad
     */
    getEventsBySeverity(severity) {
        return this.eventLog.filter(e => e.severity === severity);
    }

    /**
     * Estadísticas de eventos registrados
     */
    getStatistics() {
        const stats = {
            totalEvents: this.eventLog.length,
            byType: {},
            bySeverity: {},
            byLoan: {}
        };

        this.eventLog.forEach(event => {
            // Por tipo
            stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

            // Por severidad
            stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;

            // Por préstamo
            stats.byLoan[event.loanId] = (stats.byLoan[event.loanId] || 0) + 1;
        });

        return stats;
    }

    /**
     * Exporta logs en formato JSON
     */
    exportAsJSON() {
        return JSON.stringify(this.eventLog, null, 2);
    }

    /**
     * Limpia el historial (útil para tests)
     */
    clearHistory() {
        this.eventLog = [];
    }

    /**
     * Obtiene últimos N eventos de un tipo específico
     */
    getRecentAlerts(limit = 5) {
        return this.eventLog
            .filter(e => e.severity && ['CRITICAL', 'HIGH'].includes(e.severity))
            .slice(-limit);
    }
}

module.exports = LogObserver;
