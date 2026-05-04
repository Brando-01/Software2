import { useState } from 'react';

function Borrow() {
  const [formData, setFormData] = useState({
    amount: '',
    collateral: 'ETH',
    collateralAmount: '',
    duration: 30
  });
  const [ltv, setLtv] = useState(null);
  const [risk, setRisk] = useState(null);

  const calculateLTV = () => {
    const amount = parseFloat(formData.amount);
    const collateralAmount = parseFloat(formData.collateralAmount);
    
    if (amount && collateralAmount) {
      // Simulación: 1 ETH = $3000 USD
      const collateralValue = collateralAmount * 3000;
      const calculatedLTV = (amount / collateralValue) * 100;
      setLtv(calculatedLTV.toFixed(1));
      
      if (calculatedLTV > 80) {
        setRisk('Alto Riesgo ⚠️');
      } else if (calculatedLTV > 60) {
        setRisk('Riesgo Moderado ⚡');
      } else {
        setRisk('Bajo Riesgo ✅');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('✅ Solicitud de préstamo simulada enviada. Revisa el Marketplace para confirmación.');
  };

  return (
    <div>
      <h1>Solicitar Préstamo (Borrow)</h1>
      <p style={{ marginBottom: '20px', color: '#94a3b8' }}>
        Ofrece colateral y obtén un préstamo en criptomonedas
      </p>

      <div className="grid-2">
        <div className="card">
          <h3>📝 Formulario de Solicitud</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Monto a solicitar (USD)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="Ej: 1000"
                required
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Tipo de Colateral</label>
              <select
                value={formData.collateral}
                onChange={(e) => setFormData({...formData, collateral: e.target.value})}
                style={{ width: '100%' }}
              >
                <option value="ETH">Ethereum (ETH)</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="USDC">USD Coin (USDC)</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Cantidad de Colateral</label>
              <input
                type="number"
                value={formData.collateralAmount}
                onChange={(e) => setFormData({...formData, collateralAmount: e.target.value})}
                placeholder="Ej: 0.5"
                required
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: '12px', marginTop: '5px', color: '#94a3b8' }}>
                1 {formData.collateral} ≈ $3,000 USD (simulado)
              </p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Plazo (días)</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                style={{ width: '100%' }}
              >
                <option value={30}>30 días</option>
                <option value={60}>60 días</option>
                <option value={90}>90 días</option>
                <option value={180}>180 días</option>
              </select>
            </div>

            <button type="button" onClick={calculateLTV} style={{ marginRight: '10px' }}>
              Calcular LTV
            </button>
            <button type="submit">Enviar Solicitud</button>
          </form>
        </div>

        <div className="card">
          <h3>📊 Análisis de Riesgo</h3>
          {ltv && (
            <div style={{ marginTop: '20px' }}>
              <p><strong>Loan-to-Value (LTV):</strong></p>
              <h2 style={{ fontSize: '36px', color: '#3b82f6' }}>{ltv}%</h2>
              <p style={{ marginTop: '15px' }}>
                <strong>Nivel de Riesgo:</strong> <span style={{ 
                  color: risk?.includes('Bajo') ? '#10b981' : risk?.includes('Moderado') ? '#f59e0b' : '#ef4444'
                }}>{risk}</span>
              </p>
              {parseFloat(ltv) > 80 && (
                <p style={{ marginTop: '15px', padding: '10px', background: '#ef4444', borderRadius: '8px', color: 'white' }}>
                  ⚠️ Alerta: LTV alto. Podrías ser liquidado si el colateral baja de precio.
                </p>
              )}
            </div>
          )}
          {!ltv && (
            <p style={{ marginTop: '20px', color: '#94a3b8' }}>
              Completa el formulario y haz clic en "Calcular LTV" para ver el análisis de riesgo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Borrow;