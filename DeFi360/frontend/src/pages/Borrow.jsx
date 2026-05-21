import { useState } from 'react';
import { loanService } from '../services/api';

function Borrow() {
  const [formData, setFormData] = useState({
    amount: '',
    collateral: 'ETH',
    collateralAmount: '',
    duration: 30
  });
  const [ltv, setLtv] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const collateralValues = { ETH: 3000, BTC: 30000, USDC: 1 };

  const calculateLTV = async () => {
    const amount = parseFloat(formData.amount);
    const collateralAmount = parseFloat(formData.collateralAmount);
    
    if (amount && collateralAmount) {
      try {
        setLoading(true);
        const result = await loanService.calculateLTV({
          loanAmount: amount,
          collateralAmount: collateralAmount,
          collateralType: formData.collateral
        });
        
        setLtv(result.ltv);
        setRisk(result.riskLevel);
      } catch (error) {
        console.error('Error al calcular LTV:', error);
        setMessage({ type: 'error', text: 'Error al calcular LTV' });
      } finally {
        setLoading(false);
      }
    }
  };

  const getRiskColor = () => {
    if (risk === 'critical') return '#dc2626';
    if (risk === 'high') return '#f59e0b';
    if (risk === 'medium') return '#f97316';
    return '#10b981';
  };

  const getRiskText = () => {
    if (risk === 'critical') return 'Riesgo Crítico';
    if (risk === 'high') return 'Alto Riesgo';
    if (risk === 'medium') return 'Riesgo Moderado';
    return 'Bajo Riesgo';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    
    try {
      const response = await loanService.requestLoan({
        amount: parseFloat(formData.amount),
        duration: parseInt(formData.duration),
        collateralType: formData.collateral,
        collateralAmount: parseFloat(formData.collateralAmount)
      });
      
      setMessage({ type: 'success', text: response.message });
      setFormData({ amount: '', collateral: 'ETH', collateralAmount: '', duration: 30 });
      setLtv(null);
      setRisk(null);
    } catch (error) {
      console.error('Error al solicitar préstamo:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al solicitar préstamo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Solicitar Préstamo</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Ofrece colateral y obtén financiamiento en criptomonedas</p>
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
          {message.text}
        </div>
      )}

      <div className="grid-2">
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid #e4e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px', color: '#111827' }}>Formulario de Solicitud</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Monto a solicitar (USD)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="Ej: 1000"
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Tipo de Colateral</label>
              <select
                value={formData.collateral}
                onChange={(e) => setFormData({...formData, collateral: e.target.value})}
              >
                <option value="ETH">Ethereum (ETH)</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="USDC">USD Coin (USDC)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Cantidad de Colateral</label>
              <input
                type="number"
                step="0.01"
                value={formData.collateralAmount}
                onChange={(e) => setFormData({...formData, collateralAmount: e.target.value})}
                placeholder="Ej: 0.5"
                required
              />
              <p style={{ fontSize: '11px', marginTop: '6px', color: '#9ca3af' }}>
                1 {formData.collateral} ≈ ${collateralValues[formData.collateral].toLocaleString()} USD
              </p>
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
              <button type="button" onClick={calculateLTV} style={{ flex: 1, background: '#6b7280' }} disabled={loading}>
                {loading ? 'Calculando...' : 'Calcular LTV'}
              </button>
              <button type="submit" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '28px', border: '1px solid #e4e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>Análisis de Riesgo</h3>
          {ltv ? (
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Loan-to-Value (LTV)</p>
              <h2 style={{ fontSize: '42px', fontWeight: '600', color: '#1e40af', marginBottom: '16px' }}>{ltv}%</h2>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Nivel de Riesgo</p>
                <span style={{ 
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  background: risk === 'critical' || risk === 'high' ? '#fef2f2' : risk === 'medium' ? '#fffbeb' : '#ecfdf5',
                  color: getRiskColor()
                }}>
                  {getRiskText()}
                </span>
              </div>
              {(risk === 'critical' || parseFloat(ltv) > 80) && (
                <div style={{ 
                  padding: '14px', 
                  background: '#fef2f2', 
                  borderRadius: '10px',
                  border: '1px solid #fecaca'
                }}>
                  <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: 0 }}>
                    ⚠️ Alerta: LTV alto. Si el colateral baja de precio, podrías ser liquidado.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '20px' }}>
              Completa el formulario y haz clic en "Calcular LTV" para ver el análisis de riesgo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Borrow;