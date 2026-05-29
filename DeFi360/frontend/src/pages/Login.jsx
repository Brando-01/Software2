import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authService } from '../services/api';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  borderRadius: '10px',
  border: '1px solid #e4e7eb',
  marginBottom: '12px'
};

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCredentials = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (mode === 'register') {
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

  const handleWalletConnect = async () => {
    setBusy(true);
    setError('');

    try {
      const address = '0x' + Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)).join('');
      await authService.connectWallet(address);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar wallet. Intenta de nuevo.');
    } finally {
      setBusy(false);
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
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{ flex: 1, background: mode === 'login' ? '#1e40af' : '#f3f4f6', color: mode === 'login' ? '#fff' : '#374151' }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            style={{ flex: 1, background: mode === 'register' ? '#1e40af' : '#f3f4f6', color: mode === 'register' ? '#fff' : '#374151' }}
          >
            Crear Cuenta
          </button>
        </div>

        <form onSubmit={handleCredentials}>
          {mode === 'register' && (
            <input
              name="name"
              type="text"
              placeholder="Nombre"
              value={form.name}
              onChange={onChange}
              style={inputStyle}
              required
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={onChange}
            style={inputStyle}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={onChange}
            style={inputStyle}
            required
          />
          <button type="submit" disabled={busy} style={{ width: '100%', padding: '12px 20px', fontSize: '14px', fontWeight: '500', borderRadius: '10px' }}>
            {busy ? 'Procesando...' : mode === 'register' ? 'Registrarme' : 'Entrar'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <span style={{ flex: 1, height: '1px', background: '#e4e7eb' }} />
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>o</span>
          <span style={{ flex: 1, height: '1px', background: '#e4e7eb' }} />
        </div>

        <button
          onClick={handleWalletConnect}
          disabled={busy}
          style={{ width: '100%', padding: '12px 20px', fontSize: '14px', fontWeight: '500', borderRadius: '10px', background: '#111827' }}
        >
          {busy ? 'Conectando...' : '🔌 Conectar Billetera (Web3)'}
        </button>

        <div style={{ marginTop: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e4e7eb' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>📚 Simulador Educativo</h3>
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
