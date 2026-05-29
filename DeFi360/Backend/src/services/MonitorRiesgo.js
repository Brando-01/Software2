const IRiskStrategy = require('../interfaces/IRiskStrategy');
const IRiskObserver = require('../interfaces/IRiskObserver');
const { RiskLevel } = IRiskStrategy;

/**
 * SimulatedPriceService — Price service embebido temporal.
 * TODO: reemplazar por integración real con oráculo de precios (Sprint 2).
 */
class SimulatedPriceService {
    constructor(prices = {}) {
        this.prices = {
            ETH: 1800.00,
            BTC: 45000.00,
            BNB: 300.00,
            USDT: 1.00,
            ...prices
        };
    }

    async getCurrentPrice(assetSymbol) {
        const price = this.prices[assetSymbol.toUpperCase()];
        if (!price) {
            throw new Error(`SimulatedPriceService: no hay precio simulado para "${assetSymbol}"`);
        }
        return price;
    }

    /** Permite simular caídas de precio en tests (T-16) */
    setPrice(assetSymbol, price) {
        this.prices[assetSymbol.toUpperCase()] = price;
    }
}

/**
 * MonitorRiesgo — Servicio de monitoreo continuo de riesgo crediticio.
 *
 * Patrones implementados:
 *   - Strategy (IRiskStrategy): delega el algoritmo de evaluación de riesgo (OCP + DIP).
 *   - Observer (IRiskObserver): notifica suscriptores ante eventos de riesgo (OCP + SRP).
 *
 * T-15 — HU-08 Monitoreo de Riesgo y Alertas
 */
class MonitorRiesgo {

    /**
     * @param {IRiskStrategy} strategy    - Algoritmo de evaluación inyectado
     * @param {object}        priceService - Opcional. Default: SimulatedPriceService
     */
    constructor(strategy, priceService = null) {
        if (!(strategy instanceof IRiskStrategy)) {
            throw new Error('MonitorRiesgo: strategy debe ser instancia de IRiskStrategy');
        }
        this.strategy = strategy;
        this.priceService = priceService || new SimulatedPriceService();
        this.observers = [];
        this.activeMonitorings = new Map(); // loanId -> { riskLevel, ltv, lastEvaluated }
    }

    // ─────────────────────────────────────────
    //  Gestión de Observers
    // ─────────────────────────────────────────

    /** Suscribe un observer al ciclo de monitoreo */
    subscribe(observer) {
        if (!(observer instanceof IRiskObserver)) {
            throw new Error('MonitorRiesgo: observer debe ser instancia de IRiskObserver');
        }
        this.observers.push(observer);
        console.log(`✅ Observer registrado. Total: ${this.observers.length}`);
    }

    /** Desuscribe un observer */
    unsubscribe(observer) {
        this.observers = this.observers.filter(o => o !== observer);
        console.log(`✅ Observer removido. Total: ${this.observers.length}`);
    }

    /** @private */
    _notifyObservers(event) {
        this.observers.forEach(observer => {
            try {
                observer.onRiskEvent(event);
            } catch (error) {
                console.error(`⚠️ Error al notificar observer ${observer.constructor.name}:`, error.message);
            }
        });
    }

    // ─────────────────────────────────────────
    //  Evaluación
    // ─────────────────────────────────────────

