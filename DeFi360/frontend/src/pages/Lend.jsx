import { useState } from 'react';

function Lend() {
  const [formData, setFormData] = useState({
    amount: '',
    apy: 5.2,
    duration: 30
  });

  const [projectedReturn, setProjectedReturn] = useState(null);

  const calculateProjection = () => {
    const amount = parseFloat(formData.amount);
    const apy = parseFloat(formData.apy);
    const duration = parseFloat(formData.duration);
    
    if (amount && apy && duration) {
      const annualReturn = (amount * apy) / 100;
      const returnForPeriod = (annualReturn * duration) / 365;
      setProjectedReturn({
        amount: amount,
        return: returnForPeriod.toFixed(2),
        total: (amount + returnForPeriod).toFixed(2),
        apy: apy,
        duration: duration
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('✅ Oferta de préstamo publicada en el Marketplace');
  };

  return (
    <div>
      <h1>Ofrecer Fondos (Lend)</h1>
      <p style={{ marginBottom: '20px', color: '#94a3b8' }}>
        Pon a trabajar tus criptomonedas y genera rendimientos
      </p>

      <div className="grid-2">
        <div className="card">
          <h3>💰 Nueva Oferta de Préstamo</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Monto a prestar (USD)</label>
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
              <label style={{ display: 'block', marginBottom: '8px' }}>Tasa de Interés (APY %)</label>
              <input
                type="number"
                step="0.1"
                value={formData.apy}
                onChange={(e) => setFormData({...formData, apy: e.target.value})}
                style={{ width: '100%' }}
              />
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

            <button type="button" onClick={calculateProjection} style={{ marginRight: '10px' }}>
              Calcular Proyección
            </button>
            <button type="submit">Publicar Oferta</button>
          </form>
        </div>

        <div className="card">
          <h3>📈 Proyección de Rendimiento</h3>
          {projectedReturn && (
            <div style={{ marginTop: '20px' }}>
              <p><strong>Inversión:</strong> ${projectedReturn.amount.toLocaleString()} USD</p>
              <p><strong>APY:</strong> {projectedReturn.apy}%</p>
              <p><strong>Plazo:</strong> {projectedReturn.duration} días</p>
              <hr style={{ margin: '15px 0', borderColor: '#334155' }} />
              <p><strong>Ganancia estimada:</strong></p>
              <h2 style={{ fontSize: '28px', color: '#10b981' }}>+${projectedReturn.return} USD</h2>
              <p><strong>Total a recibir:</strong> ${projectedReturn.total} USD</p>
            </div>
          )}
          {!projectedReturn && (
            <p style={{ marginTop: '20px', color: '#94a3b8' }}>
              Completa el formulario y haz clic en "Calcular Proyección" para ver tu rendimiento.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Lend;