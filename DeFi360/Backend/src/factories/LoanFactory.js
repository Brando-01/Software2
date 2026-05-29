/**
 * LoanFactory: Factory orchestrator que selecciona el tipo correcto de factory
 * Implementa patrón Factory Method
 * SOLID: OCP - Nuevos tipos de préstamos sin modificar LoanController
 *         DIP - LoanController depende de ILoanFactory
 */
const ILoanFactory = require('../interfaces/ILoanFactory');
const FixedRateLoanFactory = require('./FixedRateLoanFactory');
const VariableRateLoanFactory = require('./VariableRateLoanFactory');

class LoanFactory extends ILoanFactory {
    constructor() {
        super();
        this.factories = {
            'fixed': new FixedRateLoanFactory(),
            'variable': new VariableRateLoanFactory()
        };
    }

    /**
     * Crea un préstamo desde una oferta, seleccionando el tipo de factory
     * @param {Object} offer - Oferta de mercado
     * @param {string} lenderId - ID del prestamista
     * @param {string} borrowerId - ID del prestatario
     * @param {string} rateType - Tipo de tasa ('fixed' o 'variable')
     */
    async createFromOffer(offer, lenderId, borrowerId, rateType = 'fixed') {
        const factory = this._getFactory(rateType);
        return await factory.createFromOffer(offer, lenderId, borrowerId);
    }

    /**
     * Crea un préstamo con parámetros directos
     * @param {Object} config - Configuración del préstamo
     * @param {string} config.rateType - Tipo de tasa ('fixed' o 'variable')
     */
    async createLoan(config) {
        const rateType = config.rateType || 'fixed';
        const factory = this._getFactory(rateType);
        return await factory.createLoan(config);
    }

    /**
     * Obtiene la factory correcta según el tipo de tasa
     * @private
     */
    _getFactory(rateType) {
        const type = rateType.toLowerCase();
        
        if (!this.factories.hasOwnProperty(type)) {
            throw new Error(
                `Tipo de tasa '${rateType}' no soportado. ` +
                `Tipos disponibles: ${Object.keys(this.factories).join(', ')}`
            );
        }

        return this.factories[type];
    }

    /**
     * Registra una nueva factory para un tipo de tasa
     * Permite extensión sin modificar código existente (OCP)
     */
    registerFactory(rateType, factory) {
        if (!factory || typeof factory.createFromOffer !== 'function') {
            throw new Error('La factory debe implementar createFromOffer()');
        }
        this.factories[rateType.toLowerCase()] = factory;
    }

    /**
     * Obtiene lista de tipos de tasa soportados
     */
    getSupportedRateTypes() {
        return Object.keys(this.factories);
    }
}

module.exports = LoanFactory;


