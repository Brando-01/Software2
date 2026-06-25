const { Offer, Wallet } = require('../models');
const LoanFactory = require('../factories/LoanFactory');
const RecommendationService = require('./RecommendationService');
const LedgerService = require('./LedgerService');
const NotificationService = require('./NotificationService');

class MatchingService {
  constructor(deps = {}) {
    this.models = {
      Offer: deps.Offer || Offer,
      Wallet: deps.Wallet || Wallet
    };
    this.loanFactory = deps.loanFactory || new LoanFactory();
    this.recommendationService = deps.recommendationService || new RecommendationService();
    this.ledgerService = deps.ledgerService || new LedgerService();
    this.notificationService = deps.notificationService || new NotificationService();
  }

    async autoMatch(lenderId, options = {}) {
    const recommendations = await this.recommendationService.getRecommendations(lenderId);
    if (!recommendations || recommendations.length === 0) {
      return null;
    }

    const best = recommendations[0];
    const offer = await this.models.Offer.findByPk(best.id);
    if (!offer || offer.status !== 'active') {
      return null;
    }

    const borrowerId = offer.userId;
    const rateType = options.rateType || 'fixed';

    const loan = await this.loanFactory.createFromOffer(offer, lenderId, borrowerId, rateType);

    await this._settleWallets(lenderId, borrowerId, parseFloat(offer.amount));
    await offer.update({ status: 'matched', matchedWith: lenderId });

    const ledgerEntry = await this.ledgerService.record(
      borrowerId, 'DISBURSEMENT', parseFloat(offer.amount), 'loan', loan.id
    );

    await this.notificationService.notify(
      lenderId, 'MATCH', 'Auto-match realizado',
      `Se creó el préstamo #${loan.id} con la solicitud #${offer.id} (mejor coincidencia).`
    );
    await this.notificationService.notify(
      borrowerId, 'MATCH', 'Tu solicitud fue financiada',
      `Tu solicitud #${offer.id} fue financiada automáticamente (préstamo #${loan.id}).`
    );

    return { loan, offer, ledgerEntry };
  }

    async _settleWallets(lenderId, borrowerId, amount) {
    try {
      const lenderWallet = await this.models.Wallet.findOne({ where: { userId: lenderId } });
      const borrowerWallet = await this.models.Wallet.findOne({ where: { userId: borrowerId } });
      if (lenderWallet) {
        await lenderWallet.update({
          availableBalance: parseFloat(lenderWallet.availableBalance) - amount,
          blockedBalance: parseFloat(lenderWallet.blockedBalance) + amount
        });
      }
      if (borrowerWallet) {
        await borrowerWallet.update({
          availableBalance: parseFloat(borrowerWallet.availableBalance) + amount
        });
      }
    } catch (error) {
      console.warn('[MatchingService] No se pudieron ajustar wallets:', error.message);
    }
  }
}

module.exports = MatchingService;
