/**
 * NotificationObserver: Implementación de observer que notifica sobre eventos de riesgo
 * Podría integrarse con servicios de notificación (email, SMS, push notifications)
 * SOLID: SRP - Solo responsable de notificar
 */
const IRiskObserver = require('../interfaces/IRiskObserver');

class NotificationObserver extends IRiskObserver {
    constructor(notificationService = null) {
        super();
        this.notificationService = notificationService;
        this.sentNotifications = []; // Log de notificaciones enviadas
    }

    /**
     * Procesa evento de riesgo y envía notificaciones
     */
    async onRiskEvent(event) {
        console.log(`📢 NotificationObserver recibió evento: ${event.type}`);

        // Crear notificación basada en el tipo de evento
        const notification = this._createNotification(event);

        if (notification) {
            try {
                // Registrar notificación
                this.sentNotifications.push({
                    ...notification,
                    timestamp: new Date()
                });

                // Enviar notificación si existe servicio
                if (this.notificationService) {
                    await this.notificationService.send(notification);
                    console.log(`✅ Notificación enviada: ${notification.title}`);
                } else {
                    // Simular envío en modo demo
                    console.log(`📧 [DEMO] Notificación que sería enviada: ${notification.title}`);
                    console.log(`   Descripción: ${notification.message}`);
                }
            } catch (error) {
                console.error(`❌ Error al enviar notificación:`, error.message);
            }
        }
    }

    /**
     * Crea una notificación basada en el evento de riesgo
     * @private
     */
    _createNotification(event) {
        const baseNotification = {
            recipientId: event.borrowerId || event.lenderId,
            loanId: event.loanId,
            timestamp: event.timestamp
        };

        switch (event.type) {
            case 'RISK_ALERT_HIGH':
                return {
                    ...baseNotification,
                    title: '⚠️ Alerta: Riesgo Alto en tu Préstamo',
                    message: `Tu préstamo #${event.loanId} tiene un LTV de ${event.ltv}%. ` +
                             `Considera hacer un pago para reducir el riesgo.`,
                    severity: 'HIGH',
                    action: 'MAKE_PAYMENT'
                };

            case 'RISK_ALERT_CRITICAL':
                return {
                    ...baseNotification,
                    title: '🚨 ALERTA CRÍTICA: Liquidación Inminente',
                    message: `¡URGENTE! Tu préstamo #${event.loanId} está en riesgo de liquidación. ` +
                             `LTV: ${event.ltv}%. Realiza un pago inmediatamente.`,
                    severity: 'CRITICAL',
                    action: 'URGENT_PAYMENT'
                };

            case 'RISK_IMPROVED':
                return {
                    ...baseNotification,
                    title: '✅ Buenas noticias: Tu riesgo disminuyó',
                    message: `El LTV de tu préstamo #${event.loanId} bajó de ${event.previousRiskLevel} a ${event.riskLevel}. ` +
                             `Tu posición mejora.`,
                    severity: 'INFO',
                    action: 'NONE'
                };

            case 'RISK_EVALUATION':
                // No notificar evaluaciones normales, solo cambios significativos
                return null;

            default:
                return null;
        }
    }

    /**
     * Obtiene historial de notificaciones enviadas
     */
    getNotificationHistory(limit = 10) {
        return this.sentNotifications.slice(-limit);
    }

    /**
     * Obtiene notificaciones por ID de préstamo
     */
    getNotificationsByLoan(loanId) {
        return this.sentNotifications.filter(n => n.loanId === loanId);
    }

    /**
     * Limpia el historial (útil para tests)
     */
    clearHistory() {
        this.sentNotifications = [];
    }
}

module.exports = NotificationObserver;
