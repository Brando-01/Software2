import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authService } from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const handleConnect = async () => {
  if (!walletAddress.trim()) {
    setError('Ingresa una wallet address');
    return;
  }
  setIsConnecting(true);
  setError('');
  
  try {
    const response = await authService.connectWallet(walletAddress.trim());
    const token = localStorage.getItem('authToken');
    console.log('Token guardado:', token ? 'Sí' : 'No');
    navigate('/dashboard');
  } catch (err) {
    console.error('Error al conectar:', err);
    setError(err.response?.data?.message || 'Error al conectar wallet. Intenta de nuevo.');
  } finally {
    setIsConnecting(false);
  }
};

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 200px)',
      padding: '40px 20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '480px',
        width: '100%',
        padding: '40px',
        boxShadow: '0 20px 35px -12px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e4e7eb'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔷</div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>DeFi360</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Plataforma de Préstamos y Depósitos en Cripto
          </p>
        </div>
        
        {error && (
          <div style={{ 
            background: '#fef2f2', 
            color: '#dc2626', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '13px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        <input
          type="text"
          placeholder="Ingresa tu wallet address (0x...)"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '13px',
            borderRadius: '10px',
            border: '1px solid #e4e7eb',
            marginBottom: '12px',
            boxSizing: 'border-box'
          }}
        />
        <button 
          onClick={handleConnect}
          disabled={isConnecting}
          style={{ 
            width: '100%', 
            padding: '12px 20px', 
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '10px',
            marginBottom: '24px'
          }}
        >
          {isConnecting ? 'Conectando...' : '🔌 Conectar Billetera'}
        </button>

        <div style={{ 
          padding: '20px', 
          background: '#f8fafc', 
          borderRadius: '12px',
          border: '1px solid #e4e7eb'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>📚 Simulador Educativo</h3>
          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', marginBottom: 0 }}>
            Aprende sobre préstamos colateralizados, LTV, APY y liquidaciones sin riesgo.
            No se manejan fondos reales.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;