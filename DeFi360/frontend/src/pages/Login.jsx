import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authService } from '../services/api';
import './Login.css';

const randomAddress = () =>
  '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

function Login() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('web3');
  const [credMode, setCredMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [walletState, setWalletState] = useState('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleWalletConnect = async () => {
    setError('');
    setWalletState('connecting');

    try {
      await authService.connectWallet(randomAddress());
      setWalletState('connected');
      setTimeout(() => navigate('/dashboard'), 650);
    } catch (err) {
      setWalletState('idle');
      setError(err.response?.data?.message || 'No se pudo conectar la billetera.');
    }
  };

  const handleCredentials = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (credMode === 'register') {
        await authService.register(form);
      } else {
        await authService.login({ email: form.email, password: form.password });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card glass">
        <div className="login-head">
          <div className="login-logo">🔷</div>
          <h1>DeFi360</h1>
          <p className="text-muted">Préstamos y depósitos en cripto · Web3 lending</p>
        </div>

        <div className="tabs">
          <button className={`tab ${method === 'web3' ? 'active' : ''}`} onClick={() => setMethod('web3')}>
            Web3
          </button>
          <button className={`tab ${method === 'creds' ? 'active' : ''}`} onClick={() => setMethod('creds')}>
            Credenciales
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {method === 'web3' ? (
          <div className="web3-panel">
            <div className={`wallet-orb wallet-orb--${walletState}`}>
              {walletState === 'connected' ? '✓' : '🦊'}
            </div>
            <p className="wallet-status">
              {walletState === 'connecting' && 'Estableciendo conexión segura…'}
              {walletState === 'connected' && 'Billetera conectada. Redirigiendo…'}
              {walletState === 'idle' && 'Conecta tu billetera para entrar de forma descentralizada.'}
            </p>
            <button
              className="btn-block wallet-connect-btn"
              onClick={handleWalletConnect}
              disabled={walletState !== 'idle'}
            >
              {walletState === 'idle' && '🔌 Conectar Billetera MockWallet'}
              {walletState === 'connecting' && 'Conectando…'}
              {walletState === 'connected' && '✓ Conectado'}
            </button>
          </div>
        ) : (
          <div className="creds-panel">
            <div className="creds-switch">
              <button
                className={credMode === 'login' ? 'active' : ''}
                onClick={() => setCredMode('login')}
              >
                Iniciar sesión
              </button>
              <button
                className={credMode === 'register' ? 'active' : ''}
                onClick={() => setCredMode('register')}
              >
                Crear cuenta
              </button>
            </div>

            <form onSubmit={handleCredentials}>
              {credMode === 'register' && (
                <div className="field">
                  <label>Nombre</label>
                  <input name="name" type="text" placeholder="Tu nombre" value={form.name} onChange={onChange} required />
                </div>
              )}
              <div className="field">
                <label>Correo electrónico</label>
                <input name="email" type="email" placeholder="tucorreo@ejemplo.com" value={form.email} onChange={onChange} required />
              </div>
              <div className="field">
                <label>Contraseña</label>
                <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={onChange} required />
              </div>
              <button type="submit" className="btn-block" disabled={busy}>
                {busy ? 'Procesando…' : credMode === 'register' ? 'Registrarme' : 'Entrar'}
              </button>
            </form>
          </div>
        )}

        <div className="login-note">
          📚 Simulador educativo. No se manejan fondos reales — aprende LTV, APY y liquidaciones sin riesgo.
        </div>
      </div>
    </div>
  );
}

export default Login;
