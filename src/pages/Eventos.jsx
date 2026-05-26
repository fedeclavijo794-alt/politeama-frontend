import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Calendar, Users, DollarSign } from 'lucide-react';

const TIPOS = ['obra', 'concierto', 'conferencia', 'taller', 'otro'];
const ESTADOS = ['planificado', 'activo', 'cancelado', 'finalizado'];
const SALAS = ['Sala Principal', 'Sala Alternativa', 'Sala de Ensayo', 'Foyer', 'Exterior'];

const EMPTY = {
  titulo: '', descripcion: '', tipo: 'obra', fecha_inicio: '', fecha_fin: '',
  hora_inicio: '', hora_fin: '', sala: '', capacidad: '', estado: 'planificado',
  precio_entrada: '', imagen_url: ''
};

export default function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [error, setError] = useState('');

  const cargar = () => {
    const qs = filtroEstado ? `?estado=${filtroEstado}` : '';
    api.get(`/eventos${qs}`).then(setEventos).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [filtroEstado]);

  const abrirNuevo = () => { setForm(EMPTY); setEditando(null); setError(''); setShowModal(true); };
  const abrirEditar = (ev) => {
    setForm({ ...ev, capacidad: ev.capacidad || '', precio_entrada: ev.precio_entrada || '' });
    setEditando(ev.id); setError(''); setShowModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, capacidad: form.capacidad ? Number(form.capacidad) : null,
                        precio_entrada: form.precio_entrada ? Number(form.precio_entrada) : null };
      if (editando) await api.put(`/eventos/${editando}`, payload);
      else await api.post('/eventos', payload);
      setShowModal(false);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    await api.delete(`/eventos/${id}`);
    cargar();
  };

  if (loading) return <div className="page-loading">Cargando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Eventos</h1>
          <p className="page-subtitle">{eventos.length} evento(s) registrado(s)</p>
        </div>
        <div className="header-actions">
          <select className="select-sm" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={abrirNuevo}>
            <Plus size={16} /> Nuevo Evento
          </button>
        </div>
      </div>

      {eventos.length === 0 ? (
        <div className="empty-page">
          <Calendar size={48} />
          <p>No hay eventos registrados</p>
          <button className="btn btn-primary" onClick={abrirNuevo}>Crear primer evento</button>
        </div>
      ) : (
        <div className="cards-grid">
          {eventos.map((ev) => (
            <div key={ev.id} className="evento-card">
              <div className="evento-card-header">
                <span className={`badge badge-tipo-${ev.tipo}`}>{ev.tipo}</span>
                <span className={`badge badge-${ev.estado === 'activo' ? 'success' : ev.estado === 'cancelado' ? 'danger' : 'neutral'}`}>
                  {ev.estado}
                </span>
              </div>
              <h3 className="evento-titulo">{ev.titulo}</h3>
              {ev.descripcion && <p className="evento-desc">{ev.descripcion}</p>}
              <div className="evento-meta">
                <span className="meta-item"><Calendar size={13} />{new Date(ev.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR')}</span>
                {ev.sala && <span className="meta-item">{ev.sala}</span>}
                {ev.capacidad && <span className="meta-item"><Users size={13} />{ev.entradas_vendidas || 0}/{ev.capacidad}</span>}
                {ev.precio_entrada && <span className="meta-item"><DollarSign size={13} />{ev.precio_entrada}</span>}
              </div>
              <div className="card-actions">
                <button className="btn-icon" onClick={() => abrirEditar(ev)}><Pencil size={15} /></button>
                <button className="btn-icon btn-icon-danger" onClick={() => eliminar(ev.id)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editando ? 'Editar Evento' : 'Nuevo Evento'} onClose={() => setShowModal(false)}>
          <form onSubmit={guardar} className="form">
            {error && <div className="form-error">{error}</div>}
            <div className="form-row">
              <div className="form-group form-group-lg">
                <label>Título *</label>
                <input required value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea rows={2} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha inicio *</label>
                <input type="date" required value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Fecha fin</label>
                <input type="date" value={form.fecha_fin} onChange={e => setForm({...form, fecha_fin: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Hora inicio</label>
                <input type="time" value={form.hora_inicio} onChange={e => setForm({...form, hora_inicio: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Hora fin</label>
                <input type="time" value={form.hora_fin} onChange={e => setForm({...form, hora_fin: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Sala</label>
                <select value={form.sala} onChange={e => setForm({...form, sala: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {SALAS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Capacidad</label>
                <input type="number" min="0" value={form.capacidad} onChange={e => setForm({...form, capacidad: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Precio entrada</label>
                <input type="number" min="0" step="0.01" value={form.precio_entrada} onChange={e => setForm({...form, precio_entrada: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
                  {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Crear evento'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
