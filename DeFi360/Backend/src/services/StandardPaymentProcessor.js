const IPaymentProcessor = require('./IPaymentProcessor');
const { Loan, Wallet, Offer } = require('../models');

class StandardPaymentProcessor extends IPaymentProcessor {

  constructor(deps = {}) {
    super();
    this.ledgerService = deps.ledgerService || null;
    this.notificationService = deps.notificationService || null;
  }

  async processPayment({ loanId, amount, borrowerId, lenderId }) {
    const loan = await Loan.findByPk(loanId, {
      include: [{ model: Offer }]
    });

    if (!loan || loan.status !== 'active') {
      throw new Error('Préstamo no encontrado o no activo');
    }

    const resolvedBorrowerId = borrowerId ?? loan.borrowerId;
    const resolvedLenderId = lenderId ?? loan.lenderId;

    if (loan.borrowerId != null && resolvedBorrowerId != null && loan.borrowerId !== resolvedBorrowerId) {
      throw new Error('No autorizado para pagar este préstamo');
    }

    const paymentAmount = parseFloat(amount);

    if (paymentAmount <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    if (paymentAmount > parseFloat(loan.remainingBalance)) {
      throw new Error('El pago supera el saldo restante del préstamo');
    }

    const borrowerWallet = await Wallet.findOne({ where: { userId: resolvedBorrowerId } });
    const lenderWallet   = await Wallet.findOne({ where: { userId: resolvedLenderId } });

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



    await this._recordSideEffects({
      borrowerId: resolvedBorrowerId,
      lenderId: resolvedLenderId,
      loanId,
      paymentAmount,
      newStatus
    });

    return {
      success: true,
      transactionId: `TXN-${Date.now()}-${loanId}`,
      newRemainingBalance,
      newLTV,
      loanStatus: newStatus
    };
  }


  async _recordSideEffects({ borrowerId, lenderId, loanId, paymentAmount, newStatus }) {
    try {
      const ledger = this.ledgerService || this._defaultLedgerService();
      if (ledger) {

        await ledger.record(borrowerId, 'PAYMENT', paymentAmount, 'loan', loanId);
        await ledger.record(lenderId, 'PAYMENT', paymentAmount, 'loan', loanId);
      }
    } catch (error) {
      console.warn('[StandardPaymentProcessor] No se registró asiento de pago:', error.message);
    }

    try {
      const notifier = this.notificationService || this._defaultNotificationService();
      if (notifier) {
        const msg = newStatus === 'paid'
          ? `Tu préstamo #${loanId} fue pagado completamente.`
          : `Pago de ${paymentAmount} aplicado al préstamo #${loanId}.`;
        await notifier.notify(borrowerId, 'PAYMENT', 'Pago procesado', msg);
      }
    } catch (error) {
      console.warn('[StandardPaymentProcessor] No se envió notificación de pago:', error.message);
    }
  }


  _defaultLedgerService() {
    try {
      const LedgerService = require('./LedgerService');
      return new LedgerService();
    } catch (error) {
      return null;
    }
  }


  _defaultNotificationService() {
    try {
      const NotificationService = require('./NotificationService');
      return new NotificationService();
    } catch (error) {
      return null;
    }
  }

  recalculateLTV(remainingBalance, collateralAmount, collateralPrice = 3000) {
    if (!collateralAmount || collateralAmount <= 0) return null;
    const collateralValue = collateralAmount * collateralPrice;
    return parseFloat(((remainingBalance / collateralValue) * 100).toFixed(2));
  }
}

module.exports = StandardPaymentProcessor;