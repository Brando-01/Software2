import { useState } from 'react';
import { supportService } from '../services/api';

const FAQS = [
  { q: '¿Cómo conecto mi wallet?', a: 'Pulsa «Conectar Billetera» en la pantalla de inicio. Se simula la conexión a MockWallet para fines educativos.' },
  { q: '¿Qué es el LTV?', a: 'Loan-to-Value: el ratio entre tu préstamo y tu colateral. Por encima de 90% recibirás alertas de riesgo de liquidación.' },
  { q: '¿Esto usa dinero real?', a: 'No. DeFi360 es un simulador educativo; no se manejan fondos ni criptomonedas reales.' }
];

function Support() {
  const [ticket, setTicket] = useState({ subject: '', description: '', priority: 'medium' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setTicket({ ...ticket, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const response = await supportService.createTicket(ticket);
      setResult(response.ticketNumber);
      setTicket({ subject: '', description: '', priority: 'medium' });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Soporte al Usuario</h1>
        <p>¿Dudas o problemas? Envíanos un ticket y te atenderemos</p>
      </div>

      <div className="grid-2">
        <div className="glass">
          <h3 style={{ marginBottom: 22 }}>Crear ticket de soporte</h3>

          {error && <div className="alert alert-error">{error}</div>}

          {result ? (
            <div className="alert alert-success" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <h3 style={{ marginBottom: 6 }}>Ticket creado</h3>
              <p className="metric-value metric-success" style={{ fontSize: 22 }}>{result}</p>
              <p className="text-muted" style={{ fontSize: 13, marginTop: 8 }}>Nuestro equipo te responderá en 24–48 horas.</p>
              <button className="btn-ghost mt-24" onClick={() => setResult(null)}>Crear otro ticket</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Asunto</label>
                <input type="text" value={ticket.subject} onChange={update('subject')} placeholder="Ej: Problema con conexión de wallet" required />
              </div>
              <div className="field">
                <label>Descripción del problema</label>
                <textarea rows="4" value={ticket.description} onChange={update('description')} placeholder="Describe detalladamente tu problema…" style={{ resize: 'vertical' }} required />
              </div>
              <div className="field">
                <label>Prioridad</label>
                <select value={ticket.priority} onChange={update('priority')}>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
              <button type="submit" className="btn-block" disabled={loading}>{loading ? 'Enviando…' : 'Enviar ticket'}</button>
            </form>
          )}
        </div>

        <div className="glass-soft">
          <h3 style={{ marginBottom: 22 }}>Preguntas frecuentes</h3>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: i < FAQS.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <h4 style={{ color: '#93c5fd', marginBottom: 6 }}>{faq.q}</h4>
              <p className="text-muted" style={{ fontSize: 13 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Support;
