const LTVRiskStrategy = require('../strategies/LTVRiskStrategy');

function equal(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Esperado ${expected} pero fue ${actual}`);
  }
}

function throws(fn, expectedMessage) {
  try {
    fn();
    throw new Error('Se esperaba que la función lanzara un error');
  } catch (err) {
    if (!err.message.includes(expectedMessage)) {
      throw new Error(`Error esperado "${expectedMessage}", pero fue "${err.message}"`);
    }
  }
}

describe('LTVRiskStrategy - QA Validation', () => {
  const strategy = new LTVRiskStrategy({ medium: 50, high: 70, critical: 80 });

  test('Debería retornar nivel CRITICAL cuando LTV > 80%', () => {
    const result = strategy.evaluate(85, 100);
    equal(result.riskLevel, 'critical');
    equal(result.isHealthy, false);
  });

  test('Debería retornar nivel MEDIUM cuando LTV > 50%', () => {
    const result = strategy.evaluate(55, 100);
    equal(result.riskLevel, 'medium');
    equal(result.isHealthy, true);
  });

  test('Debería lanzar error con colateral en cero', () => {
    throws(() => strategy.evaluate(100, 0), 'El valor del colateral debe ser mayor a cero');
  });
});