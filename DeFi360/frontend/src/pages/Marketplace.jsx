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
      <h1>Marketplace P2P</h1>
      <p style={{ marginBottom: '20px', color: '#94a3b8' }}>
        Encuentra oportunidades de inversión o solicita préstamos
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button onClick={() => setFilter('all')} style={{ background: filter === 'all' ? '#3b82f6' : '#334155' }}>
          Todos
        </button>
        <button onClick={() => setFilter('lend')} style={{ background: filter === 'lend' ? '#10b981' : '#334155' }}>
          📈 Prestar (Lend)
        </button>
        <button onClick={() => setFilter('borrow')} style={{ background: filter === 'borrow' ? '#f59e0b' : '#334155' }}>
          📉 Pedir (Borrow)
        </button>
      </div>

      <div className="grid-2">
        {filteredOffers.map(offer => (
          <div key={offer.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{offer.type === 'lend' ? '📈 Oferta de Préstamo' : '📉 Solicitud de Préstamo'}</h3>
              <span style={{ 
                background: offer.type === 'lend' ? '#10b981' : '#f59e0b',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {offer.type === 'lend' ? 'Lend' : 'Borrow'}
              </span>
            </div>
            <p style={{ margin: '15px 0' }}>Usuario: {offer.user}</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>${offer.amount.toLocaleString()} USD</p>
            <div style={{ marginTop: '15px' }}>
              <p>📊 APY: {offer.apy}%</p>
              <p>⏱️ Plazo: {offer.duration} días</p>
              <p>🔒 Colateral: {offer.collateral}</p>
            </div>
            <button style={{ marginTop: '15px', width: '100%' }}>
              {offer.type === 'lend' ? 'Invertir' : 'Solicitar Préstamo'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Marketplace;