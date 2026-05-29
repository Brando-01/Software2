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
          setWalletAddress(profile.user.walletAddress || profile.user.email);
          setBalance(profile.wallet?.availableBalance);
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

  if (!walletAddress) {
    return <button onClick={connectWallet}>🔌 Conectar Wallet</button>;
  }

  const shortAddress = walletAddress.startsWith('0x')
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : walletAddress;

  return (
    <div className="wallet-chip">
      <span className="wallet-chip__addr">🔗 {shortAddress}</span>
      {balance != null && (
        <span className="wallet-chip__bal">${parseFloat(balance).toFixed(2)}</span>
      )}
      <button onClick={disconnectWallet} className="btn-ghost wallet-chip__exit">Salir</button>
    </div>
  );
}

export default WalletConnector;
