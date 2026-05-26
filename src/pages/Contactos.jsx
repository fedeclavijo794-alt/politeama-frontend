import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Users, Mail, Phone } from 'lucide-react';

const ROLES = ['artista', 'técnico', 'director', 'productor', 'prensa', 'patrocinador', 'proveedor', 'administrativo', 'otro'];

const EMPTY = { nombre: '', apellido: '', rol: 'artista', email: '', telefono: '', organizacion: '', notas: '', activo: true };

const ROLE_COLORS = {
  artista: 'badge-artista', técnico: 'badge-tecnico', director: 'badge-director',
  productor: 'badge-productor', prensa: 'badge-prensa2', patrocinador: 'badge-sponsor',
  proveedor: 'badge-proveedor', administrativo: 'badge-admin', otro: 'badge-neutral'
};

export default function Contactos() {
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filtroRol, setFiltroRol] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');

  const cargar = () => {
    const qs = filtroRol ? `?rol=${filtroRol}` : '';
    api.get(`/contactos${qs}`).then(setContactos).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [filtroRol]);

  const abrirNuevo = () => { setForm(EMPTY); setEditando(null); setError(''); setShowModal(true); };
  const abrirEditar = (c) => { setForm({ ...c, activo: c.activo === 1 }); setEditando(c.id); setError(''); setShowModal(true); };

  const guardar = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editando) await api.put(`/contactos/${editando}`, form);
      else await api.post('/contactos', form);
      setShowModal(false); cargar();
    } catch (err) { setError(err.message); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este contacto?')) return;
    await api.delete(`/contactos/${id}`); cargar();
  };

  if (loading) return <div className="page-loading">Cargando...</div>;

  const filtrados = contactos.filter(c => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return `${c.nombre} ${c.apellido || ''} ${c.organizacion || ''}`.toLowerCase().includes(q);
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contactos</h1>
          <p className="page-subtitle">{filtrados.length} contacto(s)</p>
        </div>
        <div className="header-actions">
          <input className="input-sm" placeholder="Buscar..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)} style={{ width: 160 }} />
          <select className="select-sm" value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
            <option value="">Todos los roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="btn btn-primary" onClick={abrirNuevo}><Plus size={16} /> Nuevo Contacto</button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="empty-page"><Users size={48} /><p>No hay contactos</p>
          <button className="btn btn-primary" onClick={abrirNuevo}>Agregar primer contacto</button>
        </div>
      ) : (
        <div className="contactos-grid">
          {filtrados.map((c) => (
            <div key={c.id} className="contacto-card">
              <div className="contacto-avatar">
                {c.nombre.charAt(0)}{c.apellido ? c.apellido.charAt(0) : ''}
              </div>
              <div className="contacto-info">
                <h3 className="contacto-nombre">{c.nombre} {c.apellido || ''}</h3>
                {c.organizacion && <p className="contacto-org">{c.organizacion}</p>}
                <span className={`badge ${ROLE_COLORS[c.rol] || 'badge-neutral'}`}>{c.rol}</span>
              </div>
              <div className="contacto-contacto">
                {c.email && <a href={`mailto:${c.email}`} className="contacto-link"><Mail size={13} />{c.email}</a>}
                {c.telefono && <a href={`tel:${c.telefono}`} className="contacto-link"><Phone size={13} />{c.telefono}</a>}
              </div>
              {c.notas && <p className="contacto-notas">{c.notas}</p>}
              <div className="card-actions">
                <button className="btn-icon" onClick={() => abrirEditar(c)}><Pencil size={15} /></button>
                <button className="btn-icon btn-icon-danger" onClick={() => eliminar(c.id)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editando ? 'Editar Contacto' : 'Nuevo Contacto'} onClose={() => setShowModal(false)}>
          <form onSubmit={guardar} className="form">
            {error && <div className="form-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Rol *</label>
                <select required value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Organización</label>
              <input value={form.organizacion} onChange={e => setForm({ ...form, organizacion: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Notas</label>
              <textarea rows={2} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
            </div>
            <div className="form-group form-group-check">
              <label><input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} /> Contacto activo</label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Crear contacto'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
