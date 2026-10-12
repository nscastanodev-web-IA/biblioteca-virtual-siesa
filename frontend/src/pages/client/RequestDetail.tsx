import { useState } from 'react';
import { useApp } from '../../store/AppContext';
import Layout from '../../components/Layout';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';

function TimelineEntry({ entry, userName }: { entry: any; userName: string }) {
  const styles: Record<string, string> = {
    'Recibida': 'bg-blue-100 text-blue-600',
    'En validación': 'bg-indigo-100 text-indigo-600',
    'Información adicional requerida': 'bg-amber-100 text-amber-600',
    'Aprobada': 'bg-green-100 text-green-600',
    'En producción': 'bg-purple-100 text-purple-600',
    'Documento disponible': 'bg-emerald-100 text-emerald-600',
    'Rechazada': 'bg-red-100 text-red-600',
    'Cerrada': 'bg-slate-100 text-slate-500',
  };
  const cls = styles[entry.newStatus] ?? 'bg-slate-100 text-slate-500';
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${cls}`}>
          ●
        </div>
        <div className="w-px flex-1 bg-slate-200 mt-1" />
      </div>
      <div className="pb-5 pt-0.5 flex-1 min-w-0">
        <div className="text-xs text-slate-500 mb-0.5">
          {new Date(entry.date).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          &ensp;·&ensp;<span className="font-medium text-slate-700">{userName}</span>
        </div>
        <div className="text-sm font-semibold text-slate-800">{entry.newStatus}</div>
        {entry.comment && !entry.internal && (
          <p className="text-sm text-slate-600 mt-1 leading-relaxed bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
            {entry.comment}
          </p>
        )}
      </div>
    </div>
  );
}

export default function RequestDetail() {
  const { router, requests, navigate, currentUser, addComment, cancelRequest, getUserById, getDocumentById } = useApp();
  const id = router.params?.id;
  const req = requests.find(r => r.id === id);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!req || !currentUser) {
    return (
      <Layout title="Solicitud no encontrada">
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <p>Solicitud no encontrada.</p>
          <button onClick={() => navigate('client.requests')} className="mt-4 text-navy-600 hover:underline text-sm">← Volver</button>
        </div>
      </Layout>
    );
  }

  const assignedUser = req.assignedTo ? getUserById(req.assignedTo) : null;
  const linkedDoc = req.linkedDocumentId ? getDocumentById(req.linkedDocumentId) : null;
  const canReply = !['Cerrada', 'Rechazada'].includes(req.status);
  const canCancel = !['Cerrada', 'Rechazada', 'En producción', 'Documento disponible'].includes(req.status);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 500));
    addComment(req.id, currentUser.id, replyText.trim(), false);
    setReplyText('');
    setSending(false);
  };

  const handleCancel = () => {
    cancelRequest(req.id);
    setConfirmCancel(false);
  };

  const visibleHistory = req.history.filter(h => !h.internal);
  const visibleComments = req.comments.filter(c => !c.internal);

  return (
    <Layout title={req.number}>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <button onClick={() => navigate('client.requests')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5">
          ← Mis solicitudes
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="font-mono text-sm font-semibold text-navy-700">{req.number}</span>
                <StatusBadge status={req.status} />
                <PriorityBadge priority={req.priority} />
              </div>
              <h1 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>{req.title}</h1>
              <p className="text-sm text-slate-600 leading-relaxed">{req.description}</p>

              {req.status === 'Documento disponible' && linkedDoc && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 text-lg">✅</span>
                    <div>
                      <div className="text-sm font-semibold text-emerald-800">Documento disponible</div>
                      <div className="text-xs text-emerald-700">{linkedDoc.title}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('client.document', { id: linkedDoc.id })}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
                  >
                    Ver documento →
                  </button>
                </div>
              )}

              {req.status === 'Información adicional requerida' && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-sm font-semibold text-amber-800 mb-1">⚠ Información requerida</div>
                  <div className="text-xs text-amber-700">El agente necesita información adicional de tu parte. Usa el campo de respuesta más abajo.</div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-5" style={{ fontFamily: 'DM Sans, sans-serif' }}>Historial del proceso</h3>
              <div>
                {visibleHistory.map((entry, i) => (
                  <TimelineEntry
                    key={entry.id}
                    entry={entry}
                    userName={getUserById(entry.userId)?.name ?? entry.userId}
                  />
                ))}
                {visibleComments.length > 0 && visibleComments.map(c => (
                  <div key={c.id} className="flex gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-700 flex-shrink-0">
                      {getUserById(c.userId)?.avatarInitials ?? '?'}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 mb-0.5">
                        {new Date(c.date).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        &ensp;·&ensp;<span className="font-medium text-slate-700">{getUserById(c.userId)?.name}</span>
                      </div>
                      <p className="text-sm text-slate-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
                        {c.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              {canReply && (
                <div className="mt-2 border-t border-slate-100 pt-4">
                  <p className="text-xs font-medium text-slate-600 mb-2">Responder o enviar información adicional</p>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 resize-none"
                    placeholder="Escribe tu mensaje aquí..."
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleReply}
                      disabled={sending || !replyText.trim()}
                      className="px-4 py-2 bg-navy-800 text-white text-xs font-semibold rounded-lg hover:bg-navy-900 transition-colors disabled:opacity-50"
                    >
                      {sending ? 'Enviando...' : 'Enviar respuesta'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>Detalles</h3>
              <dl className="space-y-3">
                {[
                  { label: 'Tipo de doc.', value: req.type },
                  { label: 'Tipo solicitud', value: req.requestType },
                  { label: 'Sistema', value: req.system.replace('SIESA ', '') },
                  { label: 'Aplicativo', value: req.app },
                  { label: 'Versión', value: req.version },
                  { label: 'Año', value: String(req.year) },
                  { label: 'Motivo', value: req.reason },
                ].map(({ label, value }) => (
                  <div key={label} className="text-xs">
                    <span className="text-slate-500 block">{label}</span>
                    <span className="text-slate-800 font-medium">{value}</span>
                  </div>
                ))}
                {assignedUser && (
                  <div className="text-xs">
                    <span className="text-slate-500 block">Responsable</span>
                    <span className="text-slate-800 font-medium">{assignedUser.name}</span>
                  </div>
                )}
                {req.estimatedDate && (
                  <div className="text-xs">
                    <span className="text-slate-500 block">Fecha estimada</span>
                    <span className="text-slate-800 font-medium">{new Date(req.estimatedDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
                <div className="text-xs">
                  <span className="text-slate-500 block">Creada</span>
                  <span className="text-slate-800 font-medium">{new Date(req.createdAt).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </dl>
            </div>

            {canCancel && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                {!confirmCancel ? (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancelar solicitud
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-700 font-medium">¿Seguro que deseas cancelar esta solicitud?</p>
                    <div className="flex gap-2">
                      <button onClick={handleCancel} className="flex-1 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Confirmar</button>
                      <button onClick={() => setConfirmCancel(false)} className="flex-1 py-2 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">No</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
