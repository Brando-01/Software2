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
  MIXED_HISTORY: 5,
  NON_EXISTENT: 999
};

const PAYMENT_TYPES = {
  PAYMENT: 'PAYMENT'
};

const LOAN_STATUSES = {
  DEFAULTED: 'defaulted',
  LIQUIDATED: 'liquidated',
  PAID: 'paid'
};

const CATEGORIES = {
  POOR: 'poor',
  FAIR: 'fair',
  GOOD: 'good',
  EXCELLENT: 'excellent'
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
  // Helpers
  const createPayment = (userId, id) => ({ 
    userId, 
    type: PAYMENT_TYPES.PAYMENT, 
    id 
  });

  const createLoan = (borrowerId, status) => ({ 
    borrowerId, 
    status 
  });

  const createService = (payments = [], loans = []) => {
    return new CreditScoreService(
      new PaymentHistoryScoringStrategy(), 
      makeModels({ payments, loans })
    );
  };

  // Tests principales
  test('Buen pagador (4 pagos a tiempo, 0 moras) -> score >= 750 y "excellent"', async () => {
    const payments = [1, 2, 3, 4].map(id => createPayment(USER_IDS.GOOD_PAYER, id));
    const service = createService(payments, []);
    
    const result = await service.getScore(USER_IDS.GOOD_PAYER);
    
    expect(result.score).toBeGreaterThanOrEqual(SCORE_THRESHOLDS.GOOD);
    expect(result.category).toBe(CATEGORIES.EXCELLENT);
    expect(result.history.onTime).toBe(4);
    expect(result.history.late).toBe(0);
    expect(result.history.defaults).toBe(0);
  });

  test('Moroso (1 pago a tiempo, 3 moras) -> score < 500 y "poor"', async () => {
    const payments = [createPayment(USER_IDS.POOR_PAYER, 1)];
    const loans = [1, 2, 3].map(() => 
      createLoan(USER_IDS.POOR_PAYER, LOAN_STATUSES.LIQUIDATED)
    );
    
    const service = createService(payments, loans);
    const result = await service.getScore(USER_IDS.POOR_PAYER);
    
    expect(result.score).toBeLessThan(SCORE_THRESHOLDS.POOR);
    expect(result.category).toBe(CATEGORIES.POOR);
  });

  test('Sin historial -> score base 650 y "fair"', async () => {
    const service = createService([], []);
    const result = await service.getScore(USER_IDS.NO_HISTORY);
    
    expect(result.score).toBe(SCORE_THRESHOLDS.FAIR);
    expect(result.category).toBe(CATEGORIES.FAIR);
    expect(result.history.onTime).toBe(0);
    expect(result.history.late).toBe(0);
    expect(result.history.defaults).toBe(0);
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
    
    const service = createService(payments, loans);
    const history = await service.buildHistory(USER_IDS.MIXED_HISTORY);
    
    expect(history.onTime).toBe(2);
    expect(history.late).toBe(1);
    expect(history.defaults).toBe(1);
  });

  test('Strategy es configurable (OCP): categorías respetan umbrales 500/650/750', () => {
    const strat = new PaymentHistoryScoringStrategy();
    
    const testCases = [
      { score: SCORE_THRESHOLDS.POOR - 1, expected: CATEGORIES.POOR },
      { score: SCORE_THRESHOLDS.POOR, expected: CATEGORIES.FAIR },
      { score: SCORE_THRESHOLDS.FAIR - 1, expected: CATEGORIES.FAIR },
      { score: SCORE_THRESHOLDS.FAIR, expected: CATEGORIES.FAIR },
      { score: SCORE_THRESHOLDS.FAIR + 1, expected: CATEGORIES.GOOD },
      { score: SCORE_THRESHOLDS.GOOD - 1, expected: CATEGORIES.GOOD },
      { score: SCORE_THRESHOLDS.GOOD, expected: CATEGORIES.EXCELLENT }
    ];

    testCases.forEach(({ score, expected }) => {
      expect(strat.categorize(score)).toBe(expected);
    });
  });

  // Tests de casos borde
  test('Maneja correctamente pagos sin historial de préstamos', async () => {
    const payments = [createPayment(USER_IDS.GOOD_PAYER, 1)];
    const service = createService(payments, []);
    
    const result = await service.getScore(USER_IDS.GOOD_PAYER);
    
    expect(result.score).toBeDefined();
    expect(result.category).toBeDefined();
    expect(result.userId).toBe(USER_IDS.GOOD_PAYER);
  });

  test('Maneja correctamente datos vacíos o nulos', async () => {
    const service = createService();
    const result = await service.getScore(USER_IDS.NON_EXISTENT);
    
    expect(result.score).toBe(SCORE_THRESHOLDS.FAIR);
    expect(result.category).toBe(CATEGORIES.FAIR);
    expect(result.history.onTime).toBe(0);
    expect(result.history.late).toBe(0);
    expect(result.history.defaults).toBe(0);
  });

  test('userId se parsea correctamente cuando viene como string', async () => {
    const payments = [createPayment(USER_IDS.GOOD_PAYER, 1)];
    const service = createService(payments, []);
    
    const result = await service.getScore(String(USER_IDS.GOOD_PAYER));
    
    expect(result.userId).toBe(USER_IDS.GOOD_PAYER);
    expect(typeof result.userId).toBe('number');
  });

  test('Maneja error cuando userId es inválido', async () => {
    const service = createService();
    
    await expect(service.getScore(null)).rejects.toThrow('userId is required');
    await expect(service.getScore(undefined)).rejects.toThrow('userId is required');
  });
});