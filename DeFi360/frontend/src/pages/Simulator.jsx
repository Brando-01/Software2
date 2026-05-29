import { useState } from 'react';
import RiskBadge from '../components/RiskBadge';
import { riskFromLtv } from '../utils/risk';

function Simulator() {
  const [scenario, setScenario] = useState({ type: 'lend', amount: 1000, apy: 5, duration: 30 });
  const [result, setResult] = useState(null);

  const update = (field) => (e) => setScenario({ ...scenario, [field]: e.target.value });

  const runSimulation = () => {
    const amount = parseFloat(scenario.amount);
    const apy = parseFloat(scenario.apy);
    const duration = parseFloat(scenario.duration);

    if (scenario.type === 'lend') {
      const periodReturn = ((amount * apy) / 100 * duration) / 365;
      setResult({
        type: 'lend',
        gain: periodReturn.toFixed(2),
        total: (amount + periodReturn).toFixed(2),
        message: `Invertir $${amount} al ${apy}% APY por ${duration} días generaría $${periodReturn.toFixed(2)} USD.`
      });
    } else {
      const collateralValue = 3000;
      const ltv = (amount / collateralValue) * 100;
      setResult({
        type: 'borrow',
        ltv: ltv.toFixed(1),
        level: riskFromLtv(ltv),
        monthlyPayment: (amount * (apy / 100) / 12).toFixed(2),
        message: `Solicitar $${amount} con 1 ETH de colateral ($${collateralValue}) da un LTV de ${ltv.toFixed(1)}%.`
      });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Simulador DeFi</h1>
        <p>Simula escenarios de inversión o préstamo sin riesgo</p>
      </div>

      <div className="grid-2">
        <div className="glass">
          <h3 style={{ marginBottom: 22 }}>Configurar escenario</h3>

          <div className="field">
            <label>Tipo de simulación</label>
            <div className="tabs" style={{ marginBottom: 0 }}>
              <button className={`tab ${scenario.type === 'lend' ? 'active' : ''}`} onClick={() => setScenario({ ...scenario, type: 'lend' })}>Prestar (Lend)</button>
              <button className={`tab ${scenario.type === 'borrow' ? 'active' : ''}`} onClick={() => setScenario({ ...scenario, type: 'borrow' })}>Pedir (Borrow)</button>
            </div>
          </div>

          <div className="field">
            <label>Monto (USD)</label>
            <input type="number" value={scenario.amount} onChange={update('amount')} />
          </div>
          <div className="field">
            <label>{scenario.type === 'lend' ? 'Tasa (APY %)' : 'Tasa de interés %'}</label>
            <input type="number" step="0.5" value={scenario.apy} onChange={update('apy')} />
          </div>
          <div className="field">
            <label>Plazo (días)</label>
            <input type="number" value={scenario.duration} onChange={update('duration')} />
          </div>

          <button className="btn-block" onClick={runSimulation}>Simular escenario</button>
        </div>

        <div className="glass-soft">
          <h3 style={{ marginBottom: 20 }}>Resultado</h3>
          {result ? (
            <div>
              <p className="text-muted" style={{ fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>{result.message}</p>

              {result.type === 'lend' ? (
                <>
                  <p className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Ganancia estimada</p>
                  <div className="metric-value metric-success">+${result.gain}</div>
                  <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Total al final: ${result.total} USD</p>
                </>
              ) : (
                <>
                  <div className="stat-row"><span className="label">LTV (Loan-to-Value)</span><RiskBadge level={result.level} showLtv={result.ltv} /></div>
                  <div className="stat-row"><span className="label">Pago mensual estimado</span><span className="value">${result.monthlyPayment}</span></div>
                  {(result.level === 'high' || result.level === 'critical') && (
                    <div className="alert alert-error mt-24" style={{ marginBottom: 0 }}>
                      ⚠️ LTV elevado. Si el colateral baja de precio, podrías ser liquidado.
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="text-dim" style={{ fontSize: 14 }}>Configura un escenario y pulsa «Simular escenario».</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Simulator;
