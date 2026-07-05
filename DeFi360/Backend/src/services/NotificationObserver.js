
const IRiskObserver = require('../interfaces/IRiskObserver');

class NotificationObserver extends IRiskObserver {
    constructor(notificationService = null) {
        super();
        this.notificationService = notificationService;
        this.sentNotifications = [];
    }


    async onRiskEvent(event) {
        console.log(`📢 NotificationObserver recibió evento: ${event.type}`);


        const notification = this._createNotification(event);

        if (notification) {
            try {

                this.sentNotifications.push({
                    ...notification,
                    timestamp: new Date()
                });


                if (this.notificationService) {
                    await this.notificationService.send(notification);
                    console.log(`✅ Notificación enviada: ${notification.title}`);
                } else {

                    console.log(`📧 [DEMO] Notificación que sería enviada: ${notification.title}`);
                    console.log(`   Descripción: ${notification.message}`);
                }
            } catch (error) {
                console.error(`❌ Error al enviar notificación:`, error.message);
            }
        }
    }


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

                return null;

            default:
                return null;
        }
    }


    getNotificationHistory(limit = 10) {
        return this.sentNotifications.slice(-limit);
    }


    getNotificationsByLoan(loanId) {
        return this.sentNotifications.filter(n => n.loanId === loanId);
    }


    clearHistory() {
        this.sentNotifications = [];
    }
}

module.exports = NotificationObserver;
