class IPaymentProcessor {
  async processPayment({ loanId, amount, borrowerId, lenderId }) {
    throw new Error('processPayment() debe ser implementado por la subclase');
  }

  recalculateLTV(remainingBalance, collateralAmount, collateralPrice = 3000) {
    throw new Error('recalculateLTV() debe ser implementado por la subclase');
  }
}

module.exports = IPaymentProcessor;
