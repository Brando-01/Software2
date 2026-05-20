const IPaymentProcessor = require('./IPaymentProcessor');
const { Loan, Wallet, Offer } = require('../models');

class StandardPaymentProcessor extends IPaymentProcessor {
  async processPayment({ loanId, amount, borrowerId, lenderId }) {
    const loan = await Loan.findByPk(loanId, {
      include: [{ model: Offer }]
    });

    if (!loan || loan.status !== 'active') {
      throw new Error('Préstamo no encontrado o no activo');
    }

    const paymentAmount = parseFloat(amount);

    if (paymentAmount <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    if (paymentAmount > parseFloat(loan.remainingBalance)) {
      throw new Error('El pago supera el saldo restante del préstamo');
    }

    const borrowerWallet = await Wallet.findOne({ where: { userId: borrowerId } });
    const lenderWallet   = await Wallet.findOne({ where: { userId: lenderId } });

    if (!borrowerWallet || parseFloat(borrowerWallet.availableBalance) < paymentAmount) {
      throw new Error('Saldo insuficiente en el wallet del deudor');
    }

    await borrowerWallet.update({
      availableBalance: parseFloat(borrowerWallet.availableBalance) - paymentAmount
    });

    await lenderWallet.update({
      availableBalance: parseFloat(lenderWallet.availableBalance) + paymentAmount,
      blockedBalance: Math.max(0, parseFloat(lenderWallet.blockedBalance) - paymentAmount)
    });

    const newRemainingBalance = parseFloat(loan.remainingBalance) - paymentAmount;
    const collateralAmount = loan.Offer ? parseFloat(loan.Offer.collateralAmount) : 0;
    const newLTV = this.recalculateLTV(newRemainingBalance, collateralAmount);
    const newStatus = newRemainingBalance <= 0 ? 'paid' : 'active';

    await loan.update({
      remainingBalance: newRemainingBalance,
      ltv: newLTV,
      status: newStatus
    });

    return {
      success: true,
      transactionId: `TXN-${Date.now()}-${loanId}`,
      newRemainingBalance,
      newLTV,
      loanStatus: newStatus
    };
  }

  recalculateLTV(remainingBalance, collateralAmount, collateralPrice = 3000) {
    if (!collateralAmount || collateralAmount <= 0) return null;
    const collateralValue = collateralAmount * collateralPrice;
    return parseFloat(((remainingBalance / collateralValue) * 100).toFixed(2));
  }
}

module.exports = StandardPaymentProcessor;