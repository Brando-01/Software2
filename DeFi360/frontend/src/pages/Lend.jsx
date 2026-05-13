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
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Ofrecer Fondos</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Pon a trabajar tus criptomonedas y genera rendimientos</p>
      </div>

      <div className="grid-2">
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid #e4e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px', color: '#111827' }}>Nueva Oferta de Préstamo</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Monto a prestar (USD)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="Ej: 1000"
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Tasa de Interés (APY %)</label>
              <input
                type="number"
                step="0.1"
                value={formData.apy}
                onChange={(e) => setFormData({...formData, apy: e.target.value})}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Plazo (días)</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
              >
                <option value={30}>30 días</option>
                <option value={60}>60 días</option>
                <option value={90}>90 días</option>
                <option value={180}>180 días</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={calculateProjection} style={{ flex: 1, background: '#6b7280' }}>
                Calcular Proyección
              </button>
              <button type="submit" style={{ flex: 1 }}>Publicar Oferta</button>
            </div>
          </form>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '28px', border: '1px solid #e4e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>Proyección de Rendimiento</h3>
          {projectedReturn ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Inversión:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>${projectedReturn.amount.toLocaleString()} USD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>APY:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{projectedReturn.apy}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Plazo:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{projectedReturn.duration} días</span>
                </div>
              </div>
              <div style={{ 
                padding: '16px', 
                background: '#ecfdf5', 
                borderRadius: '12px',
                border: '1px solid #a7f3d0'
              }}>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Ganancia estimada</p>
                <h2 style={{ fontSize: '28px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>+${projectedReturn.return} USD</h2>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>Total a recibir: ${projectedReturn.total} USD</p>
              </div>
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '20px' }}>
              Completa el formulario y haz clic en "Calcular Proyección" para ver tu rendimiento.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Lend;