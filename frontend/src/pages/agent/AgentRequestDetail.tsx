import { useState } from 'react';
import { useApp } from '../../store/AppContext';
import Layout from '../../components/Layout';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import type { RequestStatus, Priority } from '../../types';

const STATUS_OPTIONS: RequestStatus[] = [
  'Recibida', 'En validación', 'Información adicional requerida',
  'Aprobada', 'En producción', 'Documento disponible', 'Rechazada', 'Cerrada',
];

interface Modal {
  type: 'status' | 'comment' | 'assign' | 'production' | 'publish' | 'link' | null;
}

export default function AgentRequestDetail() {
  const { router, requests, navigate, currentUser, users, documents,
    updateRequestStatus, addComment, assignRequest, sendToProduction, linkDocument, getUserById, getDocumentById } = useApp();

  const id = router.params?.id;
  const req = requests.find(r => r.id === id);

  const [modal, setModal] = useState<Modal>({ type: null });
  const [newStatus, setNewStatus] = useState<RequestStatus>('En validación');
  const [statusComment, setStatusComment] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [prodInstructions, setProdInstructions] = useState('');
  const [prodComment, setProdComment] = useState('');
  const [linkedDocId, setLinkedDocId] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'reject' | 'close' | null>(null);

  if (!req || !currentUser) {
    return (
      <Layout title="Solicitud no encontrada">
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <p>Solicitud no encontrada.</p>
          <button onClick={() => navigate('agent.requests')} className="mt-4 text-navy-600 hover:underline text-sm">← Volver</button>
        </div>
      </Layout>
    );
  }

  const client = getUserById(req.clientId);
  const assignedAgent = req.assignedTo ? getUserById(req.assignedTo) : null;
  const linkedDoc = req.linkedDocumentId ? getDocumentById(req.linkedDocumentId) : null;
  const agents = users.filter(u => u.userRole === 'agente');

  const save = async (fn: () => void) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    fn();
    setSaving(false);
    setModal({ type: null });
    resetForms();
  };

  const resetForms = () => {
    setStatusComment(''); setCommentText(''); setAssignedTo('');
    setEstimatedDate(''); setProdInstructions(''); setProdComment('');
    setLinkedDocId('');
  };

  const handleStatusChange = () => {
    save(() => updateRequestStatus(req.id, newStatus, statusComment, false, currentUser.id));
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    save(() => addComment(req.id, currentUser.id, commentText.trim(), commentInternal));
  };

  const handleAssign = () => {
    save(() => assignRequest(req.id, assignedTo, estimatedDate || undefined));
  };

  const handleSendProduction = () => {
    if (!assignedTo || !estimatedDate) return;
    save(() => sendToProduction(req.id, currentUser.id, assignedTo, estimatedDate, prodInstructions, prodComment || 'Enviada a producción.'));
  };

  const handlePublish = () => {
    if (linkedDocId) {
      save(() => linkDocument(req.id, linkedDocId, true));
      return;
    }
    save(() => updateRequestStatus(req.id, 'Documento disponible', 'El documento solicitado ha sido publicado y está disponible en la biblioteca.', false, currentUser.id));
  };

  const handleConfirmAction = (action: 'reject' | 'close') => {
    const comment = action === 'reject'
      ? 'Solicitud rechazada por el agente.'
      : 'Solicitud cerrada por el agente.';
    const status: RequestStatus = action === 'reject' ? 'Rechazada' : 'Cerrada';
    save(() => updateRequestStatus(req.id, status, comment, false, currentUser.id));
    setConfirmAction(null);
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between text-xs py-2 border-b border-slate-50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium text-right max-w-[180px]">{value}</span>
    </div>
  );

  return (
    <Layout title={req.number}>
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        <button onClick={() => navigate('agent.requests')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5">
          ← Solicitudes
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="font-mono text-sm font-semibold text-navy-700">{req.number}</span>
                <StatusBadge status={req.status} />
                <PriorityBadge priority={req.priority} />
              </div>
              <h1 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>{req.title}</h1>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{req.description}</p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">Motivo de la solicitud</p>
                <p className="text-sm text-slate-700">{req.reason}</p>
              </div>
              {req.productionInstructions && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 mt-3">
                  <p className="text-xs font-medium text-purple-700 mb-1">Instrucciones de producción</p>
                  <p className="text-sm text-purple-800">{req.productionInstructions}</p>
                </div>
              )}
              {linkedDoc && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-emerald-700">Documento vinculado</p>
                    <p className="text-sm text-emerald-800 font-medium">{linkedDoc.title}</p>
                  </div>
                  <button onClick={() => navigate('client.document', { id: linkedDoc.id })} className="text-xs font-semibold text-emerald-700 hover:underline whitespace-nowrap">
                    Ver →
                  </button>
                </div>
              )}
            </div>

            {/* Client info */}
            {client && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>Información del cliente</h3>
                <div className="grid grid-cols-2 gap-x-6">
                  <div>
                    <InfoRow label="Nombre" value={client.name} />
                    <InfoRow label="Correo" value={client.email} />
                    <InfoRow label="Teléfono" value={client.phone} />
                    <InfoRow label="Cargo" value={client.jobTitle} />
                  </div>
                  <div>
                    <InfoRow label="Empresa" value={client.company} />
                    <InfoRow label="NIT" value={client.nit} />
                    <InfoRow label="Sistema" value={client.system} />
                    <InfoRow label="Estado" value={client.status} />
                  </div>
                </div>
              </div>
            )}

            {/* Conversation / History */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>Historial y comunicaciones</h3>

              <div className="space-y-3">
                {req.history.map(entry => (
                  <div key={entry.id} className={`flex gap-3 ${entry.internal ? 'opacity-70' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                      {getUserById(entry.userId)?.avatarInitials ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-700">{getUserById(entry.userId)?.name ?? entry.userId}</span>
                        <span className="text-xs text-slate-400">{new Date(entry.date).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {entry.internal && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Interno</span>}
                      </div>
                      <div className="text-xs font-medium text-slate-600 mt-0.5">
                        Estado → <strong>{entry.newStatus}</strong>
                      </div>
                      {entry.comment && (
                        <p className={`text-sm mt-1 leading-relaxed rounded-lg px-3 py-2 border ${entry.internal ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                          {entry.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {req.comments.map(c => (
                  <div key={c.id} className={`flex gap-3 ${c.internal ? 'opacity-80' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-700 flex-shrink-0">
                      {getUserById(c.userId)?.avatarInitials ?? '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{getUserById(c.userId)?.name}</span>
                        <span className="text-xs text-slate-400">{new Date(c.date).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {c.internal && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Interno</span>}
                      </div>
                      <p className={`text-sm mt-1 leading-relaxed rounded-lg px-3 py-2 border ${c.internal ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-blue-50 border-blue-100 text-slate-700'}`}>
                        {c.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex gap-2 items-center">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={commentInternal} onChange={e => setCommentInternal(e.target.checked)} className="rounded" />
                    Comentario interno (no visible para el cliente)
                  </label>
                </div>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={3}
                  placeholder={commentInternal ? 'Nota interna para el equipo...' : 'Mensaje para el cliente...'}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 resize-none ${commentInternal ? 'border-amber-300 focus:ring-amber-400 bg-amber-50' : 'border-slate-300 focus:ring-navy-600'}`}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddComment}
                    disabled={saving || !commentText.trim()}
                    className="px-4 py-2 bg-navy-800 text-white text-xs font-semibold rounded-lg hover:bg-navy-900 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar — actions */}
          <div className="space-y-4">
            {/* Status management */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>Gestión de estado</h3>
              <div className="space-y-2">
                <button onClick={() => setModal({ type: 'status' })} className="w-full py-2 text-xs font-medium bg-navy-800 text-white rounded-lg hover:bg-navy-900 transition-colors">
                  Cambiar estado
                </button>
                <button onClick={() => setModal({ type: 'assign' })} className="w-full py-2 text-xs font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                  Asignar responsable
                </button>
                {!['En producción', 'Documento disponible', 'Cerrada', 'Rechazada'].includes(req.status) && (
                  <button onClick={() => setModal({ type: 'production' })} className="w-full py-2 text-xs font-medium border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors">
                    Enviar a producción
                  </button>
                )}
                {req.status === 'En producción' && (
                  <button onClick={() => setModal({ type: 'publish' })} className="w-full py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Publicar documento
                  </button>
                )}
                <button onClick={() => setModal({ type: 'link' })} className="w-full py-2 text-xs font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                  Vincular documento
                </button>
              </div>

              {/* Danger zone */}
              {!['Cerrada', 'Rechazada'].includes(req.status) && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  {confirmAction === null ? (
                    <>
                      <button onClick={() => setConfirmAction('reject')} className="w-full py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                        Rechazar solicitud
                      </button>
                      <button onClick={() => setConfirmAction('close')} className="w-full py-2 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        Cerrar solicitud
                      </button>
                    </>
                  ) : (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-red-700 font-medium mb-2">¿Confirmar {confirmAction === 'reject' ? 'rechazo' : 'cierre'}?</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleConfirmAction(confirmAction)} className="flex-1 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Confirmar</button>
                        <button onClick={() => setConfirmAction(null)} className="flex-1 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-white transition-colors">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Request details */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>Detalles</h3>
              <InfoRow label="Tipo doc." value={req.type} />
              <InfoRow label="Tipo sol." value={req.requestType} />
              <InfoRow label="Sistema" value={req.system.replace('SIESA ', '')} />
              <InfoRow label="Aplicativo" value={req.app} />
              <InfoRow label="Versión" value={req.version} />
              <InfoRow label="Año" value={String(req.year)} />
              <InfoRow label="Responsable" value={assignedAgent?.name ?? '—'} />
              <InfoRow label="Fecha estimada" value={req.estimatedDate ? new Date(req.estimatedDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
              <InfoRow label="Creada" value={new Date(req.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })} />
              <InfoRow label="Actualizada" value={new Date(req.updatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })} />
              <InfoRow label="Canal notif." value={req.notificationChannel} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal({ type: null })}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            {/* Change status */}
            {modal.type === 'status' && (
              <>
                <h3 className="text-base font-semibold text-slate-800 mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>Cambiar estado</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nuevo estado</label>
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value as RequestStatus)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Comentario para el cliente</label>
                    <textarea value={statusComment} onChange={e => setStatusComment(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 resize-none" placeholder="Explica el cambio de estado..." />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleStatusChange} disabled={saving} className="flex-1 py-2.5 bg-navy-800 text-white text-sm font-semibold rounded-lg hover:bg-navy-900 transition-colors disabled:opacity-60">
                    {saving ? 'Guardando...' : 'Actualizar estado'}
                  </button>
                  <button onClick={() => setModal({ type: null })} className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancelar</button>
                </div>
              </>
            )}

            {/* Assign */}
            {modal.type === 'assign' && (
              <>
                <h3 className="text-base font-semibold text-slate-800 mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>Asignar responsable</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsable</label>
                    <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                      <option value="">Seleccionar...</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name} — {a.jobTitle}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha estimada de respuesta</label>
                    <input type="date" value={estimatedDate} onChange={e => setEstimatedDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleAssign} disabled={saving || !assignedTo} className="flex-1 py-2.5 bg-navy-800 text-white text-sm font-semibold rounded-lg hover:bg-navy-900 disabled:opacity-60">
                    {saving ? 'Guardando...' : 'Asignar'}
                  </button>
                  <button onClick={() => setModal({ type: null })} className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancelar</button>
                </div>
              </>
            )}

            {/* Send to production */}
            {modal.type === 'production' && (
              <>
                <h3 className="text-base font-semibold text-slate-800 mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>Enviar a producción</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsable / Equipo *</label>
                    <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                      <option value="">Seleccionar...</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha esperada de entrega *</label>
                    <input type="date" value={estimatedDate} onChange={e => setEstimatedDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Instrucciones para producción</label>
                    <textarea value={prodInstructions} onChange={e => setProdInstructions(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 resize-none" placeholder="Qué debe incluir el documento, referencias, etc." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mensaje para el cliente</label>
                    <input type="text" value={prodComment} onChange={e => setProdComment(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600" placeholder="Ej: Tu solicitud está en producción..." />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleSendProduction} disabled={saving || !assignedTo || !estimatedDate} className="flex-1 py-2.5 bg-purple-700 text-white text-sm font-semibold rounded-lg hover:bg-purple-800 disabled:opacity-60">
                    {saving ? 'Enviando...' : 'Enviar a producción'}
                  </button>
                  <button onClick={() => setModal({ type: null })} className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancelar</button>
                </div>
              </>
            )}

            {/* Publish */}
            {modal.type === 'publish' && (
              <>
                <h3 className="text-base font-semibold text-slate-800 mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>Publicar documento</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Vincular con documento de la biblioteca</label>
                    <select value={linkedDocId} onChange={e => setLinkedDocId(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                      <option value="">Seleccionar documento...</option>
                      {documents.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                    </select>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    Al publicar, la solicitud cambiará a &ldquo;Documento disponible&rdquo; y el cliente recibirá una notificación.
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handlePublish} disabled={saving} className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60">
                    {saving ? 'Publicando...' : 'Publicar y notificar'}
                  </button>
                  <button onClick={() => setModal({ type: null })} className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancelar</button>
                </div>
              </>
            )}

            {/* Link document */}
            {modal.type === 'link' && (
              <>
                <h3 className="text-base font-semibold text-slate-800 mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>Vincular documento existente</h3>
                <select value={linkedDocId} onChange={e => setLinkedDocId(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                  <option value="">Seleccionar documento...</option>
                  {documents.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => save(() => { if (linkedDocId) linkDocument(req.id, linkedDocId); })} disabled={saving || !linkedDocId} className="flex-1 py-2.5 bg-navy-800 text-white text-sm font-semibold rounded-lg hover:bg-navy-900 disabled:opacity-60">
                    {saving ? 'Vinculando...' : 'Vincular'}
                  </button>
                  <button onClick={() => setModal({ type: null })} className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
