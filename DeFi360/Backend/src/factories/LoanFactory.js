const ILoanFactory = require('../interfaces/ILoanFactory');
const { Loan } = require('../../models');

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
    }
}

module.exports = LoanFactory;

