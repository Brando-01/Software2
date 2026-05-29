import { useState, useEffect } from 'react';
import { authService, loanService } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { riskFromLtv } from '../utils/risk';

const money = (v) => `$${parseFloat(v || 0).toFixed(2)}`;

function Dashboard() {
  const [wallet, setWallet] = useState(null);
  const [address, setAddress] = useState('');
  const [loans, setLoans] = useState({ asLender: [], asBorrower: [] });
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await authService.getProfile();
      const userLoans = await loanService.getUserLoans();
      setWallet(profile.wallet);
      setAddress(profile.user.walletAddress || profile.user.email || '');
      setLoans(userLoans);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePay = async (loan) => {
    const input = window.prompt(`Monto a pagar (saldo: ${money(loan.remainingBalance)})`, loan.remainingBalance);
    if (input == null) return;

    const amount = parseFloat(input);
    if (!amount || amount <= 0) return;

    try {
      setPayingId(loan.id);
      await loanService.payLoan(loan.id, amount);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo procesar el pago');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) return <div className="empty-state">Cargando dashboard…</div>;

  const activeBorrowed = loans.asBorrower?.filter((l) => l.status === 'active').length || 0;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Resumen de tu actividad financiera en DeFi360</p>
      </div>

      <div className="grid-2">
        <div className="glass">
          <div className="flex-gap" style={{ alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 26 }}>💰</span>
            <div>
              <p className="text-muted" style={{ fontSize: 13 }}>Balance total</p>
              <div className="metric-value metric-accent">{money(wallet?.totalBalance)}</div>
            </div>
          </div>
          <div className="flex-gap" style={{ gap: 28 }}>
            <div>
              <p className="text-dim" style={{ fontSize: 12 }}>Disponible</p>
              <strong style={{ color: 'var(--risk-low)' }}>{money(wallet?.availableBalance)}</strong>
            </div>
            <div>
              <p className="text-dim" style={{ fontSize: 12 }}>Bloqueado</p>
              <strong style={{ color: 'var(--risk-medium)' }}>{money(wallet?.blockedBalance)}</strong>
            </div>
            <div>
              <p className="text-dim" style={{ fontSize: 12 }}>Ganado</p>
              <strong className="metric-accent">{money(wallet?.totalEarned)}</strong>
            </div>
          </div>
          <p className="mono mt-24">
            {address ? (address.startsWith('0x') ? `${address.slice(0, 10)}…${address.slice(-8)}` : address) : 'Cuenta tradicional'}
          </p>
        </div>

        <div className="glass">
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>Resumen de actividades</p>
          <div className="flex-gap" style={{ gap: 40 }}>
            <div>
              <p className="text-dim" style={{ fontSize: 12, marginBottom: 6 }}>Préstamos otorgados</p>
              <div className="metric-value metric-success">{loans.asLender?.length || 0}</div>
            </div>
            <div>
              <p className="text-dim" style={{ fontSize: 12, marginBottom: 6 }}>Préstamos activos</p>
              <div className="metric-value metric-accent">{activeBorrowed}</div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="mt-24" style={{ marginBottom: 16 }}>Como prestamista</h3>
      <LoanGrid loans={loans.asLender} emptyText="No tienes préstamos otorgados." />

      <h3 className="mt-24" style={{ marginBottom: 16 }}>Mis préstamos (como deudor)</h3>
      <LoanGrid
        loans={loans.asBorrower}
        emptyText="No tienes préstamos activos como deudor."
        onPay={handlePay}
        payingId={payingId}
      />
    </div>
  );
}

function LoanGrid({ loans, emptyText, onPay, payingId }) {
  if (!loans || loans.length === 0) {
    return <div className="glass-soft empty-state">{emptyText}</div>;
  }

  return (
    <div className="grid-3">
      {loans.map((loan) => {
        const level = riskFromLtv(loan.ltv);
        const paid = loan.status !== 'active';

        return (
          <div key={loan.id} className="glass glass-hover">
            <div className="flex-between">
              <span className="card-title">Préstamo #{loan.id}</span>
              <span className={`badge ${paid ? 'risk-low' : 'badge-accent'}`}>
                {paid ? 'Pagado' : 'Activo'}
              </span>
            </div>

            <div className="card-amount">{money(loan.amount)}</div>

            <div className="stat-row">
              <span className="label">Tasa</span>
              <span className="value">{loan.rateType === 'variable' ? 'Variable' : 'Fija'}</span>
            </div>
            <div className="stat-row">
              <span className="label">APY{loan.baseApy ? ' (base)' : ''}</span>
              <span className="value" style={{ color: 'var(--risk-low)' }}>{loan.baseApy || loan.apy}%</span>
            </div>
            <div className="stat-row">
              <span className="label">Saldo pendiente</span>
              <span className="value">{money(loan.remainingBalance)}</span>
            </div>
            {loan.ltv && (
              <div className="stat-row">
                <span className="label">LTV</span>
                <RiskBadge level={level} showLtv={loan.ltv} />
              </div>
            )}

            {onPay && !paid && (
              <>
                <div className="divider" />
                <button className="btn-block" onClick={() => onPay(loan)} disabled={payingId === loan.id}>
                  {payingId === loan.id ? 'Procesando…' : 'Pagar cuota'}
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Dashboard;
