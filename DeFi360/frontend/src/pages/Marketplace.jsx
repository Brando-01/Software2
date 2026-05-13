import { useState } from 'react';

function Marketplace() {
  const [filter, setFilter] = useState('all');
  const [offers] = useState([
    { id: 1, type: 'lend', user: 'Inversor A', amount: 5000, apy: 5.2, duration: 30, collateral: 'ETH' },
    { id: 2, type: 'borrow', user: 'Prestatario B', amount: 2000, apy: 4.8, duration: 60, collateral: 'USDC' },
    { id: 3, type: 'lend', user: 'Inversor C', amount: 10000, apy: 6.0, duration: 90, collateral: 'BTC' },
    { id: 4, type: 'borrow', user: 'Prestatario D', amount: 3500, apy: 5.5, duration: 45, collateral: 'ETH' },
  ]);

  const filteredOffers = filter === 'all' 
    ? offers 
    : offers.filter(offer => offer.type === filter);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Marketplace P2P</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Encuentra oportunidades de inversión o solicita préstamos</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setFilter('all')} 
          style={{ 
            background: filter === 'all' ? '#1e40af' : '#ffffff',
            color: filter === 'all' ? 'white' : '#374151',
            border: filter === 'all' ? 'none' : '1px solid #e4e7eb',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '13px'
          }}
        >
          Todos
        </button>
        <button 
          onClick={() => setFilter('lend')} 
          style={{ 
            background: filter === 'lend' ? '#059669' : '#ffffff',
            color: filter === 'lend' ? 'white' : '#374151',
            border: filter === 'lend' ? 'none' : '1px solid #e4e7eb',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '13px'
          }}
        >
          Prestar (Lend)
        </button>
        <button 
          onClick={() => setFilter('borrow')} 
          style={{ 
            background: filter === 'borrow' ? '#d97706' : '#ffffff',
            color: filter === 'borrow' ? 'white' : '#374151',
            border: filter === 'borrow' ? 'none' : '1px solid #e4e7eb',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '13px'
          }}
        >
          Pedir (Borrow)
        </button>
      </div>

      <div className="grid-2">
        {filteredOffers.map(offer => (
          <div key={offer.id} style={{ 
            background: '#ffffff', 
            borderRadius: '16px', 
            padding: '24px', 
            border: '1px solid #e4e7eb',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                {offer.type === 'lend' ? '📈 Oferta de Préstamo' : '📉 Solicitud de Préstamo'}
              </h3>
              <span className={`badge ${offer.type === 'lend' ? 'badge-success' : 'badge-warning'}`}>
                {offer.type === 'lend' ? 'Lend' : 'Borrow'}
              </span>
            </div>
            
            <p style={{ marginBottom: '12px', fontSize: '13px', color: '#6b7280' }}>
              Usuario: <strong style={{ color: '#111827' }}>{offer.user}</strong>
            </p>
            
            <h2 style={{ fontSize: '26px', fontWeight: '600', color: '#1e40af', marginBottom: '16px' }}>
              ${offer.amount.toLocaleString()} USD
            </h2>
            
            <div style={{ marginBottom: '20px', paddingTop: '12px', borderTop: '1px solid #f0f2f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>APY</span>
                <strong style={{ color: '#059669' }}>{offer.apy}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>Plazo</span>
                <strong style={{ color: '#111827' }}>{offer.duration} días</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>Colateral</span>
                <strong style={{ color: '#111827' }}>{offer.collateral}</strong>
              </div>
            </div>
            
            <button style={{ width: '100%' }}>
              {offer.type === 'lend' ? 'Invertir' : 'Solicitar Préstamo'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Marketplace;