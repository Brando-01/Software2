import { useState } from 'react';

function Education() {
  const [selectedTopic, setSelectedTopic] = useState(null);

  const topics = [
    {
      id: 1,
      title: '¿Qué es DeFi?',
      content: 'DeFi (Finanzas Descentralizadas) es un ecosistema de aplicaciones financieras construidas sobre blockchain que operan sin intermediarios centralizados como bancos.',
      level: 'Principiante'
    },
    {
      id: 2,
      title: '¿Qué es LTV (Loan-to-Value)?',
      content: 'El LTV es el ratio entre el monto del préstamo y el valor del colateral. Por ejemplo, si pides $1000 con $2000 de colateral, tu LTV es 50%. Si supera el 80%, puedes ser liquidado.',
      level: 'Intermedio'
    },
    {
      id: 3,
      title: '¿Qué es APY?',
      content: 'APY (Annual Percentage Yield) es el rendimiento anual que obtienes por prestar tus fondos. Incluye el interés compuesto.',
      level: 'Principiante'
    },
    {
      id: 4,
      title: 'Riesgos en DeFi',
      content: 'Los principales riesgos incluyen: liquidación por caída del colateral, errores en contratos inteligentes, volatilidad de precios y riesgos de oráculos.',
      level: 'Avanzado'
    },
    {
      id: 5,
      title: 'Glosario DeFi',
      content: '• Colateral: Garantía que bloqueas para obtener un préstamo\n• Liquidación: Venta forzada de colateral cuando el LTV es muy alto\n• Oráculo: Fuente de precios externa\n• Liquidity Pool: Conjunto de fondos para préstamos',
      level: 'Todos'
    }
  ];

  return (
    <div>
      <h1>📚 Zona Educativa</h1>
      <p style={{ marginBottom: '20px', color: '#94a3b8' }}>
        Aprende sobre Finanzas Descentralizadas sin riesgo
      </p>

      <div className="grid-2">
        <div className="card">
          <h3>📖 Guías y Temas</h3>
          <div style={{ marginTop: '20px' }}>
            {topics.map(topic => (
              <div
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                style={{
                  padding: '12px',
                  marginBottom: '10px',
                  background: selectedTopic?.id === topic.id ? '#3b82f6' : '#1e293b',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <h4>{topic.title}</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>
                  Nivel: {topic.level}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>📄 Contenido Educativo</h3>
          {selectedTopic ? (
            <div style={{ marginTop: '20px' }}>
              <h2 style={{ marginBottom: '15px', color: '#3b82f6' }}>{selectedTopic.title}</h2>
              <div style={{ 
                background: '#1e293b', 
                padding: '20px', 
                borderRadius: '8px',
                whiteSpace: 'pre-wrap'
              }}>
                <p style={{ lineHeight: '1.6' }}>{selectedTopic.content}</p>
              </div>
              <button 
                onClick={() => setSelectedTopic(null)}
                style={{ marginTop: '20px', background: '#334155' }}
              >
                ← Volver a la lista
              </button>
            </div>
          ) : (
            <p style={{ marginTop: '20px', color: '#94a3b8' }}>
              Selecciona un tema de la izquierda para comenzar a aprender.
            </p>
          )}
        </div>
      </div>

      {/* Simulador rápido */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>⚡ Simulador Rápido de LTV</h3>
        <p style={{ marginBottom: '15px' }}>¿Quieres entender cómo funciona el LTV? Prueba este ejemplo:</p>
        <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px' }}>
          <p><strong>Ejemplo:</strong> Quieres pedir $5,000 USD con 2 ETH de colateral (1 ETH = $3,000 USD)</p>
          <p style={{ marginTop: '10px' }}>
            Valor del colateral: 2 × $3,000 = $6,000 USD<br/>
            LTV = ($5,000 / $6,000) × 100 = <strong style={{ color: '#3b82f6' }}>83.33%</strong>
          </p>
          <p style={{ marginTop: '10px', color: '#ef4444' }}>
            ⚠️ Este LTV es alto. Si ETH baja a $2,500, tu LTV subiría a 100% y podrías ser liquidado.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Education;