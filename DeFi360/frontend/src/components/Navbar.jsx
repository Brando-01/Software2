import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import WalletConnector from './WalletConnector';
import { authService } from '../services/api';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = localStorage.getItem('walletConnected') === 'true';

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/borrow', label: 'Pedir Préstamo' },
    { to: '/lend', label: 'Prestar Fondos' },
    { to: '/simulator', label: 'Simulador' },
    { to: '/education', label: 'Educación' },
    { to: '/support', label: 'Soporte' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-logo">🔷</div>
          <div className="brand-text">
            <h1>DeFi360</h1>
            <span className="brand-badge">Simulador</span>
          </div>
        </Link>

        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>

        {isAuthenticated && (
          <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {navLinks.map(link => (
              <Link 
                key={link.to}
                to={link.to} 
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="navbar-right">
          <WalletConnector />
          {isAuthenticated && (
            <button onClick={handleLogout} className="btn-ghost">
              Cerrar Sesión
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;