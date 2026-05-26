import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';

const ESTADOS = ['pendiente', 'en-progreso', 'completada', 'cancelada'];
const PRIORIDADES = ['alta', 'media', 'baja'];
const CATEGORIAS = ['general', 'comunicación', 'producción', 'administración', 'técnico', 'artístico'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const now = new Date();
const EMPTY = {
  titulo: '', descripcion: '', mes: now.getMonth() + 1, anio: now.getFullYear(),
  fecha_limite: '', estado: 'pendiente', prioridad: 'media', responsable_id: '',
  categoria: 'general', evento_id: ''
};

const ESTADO_ICON = {
  pendiente: <Circle size={16} className="text-gray" />,
  'en-progreso': <Clock size={16} className="text-blue" />,
  completada: <CheckCircle2 size={16} className="text-green" />,
  cancelada: <Circle size={16} className="text-red" />
};

export default function Planificacion() {
  const [tareas, setTareas] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filtro, setFiltro] = useState({ mes: now.getMonth() + 1, anio: now.getFullYear(), categoria: '' });
  const [error, setError] = useState('');

  const cargar = () => {
    const qs = new URLSearchParams({
      mes: filtro.mes, anio: filtro.anio,
      ...(filtro.categoria && { categoria: filtro.categoria })
    }).toString();
    Promise.all([
      api.get(`/tareas?${qs}`),
      api.get('/contactos'),
      api.get('/eventos'),
    ]).then(([tar, cont, ev]) => { setTareas(tar); setContactos(cont); setEventos(ev); })
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [filtro.mes, filtro.anio, filtro.categoria]);

  const abrirNuevo = () => { setForm({ ...EMPTY, mes: filtro.mes, anio: filtro.anio }); setEditando(null); setError(''); setShowModal(true); };
  const abrirEditar = (t) => { setForm({ ...t, responsable_id: t.responsable_id || '', evento_id: t.evento_id || '' }); setEditando(t.id); setError(''); setShowModal(true); };

  const guardar = async (e) => {
    e.preventDefault(); setError('');
    try {
      const payload = { ...form, mes: Number(form.mes), anio: Number(form.anio),
                        responsable_id: form.responsable_id || null, evento_id: form.evento_id || null };
      if (editando) await api.put(`/tareas/${editando}`, payload);
      else await api.post('/tareas', payload);
      setShowModal(false); cargar();
    } catch (err) { setError(err.message); }
  };

  const cambiarEstado = async (tarea) => {
    const ciclo = ['pendiente', 'en-progreso', 'completada'];
    const idx = ciclo.indexOf(tarea.estado);
    const siguiente = ciclo[(idx + 1) % ciclo.length];
    await api.put(`/tareas/${tarea.id}`, { ...tarea, estado: siguiente });
    cargar();
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    await api.delete(`/tareas/${id}`); cargar();
  };

  if (loading) return <div className="page-loading">Cargando...</div>;

  const porCategoria = CATEGORIAS.reduce((acc, cat) => {
    const lista = tareas.filter(t => t.categoria === cat);
    if (lista.length) acc[cat] = lista;
    return acc;
  }, {});

  const pendientes = tareas.filter(t => t.estado !== 'completada' && t.estado !== 'cancelada').length;
  const completadas = tareas.filter(t => t.estado === 'completada').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Planificación Mensual</h1>
          <p className="page-subtitle">{MESES[filtro.mes - 1]} {filtro.anio} — {pendientes} pendiente(s), {completadas} completada(s)</p>
        </div>
        <div className="header-actions">
          <select className="select-sm" value={filtro.mes} onChange={e => setFiltro({ ...filtro, mes: Number(e.target.value) })}>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input className="input-sm" type="number" value={filtro.anio} min="2020" max="2030"
            onChange={e => setFiltro({ ...filtro, anio: Number(e.target.value) })} />
          <select className="select-sm" value={filtro.categoria} onChange={e => setFiltro({ ...filtro, categoria: e.target.value })}>
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-primary" onClick={abrirNuevo}><Plus size={16} /> Nueva Tarea</button>
        </div>
      </div>

      {tareas.length > 0 && (
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${tareas.length ? (completadas / tareas.length) * 100 : 0}%` }} />
          <span className="progress-label">{tareas.length ? Math.round((completadas / tareas.length) * 100) : 0}% completado</span>
        </div>
      )}

      {tareas.length === 0 ? (
        <div className="empty-page"><Calendar size={48} /><p>No hay tareas para este período</p>
          <button className="btn btn-primary" onClick={abrirNuevo}>Crear primera tarea</button>
        </div>
      ) : (
        <div className="kanban">
          {Object.entries(porCategoria).map(([cat, lista]) => (
            <div key={cat} className="kanban-col">
              <h3 className="kanban-col-title">{cat} <span className="badge badge-neutral">{lista.length}</span></h3>
              {lista.map((t) => (
                <div key={t.id} className={`tarea-card tarea-${t.estado}`}>
                  <div className="tarea-header">
                    <button className="btn-estado" onClick={() => cambiarEstado(t)} title="Cambiar estado">
                      {ESTADO_ICON[t.estado]}
                    </button>
                    <span className={`badge badge-prioridad-${t.prioridad}`}>{t.prioridad}</span>
                  </div>
                  <p className={`tarea-titulo ${t.estado === 'completada' ? 'tachado' : ''}`}>{t.titulo}</p>
                  {t.descripcion && <p className="tarea-desc">{t.descripcion}</p>}
                  <div className="tarea-meta">
                    {t.responsable_nombre && <span>{t.responsable_nombre}</span>}
                    {t.fecha_limite && <span>{new Date(t.fecha_limite + 'T00:00:00').toLocaleDateString('es-AR')}</span>}
                    {t.evento_titulo && <span>{t.evento_titulo}</span>}
                  </div>
                  <div className="card-actions">
                    <button className="btn-icon" onClick={() => abrirEditar(t)}><Pencil size={14} /></button>
                    <button className="btn-icon btn-icon-danger" onClick={() => eliminar(t.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editando ? 'Editar Tarea' : 'Nueva Tarea'} onClose={() => setShowModal(false)}>
          <form onSubmit={guardar} className="form">
            {error && <div className="form-error">{error}</div>}
            <div className="form-row">
              <div className="form-group form-group-lg">
                <label>Título *</label>
                <input required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
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
                <label>Fecha límite</label>
                <input type="date" value={form.fecha_limite} onChange={e => setForm({ ...form, fecha_limite: e.target.value })} />
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
              <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Crear tarea'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
