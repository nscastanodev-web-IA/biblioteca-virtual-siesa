import { useApp } from '../../store/AppContext';
import Layout from '../../components/Layout';
import { ComunicadoIcon, DocTypeIcon, ManualIcon, RequestIcon } from '../../components/Icons';
import { getRecentlyViewedIds } from '../../data/recentlyViewed';

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="text-2xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif' }}>{value}</div>
      <div className="text-sm mt-0.5 opacity-80">{label}</div>
    </div>
  );
}

export default function ClientDashboard() {
  const { currentUser, navigate, documents, getClientRequests } = useApp();
  if (!currentUser) return null;

  const myRequests = getClientRequests(currentUser.id);
  const recentlyViewed = getRecentlyViewedIds(currentUser.id)
    .map(id => documents.find(d => d.id === id))
    .filter(Boolean) as typeof documents;

  const recommended = documents
    .filter(d => d.system === currentUser.system && d.active)
    .slice(0, 3);

  const latest = [...documents]
    .filter(d => d.active)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 4);

  const statusCounts = {
    recibida: myRequests.filter(r => r.status === 'Recibida').length,
    proceso: myRequests.filter(r => ['En validación', 'Aprobada', 'En producción'].includes(r.status)).length,
    disponible: myRequests.filter(r => r.status === 'Documento disponible').length,
    cerrada: myRequests.filter(r => ['Cerrada', 'Rechazada'].includes(r.status)).length,
  };

  return (
    <Layout title="Inicio">
      <div className="p-4 lg:p-6 space-y-6 w-full">
        {/* Welcome */}
        <div className="rounded-2xl overflow-hidden relative"
          style={{ background: 'linear-gradient(120deg, #0f1e38 0%, #1b3a6b 60%, #2558cc 100%)' }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-white/5" />
          </div>
          <div className="relative px-6 py-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1">Bienvenido de vuelta</p>
                <h2 className="text-xl lg:text-2xl font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Hola, {currentUser.name.split(' ')[0]}
                </h2>
                <p className="text-blue-200 text-sm mt-1">
                  {currentUser.company} &middot; {currentUser.system}
                </p>
              </div>
              <button
                onClick={() => navigate('client.library')}
                className="flex-shrink-0 bg-white text-navy-800 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shadow-md"
              >
                Ir a la Biblioteca →
              </button>
            </div>

            {/* Search bar */}
            <div className="mt-5">
              <button
                onClick={() => navigate('client.library')}
                className="w-full bg-white/15 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-3 text-left text-blue-200 text-sm transition-colors backdrop-blur-sm"
              >
                ¿Qué documento necesitas consultar?
              </button>
            </div>
          </div>
        </div>

        {/* Quick access */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Manuales', Icon: ManualIcon, page: 'client.library' as const, color: 'bg-navy-50 text-navy-800 border-navy-200' },
            { label: 'Comunicados', Icon: ComunicadoIcon, page: 'client.library' as const, color: 'bg-teal-50 text-teal-800 border-teal-200' },
            { label: 'Solicitudes', Icon: RequestIcon, page: 'client.requests' as const, color: 'bg-amber-50 text-amber-800 border-amber-200' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.page)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border font-medium text-sm transition-all hover:shadow-md ${item.color}`}
            >
              <item.Icon className="w-7 h-7" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recently viewed */}
            {recentlyViewed.length > 0 && (
              <section>
                <h3 className="text-base font-semibold text-slate-800 mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Consultados recientemente
                </h3>
                <div className="space-y-2">
                  {recentlyViewed.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => navigate('client.document', { id: doc.id })}
                      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-navy-300 hover:shadow-sm transition-all text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <DocTypeIcon type={doc.type} className={`w-5 h-5 ${doc.type === 'Manual' ? 'text-navy-700' : 'text-teal-700'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-800 truncate">{doc.title}</div>
                        <div className="text-xs text-slate-500">{doc.system} · {doc.type}</div>
                      </div>
                      <span className="text-slate-400 text-sm flex-shrink-0">→</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Latest documents */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Últimos publicados
                </h3>
                <button onClick={() => navigate('client.library')} className="text-sm text-navy-600 hover:text-navy-800 font-medium">
                  Ver todos →
                </button>
              </div>
              <div className="space-y-2">
                {latest.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => navigate('client.document', { id: doc.id })}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-navy-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.type === 'Manual' ? 'bg-navy-50' : 'bg-teal-50'}`}>
                      <DocTypeIcon type={doc.type} className={`w-5 h-5 ${doc.type === 'Manual' ? 'text-navy-700' : 'text-teal-700'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800 truncate">{doc.title}</span>
                        {doc.isNew && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Nuevo</span>}
                        {doc.isUpdated && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Actualizado</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{doc.system} · {new Date(doc.publishedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <span className="text-slate-400 text-sm flex-shrink-0">→</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Request summary */}
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Mis solicitudes
                </h3>
                <button onClick={() => navigate('client.requests')} className="text-xs text-navy-600 hover:text-navy-800 font-medium">
                  Ver todas →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Recibidas" value={statusCounts.recibida} color="bg-blue-50 text-blue-800" />
                <StatCard label="En proceso" value={statusCounts.proceso} color="bg-purple-50 text-purple-800" />
                <StatCard label="Disponibles" value={statusCounts.disponible} color="bg-green-50 text-green-800" />
                <StatCard label="Cerradas" value={statusCounts.cerrada} color="bg-slate-100 text-slate-700" />
              </div>
              <button
                onClick={() => navigate('client.new-request')}
                className="w-full mt-4 py-2 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-900 transition-colors"
              >
                + Nueva solicitud
              </button>
            </section>

            {/* Recommended */}
            {recommended.length > 0 && (
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Recomendados para ti
                </h3>
                <div className="space-y-2">
                  {recommended.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => navigate('client.document', { id: doc.id })}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="text-xs font-medium text-slate-800 line-clamp-2">{doc.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{doc.type} · v{doc.version}</div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
