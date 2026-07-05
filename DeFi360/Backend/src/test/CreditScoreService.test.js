const CreditScoreService = require('../services/CreditScoreService');
const PaymentHistoryScoringStrategy = require('../strategies/PaymentHistoryScoringStrategy');

function makeModels({ payments = [], loans = [] } = {}) {
  return {
    LedgerEntry: {
      async findAll({ where }) {
        return payments.filter((p) => p.userId === where.userId && p.type === where.type);
      }
    },
    Loan: {
      async findAll({ where }) {
        return loans.filter((l) => l.borrowerId === where.borrowerId);
      }
    }
  };
}

describe('CreditScoreService (HU-11 · Strategy)', () => {
  test('Buen pagador (4 pagos a tiempo, 0 moras) -> score >= 750 y "excellent"', async () => {
    const payments = [1, 2, 3, 4].map((i) => ({ userId: 7, type: 'PAYMENT', id: i }));
    const service = new CreditScoreService(new PaymentHistoryScoringStrategy(), makeModels({ payments, loans: [] }));

    const result = await service.getScore(7);
    expect(result.score).toBeGreaterThanOrEqual(750);
    expect(result.category).toBe('excellent');
  });

  test('Moroso (1 pago a tiempo, 3 moras) -> score < 500 y "poor"', async () => {
    const payments = [{ userId: 8, type: 'PAYMENT', id: 1 }];
    const loans = [
      { borrowerId: 8, status: 'liquidated' },
      { borrowerId: 8, status: 'liquidated' },
      { borrowerId: 8, status: 'liquidated' }
    ];
    const service = new CreditScoreService(new PaymentHistoryScoringStrategy(), makeModels({ payments, loans }));

    const result = await service.getScore(8);
    expect(result.score).toBeLessThan(500);
    expect(result.category).toBe('poor');
  });

  test('Sin historial -> score base 650 y "fair"', async () => {
    const service = new CreditScoreService(new PaymentHistoryScoringStrategy(), makeModels({ payments: [], loans: [] }));
    const result = await service.getScore(9);
    expect(result.score).toBe(650);
    expect(result.category).toBe('fair');
  });

  test('buildHistory cuenta onTime (pagos), late (liquidados) y defaults', async () => {
    const payments = [{ userId: 5, type: 'PAYMENT' }, { userId: 5, type: 'PAYMENT' }];
    const loans = [
      { borrowerId: 5, status: 'defaulted' },
      { borrowerId: 5, status: 'liquidated' },
      { borrowerId: 5, status: 'paid' }
    ];
    const service = new CreditScoreService(new PaymentHistoryScoringStrategy(), makeModels({ payments, loans }));
    const history = await service.buildHistory(5);
    expect(history.onTime).toBe(2);
    expect(history.late).toBe(1);
    expect(history.defaults).toBe(1);
  });

  test('Strategy es configurable (OCP): categorías respetan umbrales 500/650/750', () => {
    const strat = new PaymentHistoryScoringStrategy();
    expect(strat.categorize(499)).toBe('poor');
    expect(strat.categorize(500)).toBe('fair');
    expect(strat.categorize(649)).toBe('fair');
    expect(strat.categorize(650)).toBe('fair');
    expect(strat.categorize(651)).toBe('good');
    expect(strat.categorize(749)).toBe('good');
    expect(strat.categorize(750)).toBe('excellent');
  });
});
