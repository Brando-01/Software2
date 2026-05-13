import { useState, useEffect } from 'react';

function WalletConnector() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    const savedBalance = localStorage.getItem('walletBalance');
    if (savedAddress) {
      setWalletAddress(savedAddress);
      setBalance(savedBalance);
    }
  }, []);

  const connectWallet = () => {
    // Simulación de conexión a MetaMask (Web3 simulado)
    const mockAddress = '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
    const mockBalance = (Math.random() * 10000 + 1000).toFixed(2);
    
    setWalletAddress(mockAddress);
    setBalance(mockBalance);
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletAddress', mockAddress);
    localStorage.setItem('walletBalance', mockBalance);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setBalance(null);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletBalance');
  };

  if (walletAddress) {
    return (
      <div style={{ background: '#eff6ff', padding: '8px 15px', borderRadius: '6px', fontSize: '12px', border: '1px solid #93c5fd', color: '#2563eb', fontWeight: '600' }}>
        <span>🔗 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
        <span style={{ marginLeft: '10px', color: '#059669' }}>💰 ${balance} USD</span>
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