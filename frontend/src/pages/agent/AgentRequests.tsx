import { useState, useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import Layout from '../../components/Layout';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import type { RequestStatus, Priority } from '../../types';

const ALL_STATUSES: RequestStatus[] = [
  'Recibida', 'En validación', 'Información adicional requerida',
  'Aprobada', 'En producción', 'Documento disponible', 'Rechazada', 'Cerrada',
];

export default function AgentRequests() {
  const { requests, navigate, getUserById, users } = useApp();
  const [filterStatus, setFilterStatus] = useState<RequestStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [filterSystem, setFilterSystem] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [search, setSearch] = useState('');

  const agents = users.filter(u => u.userRole === 'agente');
  const systems = [...new Set(requests.map(r => r.system))];

  const filtered = useMemo(() => {
    let list = [...requests].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    if (filterStatus) list = list.filter(r => r.status === filterStatus);
    if (filterPriority) list = list.filter(r => r.priority === filterPriority);
    if (filterSystem) list = list.filter(r => r.system === filterSystem);
    if (filterAgent) list = list.filter(r => r.assignedTo === filterAgent);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => {
        const client = getUserById(r.clientId);
        return r.number.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          client?.name.toLowerCase().includes(q) ||
          client?.company.toLowerCase().includes(q) ||
          client?.nit.includes(q);
      });
    }
    return list;
  }, [requests, filterStatus, filterPriority, filterSystem, filterAgent, search, getUserById]);

  return (
    <Layout title="Gestión de Solicitudes">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="N° sol., cliente, empresa, NIT..."
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 lg:col-span-2"
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
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as any)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white"
            >
              <option value="">Prioridad</option>
              {(['Alta', 'Media', 'Baja'] as Priority[]).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={filterAgent}
              onChange={e => setFilterAgent(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white"
            >
              <option value="">Responsable</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          {(filterStatus || filterPriority || filterAgent || search) && (
            <button
              onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterAgent(''); setSearch(''); }}
              className="text-xs text-red-600 hover:text-red-800 font-medium mt-2"
            >
              Limpiar filtros ✕
            </button>
          )}
        </div>

        <p className="text-sm text-slate-500 mb-4">{filtered.length} solicitudes</p>

        {/* Desktop table */}
        <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['N° Solicitud', 'Cliente', 'Empresa', 'NIT', 'Sistema', 'Aplicativo', 'Tipo', 'Creada', 'Actualizada', 'Prioridad', 'Estado', 'Responsable', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-3 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((req, i) => {
                const client = getUserById(req.clientId);
                const agent = req.assignedTo ? getUserById(req.assignedTo) : null;
                return (
                  <tr key={req.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-3 py-3">
                      <span className="font-mono text-xs font-semibold text-navy-700">{req.number}</span>
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-slate-800 whitespace-nowrap">{client?.name ?? '-'}</td>
                    <td className="px-3 py-3 text-xs text-slate-600 max-w-[120px] truncate">{client?.company ?? '-'}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{client?.nit ?? '-'}</td>
                    <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{req.system.replace('SIESA ', '')}</td>
                    <td className="px-3 py-3 text-xs text-slate-500 max-w-[100px] truncate">{req.app}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">{req.type}</td>
                    <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(req.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</td>
                    <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(req.updatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</td>
                    <td className="px-3 py-3"><PriorityBadge priority={req.priority} size="sm" /></td>
                    <td className="px-3 py-3"><StatusBadge status={req.status} size="sm" /></td>
                    <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{agent?.name.split(' ')[0] ?? '—'}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => navigate('agent.request', { id: req.id })}
                        className="text-xs font-medium text-navy-600 hover:text-navy-800 hover:underline whitespace-nowrap"
                      >
                        Gestionar →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p>No se encontraron solicitudes</p>
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden space-y-2">
          {filtered.map(req => {
            const client = getUserById(req.clientId);
            return (
              <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-semibold text-navy-700">{req.number}</span>
                  <StatusBadge status={req.status} size="sm" />
                </div>
                <div className="text-sm font-semibold text-slate-800 mb-1 line-clamp-2">{req.title}</div>
                <div className="text-xs text-slate-500">{client?.name} · {client?.company}</div>
                <div className="flex items-center justify-between mt-3">
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
    </Layout>
  );
}
