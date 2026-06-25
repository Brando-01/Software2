const RecommendationService = require('../services/RecommendationService');
const MatchingService = require('../services/MatchingService');
const AmountSpec = require('../specifications/AmountSpec');
const ApySpec = require('../specifications/ApySpec');

function makeOffer(o) {
  return {
    id: o.id, userId: o.userId, type: 'borrow', status: 'active',
    amount: o.amount, apy: o.apy, collateralType: o.collateralType || 'ETH',
    collateralAmount: o.collateralAmount || 1,
    toJSON() { return { ...this }; },
    update(fields) { Object.assign(this, fields); return Promise.resolve(this); }
  };
}

function makeRecoDeps({ preference, offers, scores = {} }) {
  return {
    LenderPreference: { async findOne({ where }) { return where.lenderId === preference.lenderId ? preference : null; } },
    Offer: { async findAll() { return offers; } },
    User: {},
    creditScoreService: { async getScore(userId) { return { score: scores[userId] ?? 650, category: 'fair' }; } },
    priceOracle: { async getPrice() { return 3000; } }
  };
}

describe('Specification componible (HU-15)', () => {
  test('and() exige que todas las specs se cumplan', async () => {
    const spec = new AmountSpec(1000).and(new ApySpec(5));
    expect(await spec.isSatisfiedBy({ amount: 800, apy: 6 })).toBe(true);
    expect(await spec.isSatisfiedBy({ amount: 1200, apy: 6 })).toBe(false);
    expect(await spec.isSatisfiedBy({ amount: 800, apy: 4 })).toBe(false);
  });
});

describe('RecommendationService (HU-15)', () => {
  test('Recomienda solicitudes que cumplen TODAS las preferencias', async () => {
    const preference = {
      lenderId: 20, maxAmount: 2000, minApy: 5,
      collateralTypes: ['ETH'], maxLtv: 80, minCreditScore: 650
    };
    const offers = [
      makeOffer({ id: 1, userId: 10, amount: 1500, apy: 6, collateralAmount: 1 })
    ];
    const service = new RecommendationService(makeRecoDeps({ preference, offers, scores: { 10: 700 } }));

    const recs = await service.getRecommendations(20);
    expect(recs.length).toBe(1);
    expect(recs[0].id).toBe(1);
    expect(recs[0].ltv).toBe(50);
  });

  test('Excluye solicitud de prestatario con score por debajo del mínimo', async () => {
    const preference = {
      lenderId: 20, maxAmount: 2000, minApy: 5,
      collateralTypes: ['ETH'], maxLtv: 80, minCreditScore: 650
    };
    const offers = [makeOffer({ id: 2, userId: 11, amount: 1500, apy: 6, collateralAmount: 1 })];
    const service = new RecommendationService(makeRecoDeps({ preference, offers, scores: { 11: 500 } }));

    const recs = await service.getRecommendations(20);
    expect(recs.length).toBe(0);
  });

  test('Excluye solicitud con LTV mayor al máximo permitido', async () => {
    const preference = {
      lenderId: 20, maxAmount: 5000, minApy: 5,
      collateralTypes: ['ETH'], maxLtv: 40, minCreditScore: 650
    };

    const offers = [makeOffer({ id: 3, userId: 12, amount: 2900, apy: 6, collateralAmount: 1 })];
    const service = new RecommendationService(makeRecoDeps({ preference, offers, scores: { 12: 700 } }));

    const recs = await service.getRecommendations(20);
    expect(recs.length).toBe(0);
  });

  test('Sin preferencias guardadas, no hay recomendaciones', async () => {
    const service = new RecommendationService(makeRecoDeps({
      preference: { lenderId: 99 }, offers: []
    }));
    const recs = await service.getRecommendations(20);
    expect(recs).toEqual([]);
  });
});

describe('MatchingService (HU-15 · auto-match)', () => {
  test('autoMatch crea préstamo con la mejor recomendación (reutiliza LoanFactory)', async () => {
    const bestOffer = makeOffer({ id: 7, userId: 10, amount: 1500, apy: 8, collateralAmount: 1 });

    const deps = {
      Offer: { async findByPk(id) { return id === 7 ? bestOffer : null; } },
      Wallet: { async findOne() { return null; } },
      loanFactory: {
        async createFromOffer(offer, lenderId, borrowerId) {
          return { id: 100, lenderId, borrowerId, amount: offer.amount, status: 'active', rateType: 'fixed' };
        }
      },
      recommendationService: { async getRecommendations() { return [bestOffer.toJSON()]; } },
      ledgerService: { records: [], async record(...a) { this.records.push(a); return { id: 1 }; } },
      notificationService: { sent: [], async notify(...a) { this.sent.push(a); return { id: 1 }; } }
    };
    const service = new MatchingService(deps);

    const result = await service.autoMatch(20);
    expect(result.loan.id).toBe(100);
    expect(result.loan.borrowerId).toBe(10);
    expect(deps.ledgerService.records.length).toBe(1);
    expect(deps.ledgerService.records[0][1]).toBe('DISBURSEMENT');
    expect(deps.notificationService.sent.length).toBe(2);
    expect(bestOffer.status).toBe('matched');
  });

  test('autoMatch devuelve null si no hay recomendaciones compatibles', async () => {
    const service = new MatchingService({
      recommendationService: { async getRecommendations() { return []; } }
    });
    const result = await service.autoMatch(20);
    expect(result).toBeNull();
  });
});
