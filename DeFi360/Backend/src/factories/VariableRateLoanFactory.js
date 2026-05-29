/**
 * VariableRateLoanFactory: Factory para crear préstamos con tasa variable
 * Implementa patrón Factory Method
 * SOLID: OCP - Permite extensión sin modificar LoanController
 */
const ILoanFactory = require('../interfaces/ILoanFactory');
const { Loan } = require('../models');

class VariableRateLoanFactory extends ILoanFactory {
    constructor(rateAdjustmentPeriod = 30) {
        super();
        this.rateAdjustmentPeriod = rateAdjustmentPeriod; // días para reajuste de tasa
    }

    async createFromOffer(offer, lenderId, borrowerId) {
        if (!offer || !lenderId || !borrowerId) {
            throw new Error('offer, lenderId y borrowerId son obligatorios');
        }

        const endDate = new Date(
            Date.now() + offer.duration * 24 * 60 * 60 * 1000
        );

        const ltv = offer.collateralAmount 
            ? ((offer.amount / (offer.collateralAmount * 3000)) * 100).toFixed(2) 
            : null;

        // Calcular fecha de próximo reajuste de tasa
        const nextRateAdjustmentDate = new Date(
            Date.now() + this.rateAdjustmentPeriod * 24 * 60 * 60 * 1000
        );

        // Crear préstamo con tasa variable
        const loan = await Loan.create({
            lenderId,
            borrowerId,
            offerId: offer.id,
            amount: offer.amount,
            apy: offer.apy,
            baseApy: offer.apy, // Guardar APY base para cálculos
            rateType: 'variable', // Tasa variable
            rateAdjustmentPeriod: this.rateAdjustmentPeriod,
            nextRateAdjustmentDate,
            duration: offer.duration,
            ltv,
            remainingBalance: offer.amount,
            status: 'active',
            endDate
        });

        return loan;
    }

    /**
     * Método adicional para crear préstamo con parámetros directos
     */
    async createLoan(config) {
        const { 
            lenderId, 
            borrowerId, 
            amount, 
            apy, 
            duration, 
            collateralAmount,
            offerId = null,
            rateAdjustmentPeriod = this.rateAdjustmentPeriod
        } = config;

        if (!lenderId || !borrowerId || !amount || !apy || !duration) {
            throw new Error('Faltan parámetros requeridos para crear préstamo');
        }

        const endDate = new Date(
            Date.now() + duration * 24 * 60 * 60 * 1000
        );

        const ltv = collateralAmount 
            ? ((amount / (collateralAmount * 3000)) * 100).toFixed(2)
            : null;

        const nextRateAdjustmentDate = new Date(
            Date.now() + rateAdjustmentPeriod * 24 * 60 * 60 * 1000
        );

        const loan = await Loan.create({
            lenderId,
            borrowerId,
            offerId,
            amount,
            apy,
            baseApy: apy,
            rateType: 'variable',
            rateAdjustmentPeriod,
            nextRateAdjustmentDate,
            duration,
            ltv,
            remainingBalance: amount,
            status: 'active',
            endDate
        });

        return loan;
    }

    /**
     * Ajusta la tasa de un préstamo variable según el mercado
     * (Podría basarse en un oracle de tasas)
     */
    async adjustRate(loan, newApy) {
        const adjustment = ((newApy - loan.apy) / loan.apy * 100).toFixed(2);
        
        return {
            oldApy: loan.apy,
            newApy,
            adjustmentPercentage: adjustment,
            message: `Tasa ajustada de ${loan.apy}% a ${newApy}% (${adjustment}%)`
        };
    }
}

module.exports = VariableRateLoanFactory;