    /**
     * Evalúa el riesgo de un préstamo con el precio actual del colateral.
     * Usa la Strategy inyectada — no contiene lógica de evaluación propia (SRP).
     *
     * @param {object} loan                  - Modelo Loan con remainingBalance y collateral
     * @param {number} currentCollateralPrice - Precio actual del activo en USD
     * @returns {object} evento con loanId, riskLevel, ltv, timestamps, etc.
     */
    async evaluateLoanRisk(loan, currentCollateralPrice) {
        try {
            const riskLevel = this.strategy.evaluate(loan, currentCollateralPrice);
            const previousState = this.activeMonitorings.get(loan.id);

            const collateralAmount = loan.collateral?.amount ?? loan.collateralAmount;
            const collateralValueUSD = collateralAmount * currentCollateralPrice;
            const ltv = parseFloat(
                ((parseFloat(loan.remainingBalance) / collateralValueUSD) * 100).toFixed(2)
            );

            const event = {
                type: 'RISK_EVALUATION',
                timestamp: new Date(),
                loanId: loan.id,
                borrowerId: loan.borrowerId,
                lenderId: loan.lenderId,
                ltv,
                riskLevel,
                collateralPrice: currentCollateralPrice,
                collateralValueUSD,
                previousRiskLevel: previousState?.riskLevel ?? null,
            };

            this.activeMonitorings.set(loan.id, {
                riskLevel,
                ltv,
                lastEvaluated: new Date()
            });

            this._dispatchAlerts(event, previousState);

            return event;
        } catch (error) {
            console.error(`Error en evaluateLoanRisk para préstamo ${loan.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Dispara alertas específicas según el LTV.
     * Criterios Gherkin de T-16: LTV >= 90% → RIESGO_ALTO, LTV >= 95% → LIQUIDACION_INMINENTE
     * @private
     */
    _dispatchAlerts(event, previousState) {
        if (event.ltv >= 95) {
            this._notifyObservers({
                ...event,
                type: 'RISK_ALERT_CRITICAL',
                severity: 'CRITICAL',
                alertMessage: `🚨 ALERTA CRÍTICA: Liquidación inminente, LTV ${event.ltv}% (umbral: 95%)`
            });
        } else if (event.ltv >= 90) {
            this._notifyObservers({
                ...event,
                type: 'RISK_ALERT_HIGH',
                severity: 'HIGH',
                alertMessage: `⚠️ ALERTA DE RIESGO ALTO: LTV ${event.ltv}% (umbral: 90%)`
            });
        }

        if (previousState && previousState.ltv - event.ltv >= 5) {
            this._notifyObservers({
                ...event,
                type: 'RISK_IMPROVED',
                severity: 'INFO',
                alertMessage: `✅ Riesgo mejorado: LTV bajó de ${previousState.ltv}% a ${event.ltv}%`
            });
        }
    }

    /**
     * Ejecuta un ciclo de monitoreo sobre una lista de préstamos activos.
     * @param {Array}  activeLoans  - Lista de instancias Loan
     * @param {string} assetSymbol  - Símbolo del activo colateral
     * @returns {Promise<Array>} Solo los préstamos con riesgo detectado
     */
    async runCycle(activeLoans, assetSymbol) {
        if (!Array.isArray(activeLoans) || activeLoans.length === 0) return [];

        const currentPrice = await this.priceService.getCurrentPrice(assetSymbol);

        const results = await Promise.all(
            activeLoans.map(loan => this.evaluateLoanRisk(loan, currentPrice))
        );

        return results.filter(r => r.riskLevel !== RiskLevel.NORMAL);
    }

    /**
     * Inicia monitoreo continuo (polling) de un préstamo.
     * @param {object} loan         - Modelo Loan
     * @param {number} intervalMs   - Intervalo de polling (default: 60s)
     * @returns {string} monitoringId para poder detenerlo
     */
    async startMonitoring(loan, intervalMs = 60000) {
        const monitoringId = `monitor_${loan.id}`;

        const checkRisk = async () => {
            try {
                const currentPrice = await this.priceService.getCurrentPrice(
                    loan.collateral?.type ?? loan.collateralType
                );
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

    /** Detiene el monitoreo continuo de un préstamo */
    stopMonitoring(monitoringId) {
        const intervalKey = `${monitoringId}_interval`;
        const intervalId = this.activeMonitorings.get(intervalKey);
        if (intervalId) {
            clearInterval(intervalId);
            this.activeMonitorings.delete(intervalKey);
            console.log(`✅ Monitoreo detenido: ${monitoringId}`);
        }
    }

    /** Retorna el último estado de riesgo registrado para un préstamo */
    getLoanRiskStatus(loanId) {
        return this.activeMonitorings.get(loanId) || null;
    }

    getObserverCount() {
        return this.observers.length;
    }

    /** Expone el price service para simular caídas en tests (T-16) */
    getPriceService() {
        return this.priceService;
    }
}

module.exports = { MonitorRiesgo, SimulatedPriceService };