const LTVRiskStrategy = require('../strategies/LTVRiskStrategy');

function equal(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(msg || `Esperado ${expected} pero fue ${actual}`);
  }
}

describe('T-10: LTVCalculatorService / LTVRiskStrategy (HU-04)', () => {
  
  const customThresholds = {
    medium: 49,   
    high: 89,     
    critical: 94  
  };

  const strategy = new LTVRiskStrategy(customThresholds);

  test('Caso LTV=50% (Riesgo Normal/Medium)', () => {
    const result = strategy.evaluate(500, 1000);
    
    equal(parseFloat(result.ratio), 50);
    equal(result.riskLevel, 'medium'); // 
  });

  test('Caso LTV=90% (Riesgo de Alerta/High)', () => {
    const result = strategy.evaluate(900, 1000);
    
    equal(parseFloat(result.ratio), 90);
    equal(result.riskLevel, 'high'); 
  });

  test('Caso LTV=95% (Riesgo de Liquidación/Critical)', () => {
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