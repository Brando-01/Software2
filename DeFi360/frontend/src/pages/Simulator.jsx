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
      const collateralValue = 3000;
      const ltv = (amount / collateralValue) * 100;
      const monthlyPayment = (amount * (apy / 100) / 12).toFixed(2);
      
      setResult({
        type: 'borrow',
        ltv: ltv.toFixed(1),
        monthlyPayment: monthlyPayment,
        risk: ltv > 80 ? 'Alto' : ltv > 60 ? 'Moderado' : 'Bajo',
        message: `Solicitar $${amount} con 1 ETH de colateral ($${collateralValue}) da un LTV de ${ltv.toFixed(1)}%`
      });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Simulador DeFi</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Simula escenarios de inversión o préstamo sin riesgo</p>
      </div>

      <div className="grid-2">
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid #e4e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px', color: '#111827' }}>Configurar Escenario</h3>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Tipo de simulación</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setScenario({...scenario, type: 'lend'})}
                style={{ 
                  flex: 1,
                  background: scenario.type === 'lend' ? '#059669' : '#ffffff',
                  border: scenario.type === 'lend' ? 'none' : '1px solid #e4e7eb',
                  color: scenario.type === 'lend' ? 'white' : '#374151'
                }}
              >
                Prestar (Lend)
              </button>
              <button 
                type="button"
                onClick={() => setScenario({...scenario, type: 'borrow'})}
                style={{ 
                  flex: 1,
                  background: scenario.type === 'borrow' ? '#d97706' : '#ffffff',
                  border: scenario.type === 'borrow' ? 'none' : '1px solid #e4e7eb',
                  color: scenario.type === 'borrow' ? 'white' : '#374151'
                }}
              >
                Pedir (Borrow)
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Monto (USD)</label>
            <input
              type="number"
              value={scenario.amount}
              onChange={(e) => setScenario({...scenario, amount: e.target.value})}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
              {scenario.type === 'lend' ? 'Tasa (APY %)' : 'Tasa de interés %'}
            </label>
            <input
              type="number"
              step="0.5"
              value={scenario.apy}
              onChange={(e) => setScenario({...scenario, apy: e.target.value})}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Plazo (días)</label>
            <input
              type="number"
              value={scenario.duration}
              onChange={(e) => setScenario({...scenario, duration: e.target.value})}
            />
          </div>

          <button onClick={runSimulation} style={{ width: '100%' }}>
            Simular Escenario
          </button>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '28px', border: '1px solid #e4e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>Resultado de la Simulación</h3>
          {result ? (
            <div>
              <p style={{ fontSize: '14px', color: '#374151', marginBottom: '20px', lineHeight: '1.5' }}>{result.message}</p>
              
              {result.type === 'lend' && (
                <div style={{ 
                  padding: '20px', 
                  background: '#ecfdf5', 
                  borderRadius: '12px',
                  border: '1px solid #a7f3d0'
                }}>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Ganancia estimada</p>
                  <h2 style={{ fontSize: '30px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>+${result.gain} USD</h2>
                  <p style={{ fontSize: '13px', color: '#6b7280' }}>Total al final: ${result.total} USD</p>
                </div>
              )}
              
              {result.type === 'borrow' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e4e7eb' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>LTV (Loan-to-Value)</span>
                    <strong style={{ fontSize: '18px', color: '#1e40af' }}>{result.ltv}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e4e7eb' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>Pago mensual estimado</span>
                    <strong style={{ color: '#111827' }}>${result.monthlyPayment} USD</strong>
                  </div>
                  <div style={{ 
                    padding: '14px', 
                    background: result.risk === 'Alto' ? '#fef2f2' : result.risk === 'Moderado' ? '#fffbeb' : '#ecfdf5',
                    borderRadius: '10px',
                    border: `1px solid ${result.risk === 'Alto' ? '#fecaca' : result.risk === 'Moderado' ? '#fed7aa' : '#a7f3d0'}`
                  }}>
                    <p style={{ 
                      fontSize: '13px', 
                      color: result.risk === 'Alto' ? '#dc2626' : result.risk === 'Moderado' ? '#d97706' : '#059669',
                      fontWeight: '500'
                    }}>
                      ⚠️ Nivel de Riesgo: {result.risk}
                    </p>
                    {result.risk === 'Alto' && (
                      <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>
                        Si el colateral baja de precio, podrías ser liquidado.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '20px' }}>
              Configura un escenario y haz clic en "Simular Escenario" para ver los resultados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Simulator;