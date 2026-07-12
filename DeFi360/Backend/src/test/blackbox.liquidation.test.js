const LiquidationService = require('../services/LiquidationService');

// funciones del helper para crear préstamos y dependencias simuladas

function makeLoan(overrides = {}) {
  return {
    id: 1, status: 'active', ltv: 96,
    remainingBalance: 855, lenderId: 20, borrowerId: 10,
    Offer: { collateralAmount: '0.3' },
    async update(data) { Object.assign(this, data); return this; },
    ...overrides
  };
}

// Función para crear dependencias simuladas para el servicio de liquidación

function makeDeps(loan) {
  const liquidations = [];
  return {
    Loan: { async findByPk(id) { return id === loan.id ? loan : null; } },
    Offer: {},
    Liquidation: {
      async create(data) { const r = { id: liquidations.length + 1, ...data }; liquidations.push(r); return r; },
      async findOne({ where }) { return liquidations.find((l) => l.loanId === where.loanId) || null; }
    },
    Wallet: { async findOne() { return null; } },
    ledgerService: { records: [], async record(...a) { this.records.push(a); return { id: this.records.length }; } },
    notificationService: { sent: [], async notify(...a) { this.sent.push(a); return { id: this.sent.length }; } },
    priceOracle: { async getPrice() { return 3000; } }
  };
}

// Pruebas unitarias para el patrón de estado y el servicio de liquidación

describe('Liquidación de préstamo (Caja Negra · HU-09 · >4 campos de entrada)', () => {

  test('CE1 (active + colateral + partes válidas): liquida y produce salida completa', async () => {
    const loan = makeLoan();
    const deps = makeDeps(loan);
    const result = await new LiquidationService(deps).liquidateManual(1, { ltv: 96 });

    expect(loan.status).toBe('liquidated');
    expect(result.finalState).toBe('LIQUIDATED');
    expect(result.liquidation.collateralSeized).toBe(0.3);
    expect(result.liquidation.amountRecovered).toBe(855);
    expect(deps.ledgerService.records.length).toBe(2);
    expect(deps.notificationService.sent.length).toBe(2);
  });

  test('CE2 (status=paid): no liquidable -> error 400 y sin efectos colaterales', async () => {
    const loan = makeLoan({ status: 'paid' });
    const deps = makeDeps(loan);
    const service = new LiquidationService(deps);

    await expect(service.liquidateManual(1, { ltv: 96 })).rejects.toMatchObject({ statusCode: 400 });
    expect(deps.ledgerService.records.length).toBe(0);
    expect(deps.notificationService.sent.length).toBe(0);
  });

  test('CE3 (loanId inexistente): error 404', async () => {
    const loan = makeLoan();
    const deps = makeDeps(loan);
    await expect(new LiquidationService(deps).liquidateManual(999, {}))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  test('CE4 (sin Offer, colateral=0): liquida con collateralSeized=0 (valor límite)', async () => {
    const loan = makeLoan({ Offer: null });
    const deps = makeDeps(loan);
    const result = await new LiquidationService(deps).liquidateManual(1, { ltv: 95 });

    expect(result.liquidation.collateralSeized).toBe(0);
    expect(result.liquidation.amountRecovered).toBe(855);
  });

  test('CE5 (ltv de contexto != ltv del loan): prevalece el de contexto en la Liquidation', async () => {
    const loan = makeLoan({ ltv: 80 });
    const deps = makeDeps(loan);
    const result = await new LiquidationService(deps).liquidateManual(1, { ltv: 97 });

    expect(parseFloat(result.liquidation.ltvAtLiquidation)).toBe(97);
  });
});
