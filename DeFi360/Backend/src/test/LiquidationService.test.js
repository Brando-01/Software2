const LiquidationService = require('../services/LiquidationService');
const ActiveState = require('../states/ActiveState');
const LiquidatedState = require('../states/LiquidatedState');
const LiquidateCommand = require('../commands/LiquidateCommand');

// funciones del helper para crear préstamos y dependencias simuladas

function makeLoan(overrides = {}) {
  return {
    id: 1,
    status: 'active',
    lenderId: 20,
    borrowerId: 10,
    remainingBalance: 855,
    ltv: 96,
    Offer: { collateralAmount: '0.3' },
    updates: [],
    async update(data) { Object.assign(this, data); this.updates.push(data); return this; },
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
      async create(data) { const row = { id: liquidations.length + 1, ...data }; liquidations.push(row); return row; },
      async findOne({ where }) { return liquidations.find((l) => l.loanId === where.loanId) || null; }
    },
    Wallet: { async findOne() { return null; } },
    ledgerService: { records: [], async record(...args) { this.records.push(args); return { id: this.records.length, args }; } },
    notificationService: { sent: [], async notify(...args) { this.sent.push(args); return { id: this.sent.length }; } },
    priceOracle: { async getPrice() { return 3000; } },
    _liquidations: liquidations
  };
}

// Pruebas unitarias para el patrón de estado y el servicio de liquidación

describe('State pattern del préstamo', () => {
  test('ActiveState permite liquidar y avanza a LIQUIDATING; LiquidatedState es terminal', () => {
    const active = new ActiveState();
    expect(active.canLiquidate()).toBe(true);
    expect(active.next().name).toBe('LIQUIDATING');

    const liquidated = new LiquidatedState();
    expect(liquidated.canLiquidate()).toBe(false);
    expect(liquidated.next().name).toBe('LIQUIDATED');
  });
});

// Pruebas unitarias para el servicio de liquidación

describe('LiquidationService (HU-09 · State + Command)', () => {
  test('liquidateAutomatic liquida un préstamo activo y registra todo', async () => {
    const loan = makeLoan();
    const deps = makeDeps(loan);
    const service = new LiquidationService(deps);

    const result = await service.liquidateAutomatic(loan, { ltv: 96 });

    expect(loan.status).toBe('liquidated');
    expect(loan.liquidationDate).toBeInstanceOf(Date);
    expect(result.liquidation.collateralSeized).toBe(0.3);
    expect(result.finalState).toBe('LIQUIDATED');

    expect(deps.ledgerService.records.length).toBe(2);

    expect(deps.notificationService.sent.length).toBe(2);
  });

  test('No liquida un préstamo que no está activo (estado no liquidable)', async () => {
    const loan = makeLoan({ status: 'paid' });
    const deps = makeDeps(loan);
    const service = new LiquidationService(deps);

    await expect(service.liquidateAutomatic(loan, { ltv: 96 })).rejects.toThrow(/no liquidable/);
    expect(deps.ledgerService.records.length).toBe(0);
  });

  test('liquidateManual lanza 404 si el préstamo no existe', async () => {
    const loan = makeLoan();
    const deps = makeDeps(loan);
    const service = new LiquidationService(deps);

    await expect(service.liquidateManual(999, {})).rejects.toMatchObject({ statusCode: 404 });
  });

  test('LiquidateCommand delega en performLiquidation del service', async () => {
    const loan = makeLoan();
    const deps = makeDeps(loan);
    const service = new LiquidationService(deps);
    const command = new LiquidateCommand(loan, service, { ltv: 96 });

    const result = await command.execute();
    expect(result.liquidation).toBeDefined();
    expect(loan.status).toBe('liquidated');
  });

  test('getLiquidation devuelve el registro asociado al préstamo', async () => {
    const loan = makeLoan();
    const deps = makeDeps(loan);
    const service = new LiquidationService(deps);

    await service.liquidateAutomatic(loan, { ltv: 96 });
    const liq = await service.getLiquidation(loan.id);
    expect(liq).not.toBeNull();
    expect(liq.loanId).toBe(loan.id);
  });
});
