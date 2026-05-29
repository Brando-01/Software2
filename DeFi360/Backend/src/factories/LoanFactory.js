<<<<<<< HEAD
const ILoanFactory = require('../interfaces/ILoanFactory');
const { Loan } = require('../models');

class LoanFactory extends ILoanFactory {
    async createFromOffer(offer, lenderId, borrowerId) {
        if (!offer || !lenderId || !borrowerId) {
            throw new Error('offer, lenderId y borrowerId son obligatorios');
        }

        const endDate = new Date(
            Date.now() + offer.duration * 24 * 60 * 60 * 1000
        );

        const ltv = offer.collateralAmount ? ((offer.amount / (offer.collateralAmount * 3000)) * 100).toFixed(2) : null;

        const loan = await Loan.create({
            lenderId,
            borrowerId,
            offerId: offer.id,
            amount: offer.amount,
            apy: offer.apy,
            duration: offer.duration,
            ltv,
            remainingBalance: offer.amount,
            status: 'active',
            endDate
        });

        return loan;
=======
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
>>>>>>> 08f070ad70ba6ed75feeb9cc53457694cc1c46ff
    }
}

module.exports = LoanFactory;

<<<<<<< HEAD
=======

>>>>>>> 08f070ad70ba6ed75feeb9cc53457694cc1c46ff
