
const IRiskStrategy = require('../interfaces/IRiskStrategy');
// Clase que representa el monitor de riesgo, responsable de evaluar el riesgo de los préstamos y notificar a los observadores sobre eventos de riesgo.
class MonitorRiesgo {
    constructor(riskStrategy) {
        this.riskStrategy = riskStrategy;
        this.observers = [];
        this.activeMonitorings = new Map();
    }

    // Suscripción de observadores para recibir notificaciones de eventos de riesgo.
    subscribe(observer) {
        if (!observer || typeof observer.onRiskEvent !== 'function') {
            throw new Error('Observer debe implementar onRiskEvent()');
        }
        this.observers.push(observer);
        console.log(`✅ Observer registrado. Total: ${this.observers.length}`);
    }

    // Desuscripción de observadores para dejar de recibir notificaciones de eventos de riesgo.
    unsubscribe(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
            console.log(`✅ Observer removido. Total: ${this.observers.length}`);
        }
    }

    // Notificación a todos los observadores sobre un evento de riesgo.
    _notifyObservers(event) {
        this.observers.forEach(observer => {
            try {
                observer.onRiskEvent(event);
            } catch (error) {
                console.error(`⚠️ Error al notificar observer:`, error.message);
            }
        });
    }

    // Evaluación del riesgo de un préstamo basado en el precio actual del colateral y la estrategia de riesgo definida.
    async evaluateLoanRisk(loan, currentCollateralPrice) {
        try {

            const collateralValue = loan.collateralAmount * currentCollateralPrice;
            const { ratio: ltv, riskLevel, isHealthy, message } =
                this.riskStrategy.evaluate(loan.amount, collateralValue);

            const previousState = this.activeMonitorings.get(loan.id);


            const event = {
                type: 'RISK_EVALUATION',
                timestamp: new Date(),
                loanId: loan.id,
                borrowerId: loan.borrowerId,
                lenderId: loan.lenderId,
                ltv: parseFloat(ltv),
                riskLevel,
                isHealthy,
                message,
                collateralPrice: currentCollateralPrice,
                collateralValue,
                previousRiskLevel: previousState?.riskLevel
            };


            this.activeMonitorings.set(loan.id, {
                riskLevel,
                ltv: event.ltv,
                lastEvaluated: new Date()
            });


            this._dispatchAlerts(event, previousState);

            return event;
        } catch (error) {
            console.error(`Error en evaluateLoanRisk para préstamo ${loan.id}:`, error.message);
            throw error;
        }
    }

    // Despacho de alertas a los observadores basado en el nivel de riesgo y cambios en el LTV.
    _dispatchAlerts(event, previousState) {


        if (event.riskLevel === 'critical') {
            const alertEvent = {
                ...event,
                type: 'RISK_ALERT_CRITICAL',
                severity: 'CRITICAL',
                alertMessage: `🚨 ALERTA CRÍTICA: Liquidación inminente, LTV ${event.ltv}%`
            };
            this._notifyObservers(alertEvent);
        } else if (event.riskLevel === 'high') {
            const alertEvent = {
                ...event,
                type: 'RISK_ALERT_HIGH',
                severity: 'HIGH',
                alertMessage: `⚠️ ALERTA DE RIESGO ALTO: LTV ${event.ltv}%`
            };
            this._notifyObservers(alertEvent);
        }


        if (previousState && previousState.ltv - event.ltv >= 5) {
            const alertEvent = {
                ...event,
                type: 'RISK_IMPROVED',
                severity: 'INFO',
                alertMessage: `✅ Riesgo mejorado: LTV bajó de ${previousState.ltv}% a ${event.ltv}%`
            };
            this._notifyObservers(alertEvent);
        }
    }

    // Inicio del monitoreo de riesgo para un préstamo específico, evaluando periódicamente su estado de riesgo basado en el precio del colateral.
    async startMonitoring(loan, priceOracle, intervalMs = 60000) {
        const monitoringId = `monitor_${loan.id}`;

        const checkRisk = async () => {
            try {
                const currentPrice = await priceOracle.getPrice(loan.collateralType);
                await this.evaluateLoanRisk(loan, currentPrice);
            } catch (error) {
                console.error(`Error en monitoreo de préstamo ${loan.id}:`, error.message);
            }
        };


        await checkRisk();


        const intervalId = setInterval(checkRisk, intervalMs);
        this.activeMonitorings.set(`${monitoringId}_interval`, intervalId);

        return monitoringId;
    }

    // Detención del monitoreo de riesgo para un préstamo específico, limpiando el intervalo de evaluación y eliminando el estado activo del monitoreo.
    stopMonitoring(monitoringId) {
        const intervalKey = `${monitoringId}_interval`;
        const intervalId = this.activeMonitorings.get(intervalKey);

        if (intervalId) {
            clearInterval(intervalId);
            this.activeMonitorings.delete(intervalKey);
            console.log(`✅ Monitoreo detenido: ${monitoringId}`);
        }
    }

    // Obtención del estado de riesgo actual de un préstamo específico, retornando la información almacenada en el mapa de monitoreos activos.
    getLoanRiskStatus(loanId) {
        return this.activeMonitorings.get(loanId) || null;
    }

    // Obtención del número de observadores actualmente suscritos al monitor de riesgo.
    getObserverCount() {
        return this.observers.length;
    }
}

module.exports = MonitorRiesgo;
