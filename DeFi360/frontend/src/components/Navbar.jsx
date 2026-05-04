import { Link, useNavigate } from 'react-router-dom';
import WalletConnector from './WalletConnector';

function Navbar() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('walletConnected') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletBalance');
    navigate('/login');
  };

  return (
    <nav style={{
      background: '#0f172a',
      padding: '15px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #334155',
      flexWrap: 'wrap',
      gap: '15px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1 style={{ color: '#3b82f6' }}>DeFi360</h1>
        <span style={{ fontSize: '12px', background: '#1e293b', padding: '4px 8px', borderRadius: '4px' }}>
          Simulador
        </span>
      </div>

      {isAuthenticated && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <Link to="/dashboard" style={{ color: '#e2e8f0', textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/marketplace" style={{ color: '#e2e8f0', textDecoration: 'none' }}>Marketplace</Link>
          <Link to="/borrow" style={{ color: '#e2e8f0', textDecoration: 'none' }}>Pedir Préstamo</Link>
          <Link to="/lend" style={{ color: '#e2e8f0', textDecoration: 'none' }}>Prestar Fondos</Link>
          <Link to="/simulator" style={{ color: '#e2e8f0', textDecoration: 'none' }}>Simulador</Link>
          <Link to="/education" style={{ color: '#e2e8f0', textDecoration: 'none' }}>Educación</Link>
          <Link to="/support" style={{ color: '#e2e8f0', textDecoration: 'none' }}>Soporte</Link>
        </div>
      )}

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <WalletConnector />
        {isAuthenticated && (
          <button onClick={handleLogout} style={{ background: '#ef4444' }}>
            Cerrar Sesión
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;