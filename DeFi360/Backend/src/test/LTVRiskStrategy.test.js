const LTVRiskStrategy = require('../strategies/LTVRiskStrategy');

function equal(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(msg || `Esperado ${expected} pero fue ${actual}`);
  }
}

describe('T-10: LTVRiskStrategy (HU-04 / HU-08) — umbrales de negocio 75/90/95', () => {

  const strategy = new LTVRiskStrategy();

  test('Caso LTV=80% (Riesgo Normal/Medium, umbral negocio 75)', () => {
    const result = strategy.evaluate(800, 1000);

    equal(parseFloat(result.ratio), 80);
    equal(result.riskLevel, 'medium');
  });

  test('Caso LTV=90% (Riesgo de Alerta/High, umbral negocio 90)', () => {
    const result = strategy.evaluate(900, 1000);

    equal(parseFloat(result.ratio), 90);
    equal(result.riskLevel, 'high');
    equal(result.isHealthy, false);
  });

  test('Caso LTV=95% (Riesgo de Liquidación/Critical, umbral negocio 95)', () => {
    const result = strategy.evaluate(950, 1000);

    equal(parseFloat(result.ratio), 95);
    equal(result.riskLevel, 'critical');
    equal(result.isHealthy, false);
  });

  test('OCP - Verificar que los umbrales son configurables dinámicamente', () => {
    const strictStrategy = new LTVRiskStrategy({
      medium: 10,
      high: 20,
      critical: 30
    });

    const result = strictStrategy.evaluate(25, 100);
    equal(result.riskLevel, 'high');
  });

  test('Debería lanzar error si el colateral es cero (Validación de borde)', () => {
    try {
      strategy.evaluate(100, 0);
      throw new Error('Debería haber fallado');
    } catch (err) {
      if (!err.message.includes('mayor a cero')) {
        throw new Error('No capturó el error de colateral correcto');
      }
    }
  });
});