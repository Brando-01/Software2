const { LenderPreference, Offer, User } = require('../models');
const AmountSpec = require('../specifications/AmountSpec');
const ApySpec = require('../specifications/ApySpec');
const CollateralSpec = require('../specifications/CollateralSpec');
const LtvSpec = require('../specifications/LtvSpec');
const CreditScoreSpec = require('../specifications/CreditScoreSpec');
const CreditScoreService = require('./CreditScoreService');
const priceOracle = require('./priceOracle');

class RecommendationService {
  constructor(deps = {}) {
    this.models = {
      LenderPreference: deps.LenderPreference || LenderPreference,
      Offer: deps.Offer || Offer,
      User: deps.User || User
    };
    this.creditScoreService = deps.creditScoreService || new CreditScoreService();
    this.priceOracle = deps.priceOracle || priceOracle;
  }

    buildSpecification(preference) {
    return new AmountSpec(preference.maxAmount)
      .and(new ApySpec(preference.minApy))
      .and(new CollateralSpec(preference.collateralTypes))
      .and(new LtvSpec(preference.maxLtv))
      .and(new CreditScoreSpec(preference.minCreditScore, this.creditScoreService));
  }

    async _enrich(offer) {
    const data = typeof offer.toJSON === 'function' ? offer.toJSON() : { ...offer };
    if (data.collateralType && data.collateralAmount) {
      try {
        const price = await this.priceOracle.getPrice(data.collateralType);
        const collateralValue = parseFloat(data.collateralAmount) * price;
        if (collateralValue > 0) {
          data.ltv = parseFloat(((parseFloat(data.amount) / collateralValue) * 100).toFixed(2));
        }
        data.collateralValueUSD = parseFloat(collateralValue.toFixed(2));
      } catch (error) {

      }
    }
    return data;
  }

    async getRecommendations(lenderId) {
    const preference = await this.models.LenderPreference.findOne({ where: { lenderId } });
    if (!preference) {
      return [];
    }

    const spec = this.buildSpecification(preference);

    const offers = await this.models.Offer.findAll({
      where: { type: 'borrow', status: 'active' }
    });

    const recommendations = [];
    for (const offer of offers) {

      if (offer.userId === lenderId) continue;

      const enriched = await this._enrich(offer);
      const ok = await spec.isSatisfiedBy(enriched);
      if (ok) {
        recommendations.push(enriched);
      }
    }

    recommendations.sort((a, b) => parseFloat(b.apy) - parseFloat(a.apy));
    return recommendations;
  }
}

module.exports = RecommendationService;
