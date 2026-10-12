import { useApp } from '../../store/AppContext';
import Layout from '../../components/Layout';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';

function StatCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div className={`rounded-xl p-4 ${color} border`}>
      <div className="text-2xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif' }}>{value}</div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AgentDashboard() {
  const { currentUser, requests, navigate, getUserById } = useApp();
  if (!currentUser) return null;

  const total = requests.length;
  const pendientes = requests.filter(r => r.status === 'Recibida').length;
  const enValidacion = requests.filter(r => r.status === 'En validación').length;
  const enProduccion = requests.filter(r => r.status === 'En producción').length;
  const finalizadas = requests.filter(r => ['Documento disponible', 'Cerrada', 'Rechazada'].includes(r.status)).length;
  const altaPrioridad = requests.filter(r => r.priority === 'Alta' && !['Cerrada', 'Rechazada'].includes(r.status)).length;
  const infoRequerida = requests.filter(r => r.status === 'Información adicional requerida').length;

  // Average attention time (days) for closed requests
  const closedWithDuration = requests
    .filter(r => ['Cerrada', 'Documento disponible', 'Rechazada'].includes(r.status))
    .map(r => {
      const start = new Date(r.createdAt).getTime();
      const end = new Date(r.updatedAt).getTime();
      return Math.round((end - start) / (1000 * 60 * 60 * 24));
    });
  const avgDays = closedWithDuration.length > 0
    ? Math.round(closedWithDuration.reduce((a, b) => a + b, 0) / closedWithDuration.length)
    : 0;

  const recent = [...requests]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  return (
    <Layout title="Panel del Agente">
      <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Hola, {currentUser.name.split(' ')[0]}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Panel de administración de solicitudes</p>
          </div>
          <div className="text-xs text-slate-400">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total solicitudes" value={total} color="bg-slate-50 border-slate-200 text-slate-800" />
          <StatCard label="Pendientes" value={pendientes} color="bg-blue-50 border-blue-200 text-blue-800" sub="Sin asignar" />
          <StatCard label="Alta prioridad" value={altaPrioridad} color="bg-red-50 border-red-200 text-red-800" sub="Activas" />
          <StatCard label="Tiempo prom." value={avgDays} color="bg-purple-50 border-purple-200 text-purple-800" sub="días" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="En validación" value={enValidacion} color="bg-indigo-50 border-indigo-200 text-indigo-800" />
          <StatCard label="Info. requerida" value={infoRequerida} color="bg-amber-50 border-amber-200 text-amber-800" />
          <StatCard label="En producción" value={enProduccion} color="bg-purple-50 border-purple-200 text-purple-700" />
          <StatCard label="Finalizadas" value={finalizadas} color="bg-green-50 border-green-200 text-green-800" />
        </div>

        {/* Recent requests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Solicitudes recientes
            </h3>
            <button onClick={() => navigate('agent.requests')} className="text-sm text-navy-600 hover:text-navy-800 font-medium">
              Ver todas →
            </button>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['N° Solicitud', 'Cliente', 'Empresa', 'Sistema', 'Tipo', 'Prioridad', 'Estado', 'Responsable', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((req, i) => {
                  const client = getUserById(req.clientId);
                  const agent = req.assignedTo ? getUserById(req.assignedTo) : null;
                  return (
                    <tr key={req.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 ? 'bg-slate-50/40' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-navy-700">{req.number}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-800">{client?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[120px] truncate">{client?.company ?? '-'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{req.system.replace('SIESA ', '')}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{req.type}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={req.priority} size="sm" /></td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} size="sm" /></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{agent?.name.split(' ')[0] ?? '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => navigate('agent.request', { id: req.id })} className="text-xs font-medium text-navy-600 hover:text-navy-800 hover:underline">
                          Gestionar →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="lg:hidden space-y-2">
            {recent.map(req => {
              const client = getUserById(req.clientId);
              return (
                <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-semibold text-navy-700">{req.number}</span>
                    <StatusBadge status={req.status} size="sm" />
                  </div>
                  <div className="text-sm font-medium text-slate-800 mb-1 line-clamp-1">{req.title}</div>
                  <div className="text-xs text-slate-500">{client?.name} · {client?.company}</div>
                  <div className="flex items-center justify-between mt-2">
                    <PriorityBadge priority={req.priority} size="sm" />
                    <button onClick={() => navigate('agent.request', { id: req.id })} className="text-xs font-semibold text-navy-600">
                      Gestionar →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
