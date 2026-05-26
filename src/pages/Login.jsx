import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function authFetch(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'setup'
  const [form, setForm] = useState({ username: '', password: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/auth/status`)
      .then(r => r.json())
      .then(data => { setMode(data.configured ? 'login' : 'setup'); })
      .catch(() => setMode('login'))
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await authFetch('/auth/login', { username: form.username, password: form.password });
      login(data.token, { username: data.username, role: data.role });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }
    if (form.newPassword.length < 8) {
      return setError('La contraseña debe tener al menos 8 caracteres');
    }
    setLoading(true);
    try {
      const data = await authFetch('/auth/setup', { username: form.username, password: form.newPassword });
      login(data.token, { username: data.username, role: 'admin' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <p style={{ color: '#7878a0', textAlign: 'center' }}>Conectando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon" style={{ width: 52, height: 52, fontSize: 24 }}>P</div>
          <h1 className="login-title">Politeama</h1>
          <p className="login-subtitle">Sistema de Gestión Teatral</p>
        </div>

        {mode === 'setup' && (
          <div className="setup-notice">
            Primera vez — creá las credenciales del administrador
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleSetup} className="form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text"
              required
              autoFocus
              autoComplete="username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="nombre de usuario"
            />
          </div>

          {mode === 'login' ? (
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Contraseña (mín. 8 caracteres)</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.newPassword}
                  onChange={e => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta de administrador'}
          </button>
        </form>
      </div>
    </div>
  );
}
