import { useState, useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import Layout from '../../components/Layout';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import type { RequestStatus } from '../../types';

const ALL_STATUSES: RequestStatus[] = [
  'Recibida', 'En validación', 'Información adicional requerida',
  'Aprobada', 'En producción', 'Documento disponible', 'Rechazada', 'Cerrada',
];

export default function MyRequests() {
  const { currentUser, getClientRequests, navigate, getUserById } = useApp();
  if (!currentUser) return null;

  const requests = getClientRequests(currentUser.id);
  const [filterStatus, setFilterStatus] = useState<RequestStatus | ''>('');
  const [filterType, setFilterType] = useState('');
  const [filterSystem, setFilterSystem] = useState('');
  const [searchNum, setSearchNum] = useState('');

  const filtered = useMemo(() => {
    let list = [...requests].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    if (filterStatus) list = list.filter(r => r.status === filterStatus);
    if (filterType) list = list.filter(r => r.type === filterType);
    if (filterSystem) list = list.filter(r => r.system === filterSystem);
    if (searchNum) list = list.filter(r => r.number.toLowerCase().includes(searchNum.toLowerCase()) || r.title.toLowerCase().includes(searchNum.toLowerCase()));
    return list;
  }, [requests, filterStatus, filterType, filterSystem, searchNum]);

  const systems = [...new Set(requests.map(r => r.system))];

  return (
    <Layout title="Mis Solicitudes">
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-slate-500 text-sm">{requests.length} solicitudes en total</p>
          </div>
          <button
            onClick={() => navigate('client.new-request')}
            className="px-4 py-2 bg-navy-800 text-white text-sm font-semibold rounded-lg hover:bg-navy-900 transition-colors shadow-sm"
          >
            + Nueva solicitud
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              value={searchNum}
              onChange={e => setSearchNum(e.target.value)}
              placeholder="Número o título..."
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white"
            >
              <option value="">Todos los estados</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white"
            >
              <option value="">Tipo de documento</option>
              <option value="Manual">Manual</option>
              <option value="Comunicado">Comunicado</option>
            </select>
            <select
              value={filterSystem}
              onChange={e => setFilterSystem(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white"
            >
              <option value="">Sistema</option>
              {systems.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <div className="text-sm font-semibold text-navy-600 mb-3">Solicitudes</div>
            <h3 className="font-semibold text-slate-700 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {requests.length === 0 ? 'Aún no tienes solicitudes' : 'No hay resultados con los filtros aplicados'}
            </h3>
            {requests.length === 0 && (
              <button
                onClick={() => navigate('client.new-request')}
                className="mt-3 px-5 py-2 bg-navy-800 text-white text-sm font-semibold rounded-lg hover:bg-navy-900 transition-colors"
              >
                Crear primera solicitud
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['N° Solicitud', 'Título', 'Tipo', 'Sistema', 'Creada', 'Actualizada', 'Estado', 'Prioridad', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req, i) => (
                    <tr key={req.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-navy-700">{req.number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 max-w-[200px] truncate">{req.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{req.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{req.system.replace('SIESA ', '')}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(req.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(req.updatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} size="sm" /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={req.priority} size="sm" /></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate('client.request', { id: req.id })}
                          className="text-xs font-medium text-navy-600 hover:text-navy-800 hover:underline"
                        >
                          Ver detalle →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {filtered.map(req => (
                <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-semibold text-navy-700">{req.number}</span>
                    <StatusBadge status={req.status} size="sm" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-1 line-clamp-2">{req.title}</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                    <span>{req.type} · {req.system.replace('SIESA ', '')}</span>
                    <span>Creada: {new Date(req.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <PriorityBadge priority={req.priority} size="sm" />
                    <button
                      onClick={() => navigate('client.request', { id: req.id })}
                      className="text-xs font-semibold text-navy-600 hover:text-navy-800"
                    >
                      Ver detalle →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
