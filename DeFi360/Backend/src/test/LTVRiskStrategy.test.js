const LTVRiskStrategy = require('../strategies/LTVRiskStrategy');

describe('LTVRiskStrategy - QA Validation', () => {
  const strategy = new LTVRiskStrategy({ medium: 50, high: 70, critical: 80 });

  test('Debería retornar nivel CRITICAL cuando LTV > 80%', () => {
    const result = strategy.evaluate(85, 100);
    expect(result.riskLevel).toBe('critical');
    expect(result.isHealthy).toBe(false);
  });

  test('Debería retornar nivel MEDIUM cuando LTV > 50%', () => {
    const result = strategy.evaluate(55, 100);
    expect(result.riskLevel).toBe('medium');
    expect(result.isHealthy).toBe(true);
  });

  test('Debería lanzar error con colateral en cero', () => {
    expect(() => strategy.evaluate(100, 0)).toThrow('El valor del colateral debe ser mayor a cero');
  });
});