import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Megaphone } from 'lucide-react';

const CANALES = ['Redes Sociales', 'Email', 'Prensa', 'Web', 'Cartelería', 'Radio', 'TV', 'Otro'];
const ESTADOS = ['pendiente', 'en-progreso', 'publicada', 'cancelada'];
const PRIORIDADES = ['alta', 'media', 'baja'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const BADGE_CANAL = {
  'Redes Sociales': 'badge-social', 'Email': 'badge-email', 'Prensa': 'badge-prensa',
  'Web': 'badge-web', 'Cartelería': 'badge-cartel', 'Radio': 'badge-radio',
  'TV': 'badge-tv', 'Otro': 'badge-neutral'
};

const now = new Date();
const EMPTY = {
  titulo: '', descripcion: '', canal: 'Redes Sociales', mes: now.getMonth() + 1,
  anio: now.getFullYear(), estado: 'pendiente', responsable_id: '',
  evento_id: '', prioridad: 'media', fecha_publicacion: '', contenido: ''
};

export default function Estrategias() {
  const [estrategias, setEstategias] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filtro, setFiltro] = useState({ mes: now.getMonth() + 1, anio: now.getFullYear(), canal: '' });
  const [error, setError] = useState('');

  const cargar = () => {
    const qs = new URLSearchParams({ mes: filtro.mes, anio: filtro.anio, ...(filtro.canal && { canal: filtro.canal }) }).toString();
    Promise.all([
      api.get(`/estrategias?${qs}`),
      api.get('/contactos'),
      api.get('/eventos'),
    ]).then(([est, cont, ev]) => { setEstategias(est); setContactos(cont); setEventos(ev); })
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [filtro.mes, filtro.anio, filtro.canal]);

  const abrirNuevo = () => { setForm({ ...EMPTY, mes: filtro.mes, anio: filtro.anio }); setEditando(null); setError(''); setShowModal(true); };
  const abrirEditar = (e) => { setForm({ ...e, responsable_id: e.responsable_id || '', evento_id: e.evento_id || '' }); setEditando(e.id); setError(''); setShowModal(true); };

  const guardar = async (e) => {
    e.preventDefault(); setError('');
    try {
      const payload = { ...form, mes: Number(form.mes), anio: Number(form.anio),
                        responsable_id: form.responsable_id || null, evento_id: form.evento_id || null };
      if (editando) await api.put(`/estrategias/${editando}`, payload);
      else await api.post('/estrategias', payload);
      setShowModal(false); cargar();
    } catch (err) { setError(err.message); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta estrategia?')) return;
    await api.delete(`/estrategias/${id}`); cargar();
  };

  if (loading) return <div className="page-loading">Cargando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Estrategias Comunicacionales</h1>
          <p className="page-subtitle">{estrategias.length} estrategia(s) — {MESES[filtro.mes - 1]} {filtro.anio}</p>
        </div>
        <div className="header-actions">
          <select className="select-sm" value={filtro.mes} onChange={e => setFiltro({ ...filtro, mes: Number(e.target.value) })}>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input className="input-sm" type="number" value={filtro.anio} min="2020" max="2030"
            onChange={e => setFiltro({ ...filtro, anio: Number(e.target.value) })} />
          <select className="select-sm" value={filtro.canal} onChange={e => setFiltro({ ...filtro, canal: e.target.value })}>
            <option value="">Todos los canales</option>
            {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-primary" onClick={abrirNuevo}><Plus size={16} /> Nueva Estrategia</button>
        </div>
      </div>

      {estrategias.length === 0 ? (
        <div className="empty-page"><Megaphone size={48} /><p>No hay estrategias para este período</p>
          <button className="btn btn-primary" onClick={abrirNuevo}>Crear primera estrategia</button>
        </div>
      ) : (
        <div className="estrategia-list">
          {estrategias.map((es) => (
            <div key={es.id} className={`estrategia-card prioridad-${es.prioridad}`}>
              <div className="estrategia-header">
                <span className={`badge ${BADGE_CANAL[es.canal] || 'badge-neutral'}`}>{es.canal}</span>
                <span className={`badge badge-prioridad-${es.prioridad}`}>{es.prioridad}</span>
                <span className={`badge badge-estado-${es.estado}`}>{es.estado}</span>
              </div>
              <h3 className="estrategia-titulo">{es.titulo}</h3>
              {es.descripcion && <p className="estrategia-desc">{es.descripcion}</p>}
              {es.contenido && (
                <div className="estrategia-contenido">
                  <p className="contenido-label">Contenido:</p>
                  <p className="contenido-text">{es.contenido}</p>
                </div>
              )}
              <div className="estrategia-meta">
                {es.responsable_nombre && <span>Responsable: {es.responsable_nombre} {es.responsable_apellido || ''}</span>}
                {es.evento_titulo && <span>Evento: {es.evento_titulo}</span>}
                {es.fecha_publicacion && <span>Publ.: {new Date(es.fecha_publicacion + 'T00:00:00').toLocaleDateString('es-AR')}</span>}
              </div>
              <div className="card-actions">
                <button className="btn-icon" onClick={() => abrirEditar(es)}><Pencil size={15} /></button>
                <button className="btn-icon btn-icon-danger" onClick={() => eliminar(es.id)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editando ? 'Editar Estrategia' : 'Nueva Estrategia'} onClose={() => setShowModal(false)}>
          <form onSubmit={guardar} className="form">
            {error && <div className="form-error">{error}</div>}
            <div className="form-row">
              <div className="form-group form-group-lg">
                <label>Título *</label>
                <input required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Canal *</label>
                <select required value={form.canal} onChange={e => setForm({ ...form, canal: e.target.value })}>
                  {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Contenido / Mensaje clave</label>
              <textarea rows={3} value={form.contenido} onChange={e => setForm({ ...form, contenido: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Mes *</label>
                <select required value={form.mes} onChange={e => setForm({ ...form, mes: Number(e.target.value) })}>
                  {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Año *</label>
                <input type="number" required min="2020" max="2030" value={form.anio} onChange={e => setForm({ ...form, anio: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Fecha publicación</label>
                <input type="date" value={form.fecha_publicacion} onChange={e => setForm({ ...form, fecha_publicacion: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Prioridad</label>
                <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                  {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Responsable</label>
                <select value={form.responsable_id} onChange={e => setForm({ ...form, responsable_id: e.target.value })}>
                  <option value="">Sin asignar</option>
                  {contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Evento relacionado</label>
                <select value={form.evento_id} onChange={e => setForm({ ...form, evento_id: e.target.value })}>
                  <option value="">Ninguno</option>
                  {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.titulo}</option>)}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Crear estrategia'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
