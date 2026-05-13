import { useState } from 'react';

function Support() {
  const [ticket, setTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newTicketNumber = 'TKT-' + Math.floor(Math.random() * 10000);
    setTicketNumber(newTicketNumber);
    setSubmitted(true);
    
    setTimeout(() => {
      setSubmitted(false);
      setTicket({ subject: '', description: '', priority: 'medium' });
    }, 5000);
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Soporte al Usuario</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>¿Problemas o dudas? Envíanos un ticket y te atenderemos</p>
      </div>

      <div className="grid-2">
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid #e4e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px', color: '#111827' }}>Crear Ticket de Soporte</h3>
          
          {submitted ? (
            <div style={{ 
              padding: '24px', 
              background: '#ecfdf5', 
              borderRadius: '12px',
              border: '1px solid #a7f3d0',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#059669', marginBottom: '8px' }}>Ticket Creado</h3>
              <p style={{ fontSize: '20px', fontWeight: '600', color: '#059669', marginBottom: '8px' }}>{ticketNumber}</p>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>Nuestro equipo te responderá en 24-48 horas.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Asunto</label>
                <input
                  type="text"
                  value={ticket.subject}
                  onChange={(e) => setTicket({...ticket, subject: e.target.value})}
                  placeholder="Ej: Problema con conexión de wallet"
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Descripción del problema</label>
                <textarea
                  rows="4"
                  value={ticket.description}
                  onChange={(e) => setTicket({...ticket, description: e.target.value})}
                  placeholder="Describe detalladamente tu problema..."
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Prioridad</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => setTicket({...ticket, priority: e.target.value})}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>

              <button type="submit" style={{ width: '100%' }}>
                Enviar Ticket
              </button>
            </form>
          )}
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '28px', border: '1px solid #e4e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px', color: '#111827' }}>Preguntas Frecuentes</h3>
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '6px' }}>¿Cómo conecto mi wallet?</h4>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                Haz clic en "Conectar Wallet" en la esquina superior derecha. Esto simulará la conexión a MetaMask para pruebas.
              </p>
            </div>
            <div style={{ marginBottom: '20px', paddingTop: '16px', borderTop: '1px solid #e4e7eb' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '6px' }}>¿Qué es el LTV?</h4>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                Loan-to-Value: ratio entre tu préstamo y tu colateral. Si supera el 80%, recibirás alertas de riesgo.
              </p>
            </div>
            <div style={{ paddingTop: '16px', borderTop: '1px solid #e4e7eb' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '6px' }}>¿Esto usa dinero real?</h4>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                No. DeFi360 es un simulador educativo. No se manejan fondos ni criptomonedas reales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Support;