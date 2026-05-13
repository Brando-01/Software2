import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Login() {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      const mockAddress = '0x' + Array.from({ length: 40 }, () => 
        Math.floor(Math.random() * 16).toString(16)).join('');
      const mockBalance = (Math.random() * 10000 + 1000).toFixed(2);
      
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', mockAddress);
      localStorage.setItem('walletBalance', mockBalance);
      
      setIsConnecting(false);
      navigate('/dashboard');
    }, 1500);
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