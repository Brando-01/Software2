import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Login() {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simular conexión
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
      minHeight: '70vh'
    }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: '450px', width: '100%' }}>
        <h1 style={{ marginBottom: '20px' }}>DeFi360</h1>
        <p style={{ marginBottom: '30px', color: '#94a3b8' }}>
          Plataforma de Préstamos y Depósitos en Cripto (Simulador Educativo)
        </p>
        
        <button 
          onClick={handleConnect}
          disabled={isConnecting}
          style={{ width: '100%', padding: '15px', fontSize: '16px' }}
        >
          {isConnecting ? 'Conectando...' : '🔌 Conectar Billetera Web3 Simulada'}
        </button>

        <div style={{ marginTop: '30px', padding: '15px', background: '#334155', borderRadius: '8px' }}>
          <h3>📚 ¿Qué es DeFi360?</h3>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>
            Simulador educativo de préstamos colateralizados en el ecosistema DeFi.
            Aprende sobre LTV, APY, Colaterales y Liquidaciones sin riesgo.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;