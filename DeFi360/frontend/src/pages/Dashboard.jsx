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
    // Cargar datos simulados de la wallet
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
      <h1>Dashboard</h1>
      
      <div className="grid-2">
        <div className="card">
          <h3>💰 Balance Total</h3>
          <h1 style={{ fontSize: '32px', margin: '15px 0', color: '#3b82f6' }}>
            ${walletData.balance.toFixed(2)} USD
          </h1>
          <p>Dirección: {walletData.address.slice(0, 10)}...{walletData.address.slice(-8)}</p>
        </div>

        <div className="card">
          <h3>📊 Resumen de Actividades</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <div>
              <p style={{ color: '#94a3b8' }}>Fondos Prestados</p>
              <h2>${walletData.totalLent}</h2>
            </div>
            <div>
              <p style={{ color: '#94a3b8' }}>Préstamos Activos</p>
              <h2>${walletData.totalBorrowed}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>📋 Préstamos Activos</h3>
        <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ textAlign: 'left', padding: '10px' }}>ID</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Monto</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Colateral</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>LTV</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {walletData.activeLoans.map(loan => (
              <tr key={loan.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '10px' }}>{loan.id}</td>
                <td style={{ padding: '10px' }}>${loan.amount}</td>
                <td style={{ padding: '10px' }}>{loan.collateral}</td>
                <td style={{ padding: '10px' }}>{loan.ltv}%</td>
                <td style={{ padding: '10px', color: '#10b981' }}>{loan.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>💰 Rendimientos Generados (Últimos 30 días)</h3>
        <div style={{ marginTop: '15px' }}>
          <div style={{ background: '#334155', borderRadius: '8px', padding: '15px' }}>
            <p style={{ fontSize: '24px', color: '#3b82f6' }}>+$127.50</p>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>APY Promedio: 5.2%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;