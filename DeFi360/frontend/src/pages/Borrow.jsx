import { useState } from 'react';
import { loanService } from '../services/api';
import RiskBadge from '../components/RiskBadge';

const COLLATERAL_PRICES = { ETH: 3000, BTC: 60000, USDC: 1 };

function Borrow() {
  const [formData, setFormData] = useState({ amount: '', collateral: 'ETH', collateralAmount: '', duration: 30 });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const update = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const calculateLTV = async () => {
    const amount = parseFloat(formData.amount);
    const collateralAmount = parseFloat(formData.collateralAmount);
    if (!amount || !collateralAmount) return;

    try {
      setLoading(true);
      const result = await loanService.calculateLTV({
        loanAmount: amount,
        collateralAmount,
        collateralType: formData.collateral
      });
      setAnalysis(result);
    } catch (error) {
      console.error('Error al calcular LTV:', error);
      setMessage({ type: 'error', text: 'Error al calcular LTV' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const amount = parseFloat(formData.amount);
    const collateralAmount = parseFloat(formData.collateralAmount);

    if (!amount || amount <= 0) return setMessage({ type: 'error', text: 'Ingresa un monto válido' });
    if (!collateralAmount || collateralAmount <= 0) return setMessage({ type: 'error', text: 'Ingresa una cantidad de colateral válida' });

    const collateralValue = collateralAmount * COLLATERAL_PRICES[formData.collateral];
    if (collateralValue < amount) {
      const required = (amount / COLLATERAL_PRICES[formData.collateral]).toFixed(4);
      return setMessage({
        type: 'error',
        text: `Colateral insuficiente. Necesitas al menos ${required} ${formData.collateral}.`
      });
    }

    try {
      setLoading(true);
      const response = await loanService.requestLoan({
        amount,
        duration: parseInt(formData.duration, 10),
        collateralType: formData.collateral,
        collateralAmount
      });
      setMessage({ type: 'success', text: response.message });
      setFormData({ amount: '', collateral: 'ETH', collateralAmount: '', duration: 30 });
      setAnalysis(null);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al solicitar préstamo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Solicitar Préstamo</h1>
        <p>Ofrece colateral y obtén financiamiento en criptomonedas</p>
      </div>

      {message && <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>{message.text}</div>}

      <div className="grid-2">
        <div className="glass">
          <h3 style={{ marginBottom: 22 }}>Formulario de solicitud</h3>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Monto a solicitar (USD)</label>
              <input type="number" value={formData.amount} onChange={update('amount')} placeholder="Ej: 1000" required />
            </div>

            <div className="field">
              <label>Tipo de colateral</label>
              <select value={formData.collateral} onChange={update('collateral')}>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="USDC">USD Coin (USDC)</option>
              </select>
            </div>

            <div className="field">
              <label>Cantidad de colateral</label>
              <input type="number" step="0.01" value={formData.collateralAmount} onChange={update('collateralAmount')} placeholder="Ej: 0.5" required />
              <p className="text-dim" style={{ fontSize: 11, marginTop: 6 }}>
                1 {formData.collateral} ≈ ${COLLATERAL_PRICES[formData.collateral].toLocaleString()} USD
              </p>
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
              <button type="button" className="btn-ghost" onClick={calculateLTV} disabled={loading}>
                {loading ? 'Calculando…' : 'Calcular LTV'}
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        </div>

        <div className="glass-soft">
          <h3 style={{ marginBottom: 20 }}>Análisis de riesgo</h3>
          {analysis ? (
            <div>
              <p className="text-muted" style={{ fontSize: 13, marginBottom: 6 }}>Loan-to-Value (LTV)</p>
              <div className="metric-value metric-accent" style={{ fontSize: 44, marginBottom: 16 }}>{analysis.ltv}%</div>

              <div className="flex-between" style={{ marginBottom: 18 }}>
                <span className="text-muted" style={{ fontSize: 13 }}>Nivel de riesgo</span>
                <RiskBadge level={analysis.riskLevel} />
              </div>

              {!analysis.isHealthy && (
                <div className="alert alert-error" style={{ marginBottom: 0 }}>
                  ⚠️ {analysis.message}. Si el colateral baja de precio, podrías ser liquidado.
                </div>
              )}
            </div>
          ) : (
            <p className="text-dim" style={{ fontSize: 14 }}>
              Completa el formulario y pulsa «Calcular LTV» para ver el análisis de riesgo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Borrow;
