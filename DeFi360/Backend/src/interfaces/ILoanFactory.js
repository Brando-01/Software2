class ILoanFactory {
    async createFromOffer(offer, lenderId, borrowerId) {
        throw new Error('ILoanFactory.createFromOffer() debe ser implementado');
    }
}

module.exports = ILoanFactory;

