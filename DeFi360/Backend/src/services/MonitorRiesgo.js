/**
 * MonitorRiesgo: Observable que monitorea el riesgo de préstamos
 * Implementa patrón Observer
 * SOLID: OCP - Agregar nuevos observers sin modificar MonitorRiesgo
 *         SRP - Solo responsable de monitoreo y notificación
 */
const IRiskStrategy = require('../interfaces/IRiskStrategy');

class MonitorRiesgo {
    constructor(riskStrategy) {
        this.riskStrategy = riskStrategy;
        this.observers = [];
        this.activeMonitorings = new Map(); // Mapeo de loanId -> estado de monitoreo
    }

    /**
     * Registra un observer para recibir eventos de riesgo
     */
    subscribe(observer) {
        if (!observer || typeof observer.onRiskEvent !== 'function') {
            throw new Error('Observer debe implementar onRiskEvent()');
        }
        this.observers.push(observer);
        console.log(`✅ Observer registrado. Total: ${this.observers.length}`);
    }

    /**
     * Desuscribe un observer
     */
    unsubscribe(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
            console.log(`✅ Observer removido. Total: ${this.observers.length}`);
        }
    }

    /**
     * Notifica a todos los observers de un evento
     * @private
     */
    _notifyObservers(event) {
        this.observers.forEach(observer => {
            try {
                observer.onRiskEvent(event);
            } catch (error) {
                console.error(`⚠️ Error al notificar observer:`, error.message);
            }
        });
    }

    /**
     * Evalúa el riesgo de un préstamo y dispara alertas si necesario
     */
    async evaluateLoanRisk(loan, currentCollateralPrice) {
        try {
            // Calcular LTV actual
            const collateralValue = loan.collateralAmount * currentCollateralPrice;
            const { ratio: ltv, riskLevel, isHealthy, message } = 
                this.riskStrategy.evaluate(loan.amount, collateralValue);

            const previousState = this.activeMonitorings.get(loan.id);

            // Crear evento
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

            // Actualizar estado
            this.activeMonitorings.set(loan.id, {
                riskLevel,
                ltv,
                lastEvaluated: new Date()
            });

            // Disparar alertas según umbrales
            this._dispatchAlerts(event, previousState);

            return event;
        } catch (error) {
            console.error(`Error en evaluateLoanRisk para préstamo ${loan.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Dispara alertas específicas según el LTV
     * @private
     */
    _dispatchAlerts(event, previousState) {
        // Alerta de RIESGO_ALTO: LTV >= 90%
        if (event.ltv >= 90 && event.ltv < 95) {
            const alertEvent = {
                ...event,
                type: 'RISK_ALERT_HIGH',
                severity: 'HIGH',
                alertMessage: `⚠️ ALERTA DE RIESGO ALTO: LTV ${event.ltv}% (umbral: 90%)`
            };
            this._notifyObservers(alertEvent);
        }

        // Alerta de LIQUIDACION_INMINENTE: LTV >= 95%
        if (event.ltv >= 95) {
            const alertEvent = {
                ...event,
                type: 'RISK_ALERT_CRITICAL',
                severity: 'CRITICAL',
                alertMessage: `🚨 ALERTA CRÍTICA: Liquidación inminente, LTV ${event.ltv}% (umbral: 95%)`
            };
            this._notifyObservers(alertEvent);
        }

        // Alerta de mejora: Si el LTV bajó significativamente
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

    /**
     * Monitorea un préstamo continuamente (polling)
     * Simula verificación periódica del precio del colateral
     */
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

        // Ejecutar verificación inmediata
        await checkRisk();

        // Programar verificaciones periódicas
        const intervalId = setInterval(checkRisk, intervalMs);
        this.activeMonitorings.set(`${monitoringId}_interval`, intervalId);

        return monitoringId;
    }

    /**
     * Detiene el monitoreo de un préstamo
     */
    stopMonitoring(monitoringId) {
        const intervalKey = `${monitoringId}_interval`;
        const intervalId = this.activeMonitorings.get(intervalKey);
        
        if (intervalId) {
            clearInterval(intervalId);
            this.activeMonitorings.delete(intervalKey);
            console.log(`✅ Monitoreo detenido: ${monitoringId}`);
        }
    }

    /**
     * Obtiene el estado de riesgo de un préstamo
     */
    getLoanRiskStatus(loanId) {
        return this.activeMonitorings.get(loanId) || null;
    }

    /**
     * Obtiene cantidad de observers activos
     */
    getObserverCount() {
        return this.observers.length;
    }
}

module.exports = MonitorRiesgo;
