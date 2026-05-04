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
    // Simular envío de ticket
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
      <h1>🎫 Soporte al Usuario</h1>
      <p style={{ marginBottom: '20px', color: '#94a3b8' }}>
        ¿Problemas o dudas? Envíanos un ticket y te atenderemos
      </p>

      <div className="grid-2">
        <div className="card">
          <h3>📝 Crear Ticket de Soporte</h3>
          
          {submitted ? (
            <div style={{ 
              marginTop: '20px', 
              padding: '20px', 
              background: '#10b98120', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h2>✅ Ticket Creado</h2>
              <p style={{ fontSize: '24px', marginTop: '10px' }}>{ticketNumber}</p>
              <p style={{ marginTop: '10px' }}>Nuestro equipo te responderá en 24-48 horas.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Asunto</label>
                <input
                  type="text"
                  value={ticket.subject}
                  onChange={(e) => setTicket({...ticket, subject: e.target.value})}
                  placeholder="Ej: Problema con conexión de wallet"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Descripción del problema</label>
                <textarea
                  rows="5"
                  value={ticket.description}
                  onChange={(e) => setTicket({...ticket, description: e.target.value})}
                  placeholder="Describe detalladamente tu problema..."
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#334155', border: 'none', color: 'white' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Prioridad</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => setTicket({...ticket, priority: e.target.value})}
                  style={{ width: '100%' }}
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

        <div className="card">
          <h3>❓ Preguntas Frecuentes</h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <h4>¿Cómo conecto mi wallet?</h4>
              <p style={{ fontSize: '14px', marginTop: '5px', color: '#94a3b8' }}>
                Haz clic en "Conectar Wallet" en la esquina superior derecha. Esto simulará la conexión a MetaMask para pruebas.
              </p>
            </div>
            <hr style={{ borderColor: '#334155', margin: '10px 0' }} />
            <div style={{ marginBottom: '15px' }}>
              <h4>¿Qué es el LTV?</h4>
              <p style={{ fontSize: '14px', marginTop: '5px', color: '#94a3b8' }}>
                Loan-to-Value: ratio entre tu préstamo y tu colateral. Si supera el 80%, recibirás alertas de riesgo.
              </p>
            </div>
            <hr style={{ borderColor: '#334155', margin: '10px 0' }} />
            <div style={{ marginBottom: '15px' }}>
              <h4>¿Esto usa dinero real?</h4>
              <p style={{ fontSize: '14px', marginTop: '5px', color: '#94a3b8' }}>
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