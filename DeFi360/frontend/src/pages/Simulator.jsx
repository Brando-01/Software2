import { useState } from 'react';

function Simulator() {
  const [scenario, setScenario] = useState({
    type: 'lend',
    amount: 1000,
    apy: 5,
    duration: 30,
    collateral: 'ETH'
  });
  const [result, setResult] = useState(null);

  const runSimulation = () => {
    const amount = parseFloat(scenario.amount);
    const apy = parseFloat(scenario.apy);
    const duration = parseFloat(scenario.duration);
    
    if (scenario.type === 'lend') {
      const annualReturn = (amount * apy) / 100;
      const returnForPeriod = (annualReturn * duration) / 365;
      setResult({
        type: 'lend',
        gain: returnForPeriod.toFixed(2),
        total: (amount + returnForPeriod).toFixed(2),
        message: `Invertir $${amount} al ${apy}% APY por ${duration} días generaría $${returnForPeriod.toFixed(2)} USD.`
      });
    } else {
      // Simulación de préstamo: cálculo de LTV simulado
      const collateralValue = 3000; // 1 ETH = $3000 simulado
      const ltv = (amount / collateralValue) * 100;
      const monthlyPayment = (amount * (apy / 100) / 12).toFixed(2);
      
      setResult({
        type: 'borrow',
        ltv: ltv.toFixed(1),
        monthlyPayment: monthlyPayment,
        risk: ltv > 80 ? 'Alto' : ltv > 60 ? 'Moderado' : 'Bajo',
        message: `Solicitar $${amount} con 1 ETH de colateral ($${collateralValue}) da un LTV de ${ltv.toFixed(1)}% (${ltv > 80 ? '⚠️ Riesgo de liquidación' : '✅ Aceptable'}).`
      });
    }
  };

  return (
    <div>
      <h1>🔄 Simulador DeFi</h1>
      <p style={{ marginBottom: '20px', color: '#94a3b8' }}>
        Simula escenarios de inversión o préstamo sin riesgo
      </p>

      <div className="grid-2">
        <div className="card">
          <h3>⚙️ Configurar Escenario</h3>
          
          <div style={{ marginBottom: '20px', marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Tipo de simulación</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => setScenario({...scenario, type: 'lend'})}
                style={{ background: scenario.type === 'lend' ? '#10b981' : '#334155' }}
              >
                📈 Prestar (Lend)
              </button>
              <button 
                type="button"
                onClick={() => setScenario({...scenario, type: 'borrow'})}
                style={{ background: scenario.type === 'borrow' ? '#f59e0b' : '#334155' }}
              >
                📉 Pedir (Borrow)
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Monto (USD)</label>
            <input
              type="number"
              value={scenario.amount}
              onChange={(e) => setScenario({...scenario, amount: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              {scenario.type === 'lend' ? 'Tasa (APY %)' : 'Tasa de interés %'}
            </label>
            <input
              type="number"
              step="0.5"
              value={scenario.apy}
              onChange={(e) => setScenario({...scenario, apy: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Plazo (días)</label>
            <input
              type="number"
              value={scenario.duration}
              onChange={(e) => setScenario({...scenario, duration: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>

          {scenario.type === 'borrow' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Colateral</label>
              <select
                value={scenario.collateral}
                onChange={(e) => setScenario({...scenario, collateral: e.target.value})}
                style={{ width: '100%' }}
              >
                <option value="ETH">Ethereum (ETH) - $3,000 USD</option>
                <option value="BTC">Bitcoin (BTC) - $30,000 USD</option>
                <option value="USDC">USDC - $1 USD</option>
              </select>
            </div>
          )}

          <button onClick={runSimulation} style={{ width: '100%', marginTop: '10px' }}>
            Simular Escenario
          </button>
        </div>

        <div className="card">
          <h3>📊 Resultado de la Simulación</h3>
          {result && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '16px', lineHeight: '1.6' }}>{result.message}</p>
              
              {result.type === 'lend' && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#10b98120', borderRadius: '8px' }}>
                  <p><strong>💰 Ganancia:</strong> ${result.gain} USD</p>
                  <p><strong>💵 Total al final:</strong> ${result.total} USD</p>
                </div>
              )}
              
              {result.type === 'borrow' && (
                <div style={{ marginTop: '20px', padding: '15px', background: result.risk === 'Alto' ? '#ef444420' : '#10b98120', borderRadius: '8px' }}>
                  <p><strong>📊 LTV (Loan-to-Value):</strong> {result.ltv}%</p>
                  <p><strong>⚠️ Nivel de Riesgo:</strong> {result.risk}</p>
                  <p><strong>💰 Pago mensual estimado:</strong> ${result.monthlyPayment} USD</p>
                  {result.risk === 'Alto' && (
                    <p style={{ color: '#ef4444', marginTop: '10px' }}>
                      ⚠️ Alerta: LTV alto. Si el colateral baja de precio, podrías ser liquidado.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {!result && (
            <p style={{ marginTop: '20px', color: '#94a3b8' }}>
              Configura un escenario y haz clic en "Simular Escenario" para ver los resultados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Simulator;