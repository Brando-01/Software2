import { useState, useEffect } from 'react';
import { marketplaceService, loanService } from '../services/api';

function Marketplace( { priceOracle }) {
  const [filter, setFilter] = useState('all');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [prices, setPrices] = useState({});

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const filters = filter === 'all' ? {} : { type: filter };
      const data = await marketplaceService.getOffers(filters);
      const offersData = data.offers || [];
      setOffers(offersData);
      await loadPrices(offersData);
      setError(null);
    } catch (err) {
      console.error('Error al cargar ofertas:', err);
      setError('Error al cargar las ofertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [filter]);

  const loadPrices = async (offersData) => {
  try {
    const loadedPrices = {};

    for (const offer of offersData) {
      if (offer.collateralType) {
        loadedPrices[offer.collateralType] =
          await priceOracle.getAssetPrice(
            offer.collateralType
          );
      }
    }

    setPrices(loadedPrices);
  } catch (err) {
    console.error('Error cargando precios', err);
  }
};

  const handleMatchLoan = async (offerId) => {
    try {
      setProcessingId(offerId);
      const result = await loanService.matchLoan(offerId);
      alert('✅ Préstamo aceptado exitosamente');
      fetchOffers();
    } catch (err) {
      console.error('Error al aceptar:', err);
      alert(err.response?.data?.message || 'Error al aceptar el préstamo');
    } finally {
      setProcessingId(null);
    }
  };

  const getBadgeClass = (type) => {
    return type === 'lend' ? 'badge-success' : 'badge-warning';
  };

  const getBadgeText = (type) => {
    return type === 'lend' ? 'Lend' : 'Borrow';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Cargando ofertas...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Marketplace P2P</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Encuentra oportunidades de inversión o solicita préstamos</p>
      </div>

      {error && (
        <div style={{ 
          background: '#fef2f2', 
          color: '#dc2626', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

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

      {offers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: '#f8fafc', borderRadius: '16px' }}>
          <p style={{ color: '#6b7280' }}>No hay ofertas disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid-2">
          {offers.map(offer => (
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
                <span className={`badge ${getBadgeClass(offer.type)}`}>
                  {getBadgeText(offer.type)}
                </span>
              </div>
              
              <p style={{ marginBottom: '12px', fontSize: '13px', color: '#6b7280' }}>
                Usuario: <strong style={{ color: '#111827' }}>{offer.User?.walletAddress?.slice(0, 10) || 'Usuario'}...</strong>
              </p>
              
              <h2 style={{ fontSize: '26px', fontWeight: '600', color: '#1e40af', marginBottom: '16px' }}>
                ${parseFloat(offer.amount).toLocaleString()} USD
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
                {offer.collateralType && (
                  <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>Colateral</span>
                    <strong style={{ color: '#111827' }}>{offer.collateralAmount} {offer.collateralType}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>Precio Oracle</span>
                    <strong style={{ color: '#1e40af' }}>{prices[offer.collateralType] !== undefined 
                    ? `$${prices[offer.collateralType]}`   : 'Cargando...'} </strong>
                  </div>
                  </>
                )}
              </div>
              
              <button 
                onClick={() => handleMatchLoan(offer.id)}
                disabled={processingId === offer.id || offer.type === 'lend'}
                style={{ 
                  width: '100%',
                  background: offer.type === 'lend' ? '#6b7280' : '#2563eb'
                }}
              >
                {processingId === offer.id 
                  ? 'Procesando...' 
                  : offer.type === 'lend' 
                    ? 'Invertir' 
                    : 'Aceptar Préstamo'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Marketplace;