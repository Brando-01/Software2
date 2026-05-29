import { useState, useEffect } from 'react';
import { marketplaceService } from '../services/api';

function Lend() {
  const [formData, setFormData] = useState({
    amount: '',
    apy: 5.2,
    duration: 30
  });
  const [projectedReturn, setProjectedReturn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    // Obtener balance de localStorage
    const balance = localStorage.getItem('walletBalance');
    setWalletBalance(balance ? parseFloat(balance) : 0);
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    const amount = parseFloat(formData.amount);
    
    // Validar que el monto sea válido
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Ingresa un monto válido' });
      return;
    }
    
    // Validar que haya saldo suficiente
    if (amount > walletBalance) {
      setMessage({ 
        type: 'error', 
        text: `Saldo insuficiente. Tienes $${walletBalance.toFixed(2)} USD disponibles`,
        details: {
          requested: amount,
          available: walletBalance,
          deficit: (amount - walletBalance).toFixed(2)
        }
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await marketplaceService.createOffer({
        type: 'lend',
        amount: amount,
        apy: parseFloat(formData.apy),
        duration: parseInt(formData.duration),
        collateralType: 'USDC',
        collateralAmount: null
      });
      
      setMessage({ type: 'success', text: '✅ Oferta de préstamo publicada en el Marketplace' });
      setFormData({ amount: '', apy: 5.2, duration: 30 });
      setProjectedReturn(null);
      
      // Actualizar balance
      const newBalance = walletBalance - amount;
      setWalletBalance(newBalance);
      localStorage.setItem('walletBalance', newBalance.toString());
    } catch (error) {
      console.error('Error al crear oferta:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear oferta';
      const details = error.response?.data?.details;
      setMessage({ 
        type: 'error', 
        text: errorMessage,
        details: details
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Ofrecer Fondos</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Pon a trabajar tus criptomonedas y genera rendimientos</p>
      </div>

      {message && (
        <div style={{ 
          padding: '12px 16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: message.type === 'success' ? '#059669' : '#dc2626'
        }}>
          <div>{message.text}</div>
          {message.details && (
            <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
              {Object.entries(message.details).map(([key, value]) => (
                <div key={key}>{key}: {typeof value === 'object' ? JSON.stringify(value) : value}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid-2">
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid #e4e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Nueva Oferta de Préstamo</h3>
            <div style={{ background: '#ecfdf5', padding: '8px 12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '11px', color: '#059669' }}>Balance disponible</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>${walletBalance.toFixed(2)}</div>
            </div>
          </div>
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
                required
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
              <button type="submit" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Publicando...' : 'Publicar Oferta'}
              </button>
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