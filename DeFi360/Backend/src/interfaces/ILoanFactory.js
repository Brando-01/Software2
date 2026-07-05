class ILoanFactory {
    async createFromOffer(offer, lenderId, borrowerId) {
        throw new Error('ILoanFactory.createFromOffer() debe ser implementado');
    }

    async createLoan(config) {
        throw new Error('ILoanFactory.createLoan() debe ser implementado');
    }
}

module.exports = ILoanFactory;
