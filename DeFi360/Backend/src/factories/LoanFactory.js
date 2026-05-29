const ILoanFactory = require('../interfaces/ILoanFactory');
const FixedRateLoanFactory = require('./FixedRateLoanFactory');
const VariableRateLoanFactory = require('./VariableRateLoanFactory');

class LoanFactory extends ILoanFactory {
    constructor() {
        super();
        this.factories = {
            fixed: new FixedRateLoanFactory(),
            variable: new VariableRateLoanFactory()
        };
    }

    async createFromOffer(offer, lenderId, borrowerId, rateType = 'fixed') {
        return this._getFactory(rateType).createFromOffer(offer, lenderId, borrowerId);
    }

    async createLoan(config) {
        return this._getFactory(config.rateType || 'fixed').createLoan(config);
    }

    registerFactory(rateType, factory) {
        if (!factory || typeof factory.createFromOffer !== 'function') {
            throw new Error('La factory debe implementar createFromOffer()');
        }
        this.factories[rateType.toLowerCase()] = factory;
    }

    getSupportedRateTypes() {
        return Object.keys(this.factories);
    }

    _getFactory(rateType) {
        const type = String(rateType).toLowerCase();
        const factory = this.factories[type];

        if (!factory) {
            throw new Error(
                `Tipo de tasa '${rateType}' no soportado. Disponibles: ${this.getSupportedRateTypes().join(', ')}`
            );
        }

        return factory;
    }
}

module.exports = LoanFactory;
