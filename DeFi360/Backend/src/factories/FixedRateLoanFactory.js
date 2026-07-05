const ILoanFactory = require('../interfaces/ILoanFactory');
const { Loan } = require('../models');

class FixedRateLoanFactory extends ILoanFactory {
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

        const loan = await Loan.create({
            lenderId,
            borrowerId,
            offerId: offer.id,
            amount: offer.amount,
            apy: offer.apy,
            rateType: 'fixed',
            duration: offer.duration,
            ltv,
            remainingBalance: offer.amount,
            status: 'active',
            endDate
        });

        return loan;
    }

    async createLoan(config) {
        const {
            lenderId,
            borrowerId,
            amount,
            apy,
            duration,
            collateralAmount,
            offerId = null
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

        const loan = await Loan.create({
            lenderId,
            borrowerId,
            offerId,
            amount,
            apy,
            rateType: 'fixed',
            duration,
            ltv,
            remainingBalance: amount,
            status: 'active',
            endDate
        });

        return loan;
    }
}

module.exports = FixedRateLoanFactory;
