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
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Zona Educativa</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Aprende sobre Finanzas Descentralizadas sin riesgo</p>
      </div>

      <div className="grid-2">
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e4e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>Guías y Temas</h3>
          <div>
            {topics.map(topic => (
              <div
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                style={{
                  padding: '14px 16px',
                  marginBottom: '10px',
                  background: selectedTopic?.id === topic.id ? '#f0f2f5' : 'transparent',
                  border: `1px solid ${selectedTopic?.id === topic.id ? '#e4e7eb' : '#f0f2f5'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>{topic.title}</h4>
                <span className="badge badge-primary" style={{ fontSize: '11px' }}>{topic.level}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', border: '1px solid #e4e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>Contenido Educativo</h3>
          {selectedTopic ? (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af', marginBottom: '16px' }}>{selectedTopic.title}</h2>
              <div style={{ 
                background: '#ffffff', 
                padding: '20px', 
                borderRadius: '12px',
                border: '1px solid #e4e7eb',
                marginBottom: '20px',
                whiteSpace: 'pre-wrap'
              }}>
                <p style={{ lineHeight: '1.6', color: '#374151' }}>{selectedTopic.content}</p>
              </div>
              <button 
                onClick={() => setSelectedTopic(null)}
                style={{ background: '#6b7280' }}
              >
                ← Volver a la lista
              </button>
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '20px' }}>
              Selecciona un tema de la izquierda para comenzar a aprender.
            </p>
          )}
        </div>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e4e7eb', marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Simulador Rápido de LTV</h3>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>¿Quieres entender cómo funciona el LTV? Prueba este ejemplo:</p>
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e4e7eb' }}>
          <p style={{ fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
            <strong>Ejemplo:</strong> Quieres pedir $5,000 USD con 2 ETH de colateral (1 ETH = $3,000 USD)
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
            Valor del colateral: 2 × $3,000 = $6,000 USD
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            LTV = ($5,000 / $6,000) × 100 = <strong style={{ color: '#059669' }}>83.33%</strong>
          </p>
          <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e4e7eb' }}>
            ⚠️ Este LTV es alto. Si ETH baja a $2,500, tu LTV subiría a 100% y podrías ser liquidado.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Education;