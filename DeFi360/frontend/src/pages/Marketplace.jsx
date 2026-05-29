import { useState, useEffect } from 'react';
import { marketplaceService, loanService } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { riskFromLtv } from '../utils/risk';

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'lend', label: 'Prestar (Lend)' },
  { key: 'borrow', label: 'Pedir (Borrow)' }
];

function Marketplace() {
  const [filter, setFilter] = useState('all');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        setCurrentUserId(JSON.parse(userData)?.id ?? null);
      } catch (err) {
        console.warn('Marketplace: userData inválido', err);
      }
    }
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const filters = filter === 'all' ? {} : { type: filter };
      const data = await marketplaceService.getOffers(filters);
      setOffers(data.offers || []);
      setError(null);
    } catch (err) {
      console.error('Error al cargar ofertas:', err);
      setError('No se pudieron cargar las ofertas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [filter]);

  const handleMatchLoan = async (offerId) => {
    try {
      setProcessingId(offerId);
      await loanService.matchLoan(offerId);
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al aceptar el préstamo');
    } finally {
      setProcessingId(null);
    }
  };

  const isOwn = (offer) => offer.userId === currentUserId || offer.User?.id === currentUserId;

  return (
    <div>
      <div className="page-header">
        <h1>Marketplace P2P</h1>
        <p>Encuentra oportunidades de inversión o solicita financiamiento colateralizado</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="flex-gap" style={{ marginBottom: 26, flexWrap: 'wrap' }}>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={filter === key ? '' : 'btn-ghost'}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Cargando ofertas…</div>
      ) : offers.length === 0 ? (
        <div className="glass-soft empty-state">No hay ofertas disponibles en este momento.</div>
      ) : (
        <div className="grid-3">
          {offers.map((offer) => {
            const level = riskFromLtv(offer.ltv);
            const own = isOwn(offer);
            const isLend = offer.type === 'lend';

            return (
              <div key={offer.id} className="glass glass-hover">
                <div className="flex-between">
                  <span className="card-title">
                    {isLend ? '📈 Oferta de Préstamo' : '📉 Solicitud de Préstamo'}
                  </span>
                  <span className={`badge ${isLend ? 'risk-low' : 'badge-accent'}`}>
                    {isLend ? 'Lend' : 'Borrow'}
                  </span>
                </div>

                <div className="card-amount">${parseFloat(offer.amount).toLocaleString()}</div>

                <div className="stat-row">
                  <span className="label">APY</span>
                  <span className="value" style={{ color: 'var(--risk-low)' }}>{offer.apy}%</span>
                </div>
                <div className="stat-row">
                  <span className="label">Plazo</span>
                  <span className="value">{offer.duration} días</span>
                </div>
                {offer.rateType && (
                  <div className="stat-row">
                    <span className="label">Tasa</span>
                    <span className="value">{offer.rateType === 'variable' ? 'Variable' : 'Fija'}</span>
                  </div>
                )}
                {offer.collateralType && (
                  <div className="stat-row">
                    <span className="label">Colateral</span>
                    <span className="value">{offer.collateralAmount} {offer.collateralType}</span>
                  </div>
                )}
                {offer.ltv && (
                  <div className="stat-row">
                    <span className="label">LTV</span>
                    <RiskBadge level={level} showLtv={offer.ltv} />
                  </div>
                )}

                <div className="divider" />

                <p className="mono" style={{ marginBottom: 14 }}>
                  {offer.User?.walletAddress?.slice(0, 12) || 'Usuario'}…
                </p>

                <button
                  className="btn-block"
                  onClick={() => handleMatchLoan(offer.id)}
                  disabled={processingId === offer.id || isLend || own}
                >
                  {processingId === offer.id
                    ? 'Procesando…'
                    : own
                      ? 'Tu oferta'
                      : isLend
                        ? 'Invertir'
                        : 'Aceptar Préstamo'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Marketplace;
