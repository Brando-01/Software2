import { useState, useEffect } from 'react';
import { authService } from '../services/api';

function WalletConnector() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const profile = await authService.getProfile();
          setWalletAddress(profile.user.walletAddress);
          setBalance(profile.wallet.availableBalance);
        } catch (error) {
          console.error('Error al cargar perfil:', error);
        }
      } else {
        const savedAddress = localStorage.getItem('walletAddress');
        const savedBalance = localStorage.getItem('walletBalance');
        if (savedAddress) {
          setWalletAddress(savedAddress);
          setBalance(savedBalance);
        }
      }
    };
    
    loadProfile();
  }, []);

  const connectWallet = async () => {
    const mockAddress = '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
    
    try {
      const response = await authService.connectWallet(mockAddress);
      setWalletAddress(response.user.walletAddress);
      setBalance(response.user.wallet.availableBalance);
      window.location.reload();
    } catch (error) {
      console.error('Error al conectar:', error);
    }
  };

  const disconnectWallet = () => {
    authService.logout();
    setWalletAddress(null);
    setBalance(null);
    window.location.reload();
  };

  if (walletAddress) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        background: '#eff6ff', 
        padding: '8px 15px', 
        borderRadius: '6px', 
        fontSize: '12px', 
        border: '1px solid #93c5fd'
      }}>
        <span style={{ color: '#2563eb', fontWeight: '600' }}>
          🔗 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </span>
        <span style={{ color: '#059669', fontWeight: '600' }}>
          💰 ${parseFloat(balance).toFixed(2)} USD
        </span>
        <button 
          onClick={disconnectWallet}
          style={{ 
            background: '#ef4444', 
            padding: '4px 10px', 
            fontSize: '11px',
            marginLeft: '5px'
          }}
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <button onClick={connectWallet} style={{ background: '#2563eb' }}>
      🔌 Conectar Wallet
    </button>
  );
}

export default WalletConnector;