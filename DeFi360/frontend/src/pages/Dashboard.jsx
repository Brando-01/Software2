import { useState, useEffect } from 'react';
import { authService, loanService } from '../services/api';

function Dashboard() {
  const [walletData, setWalletData] = useState({
    address: '',
    balance: 0,
    availableBalance: 0,
    blockedBalance: 0,
    totalEarned: 0,
    loans: { asLender: [], asBorrower: [] }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const profile = await authService.getProfile();
        const loans = await loanService.getUserLoans();
        
        setWalletData({
          address: profile.user.walletAddress,
          balance: profile.wallet.totalBalance,
          availableBalance: profile.wallet.availableBalance,
          blockedBalance: profile.wallet.blockedBalance,
          totalEarned: profile.wallet.totalEarned,
          loans: loans
        });
      } catch (error) {
        console.error('Error al cargar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>Dashboard</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Resumen de tu actividad financiera</p>
      </div>
      
      <div className="grid-2">
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e4e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>💰</span>
            <div>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>Balance Total</p>
              <h2 style={{ fontSize: '28px', fontWeight: '600', color: '#1e40af' }}>
  ${typeof walletData.balance === 'number' ? walletData.balance.toFixed(2) : parseFloat(walletData.balance || 0).toFixed(2)} USD
</h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <div>
  <p style={{ fontSize: '12px', color: '#6b7280' }}>Disponible</p>
  <strong style={{ color: '#059669' }}>${typeof walletData.availableBalance === 'number' ? walletData.availableBalance.toFixed(2) : parseFloat(walletData.availableBalance || 0).toFixed(2)}</strong>
</div>
<div>
  <p style={{ fontSize: '12px', color: '#6b7280' }}>Bloqueado</p>
  <strong style={{ color: '#f59e0b' }}>${typeof walletData.blockedBalance === 'number' ? walletData.blockedBalance.toFixed(2) : parseFloat(walletData.blockedBalance || 0).toFixed(2)}</strong>
</div>
<div>
  <p style={{ fontSize: '12px', color: '#6b7280' }}>Ganado</p>
  <strong style={{ color: '#1e40af' }}>${typeof walletData.totalEarned === 'number' ? walletData.totalEarned.toFixed(2) : parseFloat(walletData.totalEarned || 0).toFixed(2)}</strong>
</div>
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', marginTop: '16px' }}>
            {walletData.address.slice(0, 10)}...{walletData.address.slice(-8)}
          </p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e4e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>Resumen de Actividades</p>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div>
              <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Préstamos Aceptados</p>
              <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#059669' }}>
                {walletData.loans.asLender?.length || 0}
              </h3>
            </div>
            <div>
              <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Préstamos Activos</p>
              <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#1e40af' }}>
                {walletData.loans.asBorrower?.filter(l => l.status === 'active').length || 0}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e4e7eb', marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>Préstamos como Prestamista</h3>
        {walletData.loans.asLender?.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No tienes préstamos como prestamista.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e4e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px 12px 0', color: '#6b7280', fontSize: '12px' }}>Monto</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#6b7280', fontSize: '12px' }}>APY</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#6b7280', fontSize: '12px' }}>Saldo Restante</th>
                  <th style={{ textAlign: 'left', padding: '12px 0 12px 8px', color: '#6b7280', fontSize: '12px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {walletData.loans.asLender.map(loan => (
                  <tr key={loan.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td style={{ padding: '12px 8px 12px 0', fontSize: '14px' }}>${parseFloat(loan.amount).toFixed(2)}</td>
                    <td style={{ padding: '12px 8px', fontSize: '14px' }}>{loan.apy}%</td>
                    <td style={{ padding: '12px 8px', fontSize: '14px' }}>${parseFloat(loan.remainingBalance).toFixed(2)}</td>
                    <td style={{ padding: '12px 0 12px 8px' }}>
                      <span className={`badge ${loan.status === 'active' ? 'badge-success' : 'badge-primary'}`}>
                        {loan.status === 'active' ? 'Activo' : 'Pagado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e4e7eb', marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>Mis Préstamos (Como Deudor)</h3>
        {walletData.loans.asBorrower?.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No tienes préstamos activos como deudor.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e4e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px 12px 0', color: '#6b7280', fontSize: '12px' }}>Monto</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#6b7280', fontSize: '12px' }}>APY</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#6b7280', fontSize: '12px' }}>Saldo Restante</th>
                  <th style={{ textAlign: 'left', padding: '12px 0 12px 8px', color: '#6b7280', fontSize: '12px' }}>Estado</th>
                 </tr>
              </thead>
              <tbody>
                {walletData.loans.asBorrower.map(loan => (
                  <tr key={loan.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td style={{ padding: '12px 8px 12px 0', fontSize: '14px' }}>${parseFloat(loan.amount).toFixed(2)}</td>
                    <td style={{ padding: '12px 8px', fontSize: '14px' }}>{loan.apy}%</td>
                    <td style={{ padding: '12px 8px', fontSize: '14px' }}>${parseFloat(loan.remainingBalance).toFixed(2)}</td>
                    <td style={{ padding: '12px 0 12px 8px' }}>
                      <span className={`badge ${loan.status === 'active' ? 'badge-warning' : 'badge-success'}`}>
                        {loan.status === 'active' ? 'En curso' : 'Pagado'}
                      </span>
                    </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;