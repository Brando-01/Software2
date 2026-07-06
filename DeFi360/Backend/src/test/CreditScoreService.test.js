const CreditScoreService = require('../services/CreditScoreService');
const PaymentHistoryScoringStrategy = require('../strategies/PaymentHistoryScoringStrategy');

// Constantes para mejor legibilidad
const SCORE_THRESHOLDS = {
  POOR: 500,
  FAIR: 650,
  GOOD: 750
};

const USER_IDS = {
  GOOD_PAYER: 7,
  POOR_PAYER: 8,
  NO_HISTORY: 9,
  MIXED_HISTORY: 5
};

const PAYMENT_TYPES = {
  PAYMENT: 'PAYMENT'
};

const LOAN_STATUSES = {
  DEFAULTED: 'defaulted',
  LIQUIDATED: 'liquidated',
  PAID: 'paid'
};

function makeModels({ payments = [], loans = [] } = {}) {
  return {
    LedgerEntry: {
      async findAll({ where }) {
        return payments.filter(p => 
          p.userId === where.userId && p.type === where.type
        );
      }
    },
    Loan: {
      async findAll({ where }) {
        return loans.filter(l => l.borrowerId === where.borrowerId);
      }
    }
  };
}

describe('CreditScoreService (HU-11 · Strategy)', () => {
  const createPayment = (userId, id) => ({ 
    userId, 
    type: PAYMENT_TYPES.PAYMENT, 
    id 
  });

  const createLoan = (borrowerId, status) => ({ 
    borrowerId, 
    status 
  });

  test('Buen pagador (4 pagos a tiempo, 0 moras) -> score >= 750 y "excellent"', async () => {
    const payments = [1, 2, 3, 4].map(id => createPayment(USER_IDS.GOOD_PAYER, id));
    const service = new CreditScoreService(
      new PaymentHistoryScoringStrategy(), 
      makeModels({ payments, loans: [] })
    );

    const result = await service.getScore(USER_IDS.GOOD_PAYER);
    expect(result.score).toBeGreaterThanOrEqual(SCORE_THRESHOLDS.GOOD);
    expect(result.category).toBe('excellent');
  });

  test('Moroso (1 pago a tiempo, 3 moras) -> score < 500 y "poor"', async () => {
    const payments = [createPayment(USER_IDS.POOR_PAYER, 1)];
    const loans = [1, 2, 3].map(() => 
      createLoan(USER_IDS.POOR_PAYER, LOAN_STATUSES.LIQUIDATED)
    );
    
    const service = new CreditScoreService(
      new PaymentHistoryScoringStrategy(), 
      makeModels({ payments, loans })
    );

    const result = await service.getScore(USER_IDS.POOR_PAYER);
    expect(result.score).toBeLessThan(SCORE_THRESHOLDS.POOR);
    expect(result.category).toBe('poor');
  });

  test('Sin historial -> score base 650 y "fair"', async () => {
    const service = new CreditScoreService(
      new PaymentHistoryScoringStrategy(), 
      makeModels({ payments: [], loans: [] })
    );
    
    const result = await service.getScore(USER_IDS.NO_HISTORY);
    expect(result.score).toBe(SCORE_THRESHOLDS.FAIR);
    expect(result.category).toBe('fair');
  });

  test('buildHistory cuenta onTime (pagos), late (liquidados) y defaults', async () => {
    const payments = [
      createPayment(USER_IDS.MIXED_HISTORY, 1), 
      createPayment(USER_IDS.MIXED_HISTORY, 2)
    ];
    const loans = [
      createLoan(USER_IDS.MIXED_HISTORY, LOAN_STATUSES.DEFAULTED),
      createLoan(USER_IDS.MIXED_HISTORY, LOAN_STATUSES.LIQUIDATED),
      createLoan(USER_IDS.MIXED_HISTORY, LOAN_STATUSES.PAID)
    ];
    
    const service = new CreditScoreService(
      new PaymentHistoryScoringStrategy(), 
      makeModels({ payments, loans })
    );
    
    const history = await service.buildHistory(USER_IDS.MIXED_HISTORY);
    expect(history.onTime).toBe(2);
    expect(history.late).toBe(1);
    expect(history.defaults).toBe(1);
  });

  test('Strategy es configurable (OCP): categorías respetan umbrales 500/650/750', () => {
    const strat = new PaymentHistoryScoringStrategy();
    
    // Usar constantes para los umbrales
    const testCases = [
      { score: SCORE_THRESHOLDS.POOR - 1, expected: 'poor' },
      { score: SCORE_THRESHOLDS.POOR, expected: 'fair' },
      { score: SCORE_THRESHOLDS.FAIR - 1, expected: 'fair' },
      { score: SCORE_THRESHOLDS.FAIR, expected: 'fair' },
      { score: SCORE_THRESHOLDS.FAIR + 1, expected: 'good' },
      { score: SCORE_THRESHOLDS.GOOD - 1, expected: 'good' },
      { score: SCORE_THRESHOLDS.GOOD, expected: 'excellent' }
    ];

    testCases.forEach(({ score, expected }) => {
      expect(strat.categorize(score)).toBe(expected);
    });
  });

  // Tests adicionales para casos de borde
  test('Maneja correctamente pagos sin historial de préstamos', async () => {
    const payments = [createPayment(USER_IDS.GOOD_PAYER, 1)];
    const service = new CreditScoreService(
      new PaymentHistoryScoringStrategy(), 
      makeModels({ payments, loans: [] })
    );
    
    const result = await service.getScore(USER_IDS.GOOD_PAYER);
    expect(result.score).toBeDefined();
    expect(result.category).toBeDefined();
  });

  test('Maneja correctamente datos vacíos o nulos', async () => {
    const service = new CreditScoreService(
      new PaymentHistoryScoringStrategy(), 
      makeModels()
    );
    
    const result = await service.getScore(999); // Usuario inexistente
    expect(result.score).toBe(SCORE_THRESHOLDS.FAIR);
    expect(result.category).toBe('fair');
  });
});