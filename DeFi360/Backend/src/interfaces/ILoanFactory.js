class ILoanFactory {
    async createFromOffer(offer, lenderId, borrowerId) {
        throw new Error('ILoanFactory.createFromOffer() debe ser implementado');
    }
<<<<<<< HEAD
=======

    async createLoan(config) {
        throw new Error('ILoanFactory.createLoan() debe ser implementado');
    }
>>>>>>> 08f070ad70ba6ed75feeb9cc53457694cc1c46ff
}

module.exports = ILoanFactory;

