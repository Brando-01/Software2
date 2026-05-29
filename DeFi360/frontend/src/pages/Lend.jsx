import { useState, useEffect } from 'react';
import { marketplaceService } from '../services/api';

function Lend() {
  const [formData, setFormData] = useState({ amount: '', apy: 5.2, duration: 30 });
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const balance = localStorage.getItem('walletBalance');
    setWalletBalance(balance ? parseFloat(balance) : 0);
  }, []);

  const update = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const calculateProjection = () => {
    const amount = parseFloat(formData.amount);
    const apy = parseFloat(formData.apy);
    const duration = parseFloat(formData.duration);
    if (!amount || !apy || !duration) return;

    const annualReturn = (amount * apy) / 100;
    const periodReturn = (annualReturn * duration) / 365;
    setProjection({
      amount,
      apy,
      duration,
      gain: periodReturn.toFixed(2),
      total: (amount + periodReturn).toFixed(2)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) return setMessage({ type: 'error', text: 'Ingresa un monto válido' });
    if (amount > walletBalance) {
      return setMessage({ type: 'error', text: `Saldo insuficiente. Tienes $${walletBalance.toFixed(2)} disponibles.` });
    }

    try {
      setLoading(true);
      await marketplaceService.createOffer({
        type: 'lend',
        amount,
        apy: parseFloat(formData.apy),
        duration: parseInt(formData.duration, 10),
        collateralType: 'USDC',
        collateralAmount: null
      });
      setMessage({ type: 'success', text: 'Oferta de préstamo publicada en el Marketplace' });
      setFormData({ amount: '', apy: 5.2, duration: 30 });
      setProjection(null);

      const newBalance = walletBalance - amount;
      setWalletBalance(newBalance);
      localStorage.setItem('walletBalance', newBalance.toString());
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al crear oferta' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Ofrecer Fondos</h1>
        <p>Pon a trabajar tus criptomonedas y genera rendimientos</p>
      </div>

      {message && <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>{message.text}</div>}

      <div className="grid-2">
        <div className="glass">
          <div className="flex-between" style={{ marginBottom: 22 }}>
            <h3>Nueva oferta</h3>
            <span className="badge risk-low">Disponible ${walletBalance.toFixed(2)}</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Monto a prestar (USD)</label>
              <input type="number" value={formData.amount} onChange={update('amount')} placeholder="Ej: 1000" required />
            </div>
            <div className="field">
              <label>Tasa de interés (APY %)</label>
              <input type="number" step="0.1" value={formData.apy} onChange={update('apy')} required />
            </div>
            <div className="field">
              <label>Plazo (días)</label>
              <select value={formData.duration} onChange={update('duration')}>
                <option value={30}>30 días</option>
                <option value={60}>60 días</option>
                <option value={90}>90 días</option>
                <option value={180}>180 días</option>
              </select>
            </div>
            <div className="actions">
              <button type="button" className="btn-ghost" onClick={calculateProjection}>Calcular proyección</button>
              <button type="submit" disabled={loading}>{loading ? 'Publicando…' : 'Publicar oferta'}</button>
            </div>
          </form>
        </div>

        <div className="glass-soft">
          <h3 style={{ marginBottom: 20 }}>Proyección de rendimiento</h3>
          {projection ? (
            <div>
              <div className="stat-row"><span className="label">Inversión</span><span className="value">${projection.amount.toLocaleString()}</span></div>
              <div className="stat-row"><span className="label">APY</span><span className="value">{projection.apy}%</span></div>
              <div className="stat-row"><span className="label">Plazo</span><span className="value">{projection.duration} días</span></div>
              <div className="divider" />
              <p className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Ganancia estimada</p>
              <div className="metric-value metric-success">+${projection.gain}</div>
              <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Total a recibir: ${projection.total} USD</p>
            </div>
          ) : (
            <p className="text-dim" style={{ fontSize: 14 }}>Completa el formulario y pulsa «Calcular proyección».</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Lend;
