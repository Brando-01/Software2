import { useState, useEffect } from 'react';

function Dashboard() {
  const [walletData, setWalletData] = useState({
    address: '',
    balance: 0,
    totalLent: 0,
    totalBorrowed: 0,
    activeLoans: []
  });

  useEffect(() => {
    const address = localStorage.getItem('walletAddress') || '';
    const balance = parseFloat(localStorage.getItem('walletBalance')) || 0;
    
    setWalletData({
      address,
      balance,
      totalLent: 2450.00,
      totalBorrowed: 1500.00,
      activeLoans: [
        { id: 1, amount: 1000, collateral: 'ETH', ltv: 65, status: 'Activo' },
        { id: 2, amount: 500, collateral: 'USDC', ltv: 50, status: 'Activo' }
      ]
    });
  }, []);

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
              <h2 style={{ fontSize: '28px', fontWeight: '600', color: '#1e40af' }}>${walletData.balance.toFixed(2)} USD</h2>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
            {walletData.address.slice(0, 10)}...{walletData.address.slice(-8)}
          </p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e4e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>Resumen de Actividades</p>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div>
              <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Fondos Prestados</p>
              <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#059669' }}>${walletData.totalLent}</h3>
            </div>
            <div>
              <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Préstamos Activos</p>
              <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#1e40af' }}>${walletData.totalBorrowed}</h3>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e4e7eb', marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>Préstamos Activos</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e4e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px 12px 0', color: '#6b7280', fontSize: '12px', fontWeight: '500' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#6b7280', fontSize: '12px', fontWeight: '500' }}>Monto</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#6b7280', fontSize: '12px', fontWeight: '500' }}>Colateral</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#6b7280', fontSize: '12px', fontWeight: '500' }}>LTV</th>
                <th style={{ textAlign: 'left', padding: '12px 0 12px 8px', color: '#6b7280', fontSize: '12px', fontWeight: '500' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {walletData.activeLoans.map(loan => (
                <tr key={loan.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <td style={{ padding: '12px 8px 12px 0', fontSize: '14px', color: '#111827' }}>{loan.id}</td>
                  <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827' }}>${loan.amount}</td>
                  <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827' }}>{loan.collateral}</td>
                  <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827' }}>{loan.ltv}%</td>
                  <td style={{ padding: '12px 0 12px 8px' }}>
                    <span className="badge badge-success">{loan.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
           </table>
        </div>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e4e7eb', marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Rendimiento (Últimos 30 días)</h3>
        <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '16px', border: '1px solid #bfdbfe' }}>
          <p style={{ fontSize: '24px', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>+$127.50</p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>APY Promedio: 5.2%</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;