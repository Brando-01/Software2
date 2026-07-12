const { Loan, Offer, Liquidation, Wallet } = require('../models');
const ActiveState = require('../states/ActiveState');
const LiquidatingState = require('../states/LiquidatingState');
const LiquidatedState = require('../states/LiquidatedState');
const LiquidateCommand = require('../commands/LiquidateCommand');
const LedgerService = require('./LedgerService');
const NotificationService = require('./NotificationService');
const priceOracle = require('./priceOracle');

class LiquidationService {
  constructor(deps = {}) {
    this.models = {
      Loan: deps.Loan || Loan,
      Offer: deps.Offer || Offer,
      Liquidation: deps.Liquidation || Liquidation,
      Wallet: deps.Wallet || Wallet
    };
    this.ledgerService = deps.ledgerService || new LedgerService();
    this.notificationService = deps.notificationService || new NotificationService();
    this.priceOracle = deps.priceOracle || priceOracle;
  }

  _stateFromStatus(status) {
    switch (status) {
      case 'active': return new ActiveState();
      case 'liquidating': return new LiquidatingState();
      case 'liquidated': return new LiquidatedState();
      default: return new LiquidatedState();
    }
  }

  async liquidateManual(loanId, context = {}) {
    const loan = await this.models.Loan.findByPk(loanId, {
      include: [{ model: this.models.Offer }]
    });
    if (!loan) {
      const err = new Error('Préstamo no encontrado');
      err.statusCode = 404;
      throw err;
    }
    return this._dispatch(loan, { ...context, reason: context.reason || 'manual_admin' });
  }

  async liquidateAutomatic(loan, context = {}) {
    return this._dispatch(loan, { ...context, reason: context.reason || 'auto_critical_ltv' });
  }

  async _dispatch(loan, context) {
    const state = this._stateFromStatus(loan.status);
    if (!state.canLiquidate()) {
      const err = new Error(`Préstamo no liquidable (estado ${state.name})`);
      err.statusCode = 400;
      throw err;
    }
    const command = new LiquidateCommand(loan, this, context);
    return command.execute();
  }

  async performLiquidation(loan, context = {}) {

    let state = new ActiveState();
    state = state.next();
    const finalState = state.next();

    const offer = loan.Offer || null;
    const collateralSeized = offer ? parseFloat(offer.collateralAmount || 0) : 0;
    const amountRecovered = parseFloat(loan.remainingBalance || 0);
    const ltv = context.ltv != null ? parseFloat(context.ltv) : parseFloat(loan.ltv || 0);

    await loan.update({
      status: 'liquidated',
      liquidationDate: new Date()
    });

    const liquidation = await this.models.Liquidation.create({
      loanId: loan.id,
      ltvAtLiquidation: ltv,
      collateralSeized,
      amountRecovered,
      reason: context.reason || 'auto_critical_ltv'
    });

    await this._settleWallets(loan, amountRecovered);

    // Aqui se aplicaron los asientos del ledger

    const ledgerEntries = [];
    ledgerEntries.push(
      await this.ledgerService.record(loan.lenderId, 'LIQUIDATION', amountRecovered, 'liquidation', liquidation.id)
    );
    ledgerEntries.push(
      await this.ledgerService.record(loan.borrowerId, 'RELEASE', collateralSeized, 'liquidation', liquidation.id)
    );

    const title = 'Préstamo liquidado';
    const notifications = [];
    notifications.push(
      await this.notificationService.notify(
        loan.borrowerId, 'LIQUIDATION', title,
        `Tu préstamo #${loan.id} fue liquidado (LTV ${ltv}%). Colateral incautado: ${collateralSeized}.`
      )
    );
    notifications.push(
      await this.notificationService.notify(
        loan.lenderId, 'LIQUIDATION', title,
        `El préstamo #${loan.id} fue liquidado. Capital recuperado: ${amountRecovered}.`
      )
    );

    return {
      liquidation,
      finalState: finalState.name,
      ledgerEntries,
      notifications
    };
  }

  async _settleWallets(loan, amountRecovered) {
    try {
      const lenderWallet = await this.models.Wallet.findOne({ where: { userId: loan.lenderId } });
      if (lenderWallet) {
        await lenderWallet.update({
          availableBalance: parseFloat(lenderWallet.availableBalance) + amountRecovered,
          blockedBalance: Math.max(0, parseFloat(lenderWallet.blockedBalance) - amountRecovered)
        });
      }
    } catch (error) {
      console.warn('LiquidationService. No se pudieron ajustar wallets:', error.message);
    }
  }

  async getLiquidation(loanId) {
    return this.models.Liquidation.findOne({ where: { loanId } });
  }
}

module.exports = LiquidationService;
