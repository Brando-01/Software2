import { useState } from 'react';

const TOPICS = [
  { id: 1, title: '¿Qué es DeFi?', level: 'Principiante', content: 'DeFi (Finanzas Descentralizadas) es un ecosistema de aplicaciones financieras sobre blockchain que operan sin intermediarios centralizados como bancos.' },
  { id: 2, title: '¿Qué es el LTV (Loan-to-Value)?', level: 'Intermedio', content: 'El LTV es el ratio entre el monto del préstamo y el valor del colateral. Si pides $1000 con $2000 de colateral, tu LTV es 50%. Por encima de 90% entras en zona de liquidación.' },
  { id: 3, title: '¿Qué es el APY?', level: 'Principiante', content: 'APY (Annual Percentage Yield) es el rendimiento anual que obtienes por prestar tus fondos, incluyendo el interés compuesto.' },
  { id: 4, title: 'Riesgos en DeFi', level: 'Avanzado', content: 'Los principales riesgos incluyen: liquidación por caída del colateral, errores en contratos inteligentes, volatilidad de precios y fallos de oráculos.' },
  { id: 5, title: 'Glosario DeFi', level: 'Todos', content: '• Colateral: garantía que bloqueas para obtener un préstamo.\n• Liquidación: venta forzada del colateral cuando el LTV es demasiado alto.\n• Oráculo: fuente de precios externa.\n• Liquidity Pool: conjunto de fondos para préstamos.' }
];

function Education() {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <div className="page-header">
        <h1>Zona Educativa</h1>
        <p>Aprende sobre Finanzas Descentralizadas sin riesgo</p>
      </div>

      <div className="grid-2">
        <div className="glass">
          <h3 style={{ marginBottom: 18 }}>Guías y temas</h3>
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              className="btn-ghost"
              onClick={() => setSelected(topic)}
              style={{
                width: '100%',
                textAlign: 'left',
                marginBottom: 10,
                borderColor: selected?.id === topic.id ? 'var(--accent)' : 'var(--border)'
              }}
            >
              <span style={{ display: 'block', marginBottom: 6 }}>{topic.title}</span>
              <span className="badge badge-accent">{topic.level}</span>
            </button>
          ))}
        </div>

        <div className="glass-soft">
          <h3 style={{ marginBottom: 20 }}>Contenido</h3>
          {selected ? (
            <div>
              <h2 className="metric-accent" style={{ fontSize: 18, marginBottom: 16 }}>{selected.title}</h2>
              <p className="text-muted" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.content}</p>
              <button className="btn-ghost mt-24" onClick={() => setSelected(null)}>← Volver a la lista</button>
            </div>
          ) : (
            <p className="text-dim" style={{ fontSize: 14 }}>Selecciona un tema de la izquierda para comenzar.</p>
          )}
        </div>
      </div>

      <div className="glass mt-24">
        <h3 style={{ marginBottom: 12 }}>Ejemplo rápido de LTV</h3>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 14 }}>
          Pides $5,000 USD con 2 ETH de colateral (1 ETH = $3,000):
        </p>
        <div className="stat-row"><span className="label">Valor del colateral</span><span className="value">2 × $3,000 = $6,000</span></div>
        <div className="stat-row"><span className="label">LTV</span><span className="value">($5,000 / $6,000) × 100 = 83.33%</span></div>
        <div className="alert alert-error mt-24" style={{ marginBottom: 0 }}>
          ⚠️ Si ETH baja a $2,500, tu LTV subiría a 100% y serías liquidado.
        </div>
      </div>
    </div>
  );
}

export default Education;
