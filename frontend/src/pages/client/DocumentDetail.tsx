import { useEffect, useState } from 'react';
import { useApp } from '../../store/AppContext';
import { documentFileUrl } from '../../services/api';
import { recordDocumentView } from '../../data/recentlyViewed';
import Layout from '../../components/Layout';
import { DocTypeBadge, NewBadge } from '../../components/StatusBadge';

export default function DocumentDetail() {
  const { router, documents, navigate, currentUser } = useApp();
  const id = router.params?.id;
  const doc = documents.find(d => d.id === id);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentUser && doc) recordDocumentView(currentUser.id, doc.id);
  }, [currentUser, doc]);

  if (!doc) {
    return (
      <Layout title="Documento no encontrado">
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <div className="text-sm font-semibold text-navy-600 mb-3">Documento PDF</div>
          <p>Documento no encontrado.</p>
          <button onClick={() => navigate('client.library')} className="mt-4 text-navy-600 hover:underline text-sm">← Volver a la biblioteca</button>
        </div>
      </Layout>
    );
  }

  const related = doc.relatedDocIds.map(rid => documents.find(d => d.id === rid)).filter(Boolean) as typeof documents;

  const handleDownload = () => {
    window.open(documentFileUrl(doc.id, 'download'), '_blank', 'noopener');
  };

  const handleShare = async () => {
    const path = documentFileUrl(doc.id, 'preview');
    const link = /^https?:/i.test(path) ? path : `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Si el navegador bloquea el portapapeles, igual mostramos la señal visual.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout title={doc.title}>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <button onClick={() => navigate('client.library')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5">
          ← Volver a la biblioteca
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <DocTypeBadge type={doc.type} />
                {doc.isNew && <NewBadge label="Nuevo" />}
                {doc.isUpdated && <NewBadge label="Actualizado" />}
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{doc.format}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {doc.title}
              </h1>
              <p className="text-slate-600 text-sm leading-relaxed">{doc.description}</p>

              <div className="flex flex-wrap gap-1.5 mt-4">
                {doc.keywords.map(kw => (
                  <span key={kw} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{kw}</span>
                ))}
              </div>
            </div>

            {/* Preview area */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-semibold text-slate-700" style={{ fontFamily: 'DM Sans, sans-serif' }}>Vista previa</span>
                  <span className="text-xs text-slate-400 ml-2">{doc.format} · {doc.fileSize}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={documentFileUrl(doc.id, 'preview')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Abrir en pestaña
                  </a>
                  <button
                    onClick={handleDownload}
                    className="px-5 py-2 bg-navy-800 text-white text-sm font-semibold rounded-lg hover:bg-navy-900 transition-colors flex items-center gap-2 shadow-md"
                  >
                    ↓ Descargar
                  </button>
                  <button
                    onClick={handleShare}
                    className="px-4 py-2 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {copied ? '✓ Enlace copiado' : '⬡ Compartir'}
                  </button>
                </div>
              </div>
              <div className="bg-slate-100">
                <iframe
                  key={doc.id}
                  src={`${documentFileUrl(doc.id, 'preview')}#view=FitH&toolbar=1`}
                  title={`Vista previa de ${doc.title}`}
                  className="w-full h-[70vh] min-h-[520px] bg-white border-0"
                />
              </div>
              <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                ¿No puedes visualizar el documento?{' '}
                <a
                  href={documentFileUrl(doc.id, 'preview')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy-600 hover:text-navy-800 font-medium"
                >
                  Ábrelo en una nueva pestaña
                </a>{' '}
                o descárgalo.
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-700 mb-3">¿Este documento te fue útil?</p>
              {feedback === null ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setFeedback('yes')}
                    className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => setFeedback('no')}
                    className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : feedback === 'yes' ? (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  ✓ ¡Gracias por tu comentario!
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                    Lamentamos que no haya sido útil.
                  </div>
                  <button
                    onClick={() => navigate('client.new-request')}
                    className="text-sm text-navy-600 hover:text-navy-800 font-medium"
                  >
                    → Solicitar actualización del documento
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>Información</h3>
              <dl className="space-y-3">
                {[
                  { label: 'Tipo', value: doc.type },
                  { label: 'Sistema', value: doc.system },
                  { label: 'Aplicativo', value: doc.app },
                  { label: 'Versión', value: doc.version },
                  { label: 'Año', value: String(doc.year) },
                  { label: 'Formato', value: doc.format },
                  { label: 'Tamaño', value: doc.fileSize },
                  { label: 'Publicado', value: new Date(doc.publishedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) },
                  { label: 'Actualizado', value: new Date(doc.updatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">{label}</span>
                    <span className="text-slate-800 font-medium text-right max-w-[140px]">{value}</span>
                  </div>
                ))}
              </dl>
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>{doc.views}</div>
                  <div className="text-xs text-slate-500">Vistas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>{doc.downloads}</div>
                  <div className="text-xs text-slate-500">Descargas</div>
                </div>
              </div>
            </div>

            {/* Related documents */}
            {related.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>Documentos relacionados</h3>
                <div className="space-y-2">
                  {related.map(rd => (
                    <button
                      key={rd.id}
                      onClick={() => navigate('client.document', { id: rd.id })}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-navy-200 hover:bg-navy-50 transition-colors"
                    >
                      <div className="text-xs font-medium text-slate-800 line-clamp-2">{rd.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{rd.type} · {rd.format}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
