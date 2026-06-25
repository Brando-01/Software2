
const IRiskStrategy = require('../interfaces/IRiskStrategy');

class MonitorRiesgo {
    constructor(riskStrategy) {
        this.riskStrategy = riskStrategy;
        this.observers = [];
        this.activeMonitorings = new Map();
    }


    subscribe(observer) {
        if (!observer || typeof observer.onRiskEvent !== 'function') {
            throw new Error('Observer debe implementar onRiskEvent()');
        }
        this.observers.push(observer);
        console.log(`✅ Observer registrado. Total: ${this.observers.length}`);
    }


    unsubscribe(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
            console.log(`✅ Observer removido. Total: ${this.observers.length}`);
        }
    }


    _notifyObservers(event) {
        this.observers.forEach(observer => {
            try {
                observer.onRiskEvent(event);
            } catch (error) {
                console.error(`⚠️ Error al notificar observer:`, error.message);
            }
        });
    }


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


    stopMonitoring(monitoringId) {
        const intervalKey = `${monitoringId}_interval`;
        const intervalId = this.activeMonitorings.get(intervalKey);

        if (intervalId) {
            clearInterval(intervalId);
            this.activeMonitorings.delete(intervalKey);
            console.log(`✅ Monitoreo detenido: ${monitoringId}`);
        }
    }


    getLoanRiskStatus(loanId) {
        return this.activeMonitorings.get(loanId) || null;
    }


    getObserverCount() {
        return this.observers.length;
    }
}

module.exports = MonitorRiesgo;
