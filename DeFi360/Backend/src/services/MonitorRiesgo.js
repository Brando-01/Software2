const IRiskStrategy = require('../interfaces/IRiskStrategy');
const IRiskObserver = require('../interfaces/IRiskObserver');
const { RiskLevel } = IRiskStrategy;


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

    setPrice(assetSymbol, price) {
        this.prices[assetSymbol.toUpperCase()] = price;
    }
}

class MonitorRiesgo {

    constructor(strategy, priceService = null) {
        if (!(strategy instanceof IRiskStrategy)) {
            throw new Error('MonitorRiesgo: strategy debe ser instancia de IRiskStrategy');
        }

        this.strategy = strategy;
        this.priceService = priceService || new SimulatedPriceService();
        this.observers = [];
    }

    addObserver(observer) {
        if (!(observer instanceof IRiskObserver)) {
            throw new Error('MonitorRiesgo: observer debe ser instancia de IRiskObserver');
        }
        this.observers.push(observer);
    }

    removeObserver(observer) {
        this.observers = this.observers.filter(o => o !== observer);
    }

    _notifyObservers(riskEvent) {
        for (const observer of this.observers) {
            try {
                observer.onRiskEvent(riskEvent);
            } catch (err) {
                console.error(`MonitorRiesgo: error en observer ${observer.constructor.name}:`, err.message);
            }
        }
    }

    async evaluateLoan(loan, assetSymbol) {
        const currentPrice = await this.priceService.getCurrentPrice(assetSymbol);
        const riskLevel = this.strategy.evaluate(loan, currentPrice);

        const result = {
            loanId: loan.id,
            riskLevel,
            currentPrice,
            timestamp: new Date(),
        };

        if (riskLevel !== RiskLevel.NORMAL) {
            this._notifyObservers(result);
        }

        return result;
    }

    async runCycle(activeLoans, assetSymbol) {
        if (!Array.isArray(activeLoans) || activeLoans.length === 0) {
            return [];
        }

        const results = await Promise.all(
            activeLoans.map(loan => this.evaluateLoan(loan, assetSymbol))
        );

        return results.filter(r => r.riskLevel !== RiskLevel.NORMAL);
    }

    getPriceService() {
        return this.priceService;
    }
}

module.exports = { MonitorRiesgo, SimulatedPriceService };