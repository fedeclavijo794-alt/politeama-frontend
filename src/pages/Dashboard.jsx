import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Calendar, Users, Theater, Megaphone, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const PRIORIDAD_COLORS = { alta: 'badge-danger', media: 'badge-warning', baja: 'badge-info' };
const ESTADO_ICONS = {
  pendiente: <Clock size={14} />, 'en-progreso': <AlertCircle size={14} />, completada: <CheckCircle size={14} />
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/dashboard')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Cargando...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;

  const mesNombre = MESES[(data.mesActual || 1) - 1];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{mesNombre} {data.anioActual}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><Theater size={22} /></div>
          <div>
            <p className="stat-label">Total Eventos</p>
            <p className="stat-value">{data.totalEventos}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><Users size={22} /></div>
          <div>
            <p className="stat-label">Contactos Activos</p>
            <p className="stat-value">{data.totalContactos}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple"><Megaphone size={22} /></div>
          <div>
            <p className="stat-label">Estrategias del Mes</p>
            <p className="stat-value">{data.estrategiasMes.reduce((s, e) => s + e.total, 0)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-orange"><Calendar size={22} /></div>
          <div>
            <p className="stat-label">Tareas Pendientes</p>
            <p className="stat-value">{data.tareasPendientes.length}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Próximos Eventos</h2>
          </div>
          {data.eventosProximos.length === 0 ? (
            <p className="empty-state">No hay eventos próximos</p>
          ) : (
            <ul className="event-list">
              {data.eventosProximos.map((ev) => (
                <li key={ev.id} className="event-item">
                  <div className="event-date">
                    <span className="event-day">{new Date(ev.fecha_inicio + 'T00:00:00').getDate()}</span>
                    <span className="event-month">{MESES[new Date(ev.fecha_inicio + 'T00:00:00').getMonth()].slice(0,3)}</span>
                  </div>
                  <div className="event-info">
                    <p className="event-title">{ev.titulo}</p>
                    <p className="event-meta">{ev.sala} {ev.hora_inicio && `· ${ev.hora_inicio}`}</p>
                  </div>
                  <span className={`badge badge-${ev.estado === 'activo' ? 'success' : 'neutral'}`}>
                    {ev.estado}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Tareas del Mes</h2>
          </div>
          {data.tareasPendientes.length === 0 ? (
            <p className="empty-state">No hay tareas pendientes</p>
          ) : (
            <ul className="task-list">
              {data.tareasPendientes.map((t) => (
                <li key={t.id} className="task-item">
                  <span className={`estado-icon estado-${t.estado}`}>{ESTADO_ICONS[t.estado]}</span>
                  <div className="task-info">
                    <p className="task-title">{t.titulo}</p>
                    <p className="task-meta">
                      {t.responsable_nombre && `${t.responsable_nombre} · `}
                      {t.fecha_limite && new Date(t.fecha_limite + 'T00:00:00').toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <span className={`badge ${PRIORIDAD_COLORS[t.prioridad]}`}>{t.prioridad}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Comunicación por Canal</h2>
          </div>
          {data.estrategiasMes.length === 0 ? (
            <p className="empty-state">No hay estrategias este mes</p>
          ) : (
            <ul className="canal-list">
              {data.estrategiasMes.map((c) => (
                <li key={c.canal} className="canal-item">
                  <span className="canal-nombre">{c.canal}</span>
                  <div className="canal-bar-wrap">
                    <div className="canal-bar" style={{ width: `${(c.publicadas / c.total) * 100}%` }} />
                  </div>
                  <span className="canal-stat">{c.publicadas}/{c.total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
