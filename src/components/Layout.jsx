import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, Megaphone, Users, Theater, LogOut, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import Modal from './Modal';
import { api } from '../api/client';

const navItems = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/eventos',      label: 'Eventos',       icon: Theater },
  { to: '/estrategias',  label: 'Comunicación',  icon: Megaphone },
  { to: '/planificacion',label: 'Planificación', icon: Calendar },
  { to: '/contactos',    label: 'Contactos',     icon: Users },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdOk, setPwdOk] = useState(false);

  const handleChangePwd = async (e) => {
    e.preventDefault();
    setPwdError(''); setPwdOk(false);
    if (pwdForm.newPassword !== pwdForm.confirm) return setPwdError('Las contraseñas no coinciden');
    if (pwdForm.newPassword.length < 8) return setPwdError('Mínimo 8 caracteres');
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setPwdOk(true);
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwdError(err.message);
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">P</div>
          <div>
            <h1 className="logo-title">Politeama</h1>
            <p className="logo-subtitle">Gestión Teatral</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
            <span className="user-name">{user?.username}</span>
          </div>
          <div className="user-actions">
            <button className="btn-icon" title="Cambiar contraseña" onClick={() => { setShowPwd(true); setPwdError(''); setPwdOk(false); }}>
              <KeyRound size={15} />
            </button>
            <button className="btn-icon" title="Cerrar sesión" onClick={logout}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {showPwd && (
        <Modal title="Cambiar contraseña" onClose={() => setShowPwd(false)}>
          <form onSubmit={handleChangePwd} className="form">
            {pwdError && <div className="form-error">{pwdError}</div>}
            {pwdOk && <div className="form-success">Contraseña actualizada correctamente</div>}
            <div className="form-group">
              <label>Contraseña actual</label>
              <input type="password" required value={pwdForm.currentPassword}
                onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Nueva contraseña</label>
              <input type="password" required value={pwdForm.newPassword}
                onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Confirmar nueva contraseña</label>
              <input type="password" required value={pwdForm.confirm}
                onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPwd(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Actualizar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
