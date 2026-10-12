import { useState } from 'react';
import { useApp } from '../../store/AppContext';
import Layout from '../../components/Layout';
import { DocTypeBadge, NewBadge } from '../../components/StatusBadge';
import { SYSTEMS, APPS_BY_SYSTEM, VERSIONS } from '../../data/mockData';
import type { DocType } from '../../types';

type ModalType = 'create' | 'edit' | null;

export default function DocumentAdmin() {
  const { documents, addDocument, updateDocument, navigate } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSystem, setFilterSystem] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [modal, setModal] = useState<ModalType>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState({
    title: '', description: '', type: 'Manual' as DocType,
    system: '', app: '', version: '', year: 2026,
    keywords: '',
    isNew: false, isUpdated: false, active: true,
  });

  const filtered = documents
    .filter(d => {
      if (filterType && d.type !== filterType) return false;
      if (filterSystem && d.system !== filterSystem) return false;
      if (filterActive === 'active' && !d.active) return false;
      if (filterActive === 'inactive' && d.active) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.title.toLowerCase().includes(q) || d.system.toLowerCase().includes(q) || d.app.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const openCreate = () => {
    setForm({ title: '', description: '', type: 'Manual', system: '', app: '', version: '', year: 2026, keywords: '', isNew: true, isUpdated: false, active: true });
    setPdfFile(null);
    setFileError('');
    setUploadProgress(0);
    setEditId(null);
    setModal('create');
  };

  const openEdit = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    setForm({
      title: doc.title, description: doc.description, type: doc.type,
      system: doc.system, app: doc.app, version: doc.version, year: doc.year,
      keywords: doc.keywords.join(', '),
      isNew: doc.isNew ?? false, isUpdated: doc.isUpdated ?? false, active: doc.active,
    });
    setEditId(docId);
    setPdfFile(null);
    setFileError('');
    setUploadProgress(0);
    setModal('edit');
  };

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: val, ...(key === 'system' ? { app: '' } : {}) }));

  const handleSave = async () => {
    if (!form.title || !form.system || !form.app || (modal === 'create' && !pdfFile)) return;
    setSaving(true);
    setFileError('');
    try {
      if (pdfFile) setUploadProgress(60);
      const keywords = form.keywords.split(',').map(k => k.trim()).filter(Boolean);
      const metadata = {
        title: form.title, description: form.description, type: form.type,
        system: form.system, app: form.app, version: form.version, year: form.year,
        keywords, active: form.active,
      };
      const ok = modal === 'create'
        ? await addDocument(metadata, pdfFile)
        : editId ? await updateDocument(editId, metadata, pdfFile) : false;
      if (ok) {
        setUploadProgress(100);
        setModal(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFile = (file?: File) => {
    setFileError('');
    setUploadProgress(0);
    if (!file) return setPdfFile(null);
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfFile(null);
      return setFileError('Archivo no válido. Selecciona únicamente un documento PDF.');
    }
    if (file.size === 0) {
      setPdfFile(null);
      return setFileError('El archivo está vacío o dañado.');
    }
    if (file.size > 25 * 1024 * 1024) {
      setPdfFile(null);
      return setFileError('El archivo supera el límite configurable de 25 MB.');
    }
    setPdfFile(file);
  };

  const handleToggleActive = async (docId: string, active: boolean) => {
    updateDocument(docId, { active: !active });
  };

  const appsForSystem = form.system ? APPS_BY_SYSTEM[form.system] ?? [] : [];

  return (
    <Layout title="Administración de Documentos">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar documentos..."
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 w-48"
            />
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
              <option value="">Tipo</option>
              <option value="Manual">Manual</option>
              <option value="Comunicado">Comunicado</option>
            </select>
            <select value={filterSystem} onChange={e => setFilterSystem(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
              <option value="">Sistema</option>
              {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterActive} onChange={e => setFilterActive(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
              <option value="">Estado</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          <div className="sm:ml-auto">
            <button onClick={openCreate} className="px-4 py-2 bg-navy-800 text-white text-sm font-semibold rounded-lg hover:bg-navy-900 transition-colors shadow-sm whitespace-nowrap">
              + Nuevo documento
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4">{filtered.length} documentos</p>

        {/* Desktop table */}
        <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Título', 'Tipo', 'Sistema', 'Aplicativo', 'Versión', 'Año', 'Publicado', 'Vistas', 'Descargas', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-3 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => (
                <tr key={doc.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-3 py-3 max-w-[200px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-slate-800 truncate">{doc.title}</span>
                      {doc.isNew && <NewBadge label="Nuevo" />}
                      {doc.isUpdated && <NewBadge label="Actualizado" />}
                    </div>
                  </td>
                  <td className="px-3 py-3"><DocTypeBadge type={doc.type} /></td>
                  <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{doc.system.replace('SIESA ', '')}</td>
                  <td className="px-3 py-3 text-xs text-slate-500 max-w-[100px] truncate">{doc.app}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{doc.version}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{doc.year}</td>
                  <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(doc.publishedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                  <td className="px-3 py-3 text-xs text-slate-600 text-right">{doc.views.toLocaleString()}</td>
                  <td className="px-3 py-3 text-xs text-slate-600 text-right">{doc.downloads.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${doc.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {doc.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate('client.document', { id: doc.id })} className="text-xs text-navy-600 hover:underline">Ver</button>
                      <button onClick={() => openEdit(doc.id)} className="text-xs text-slate-600 hover:underline">Editar</button>
                      <button onClick={() => handleToggleActive(doc.id, doc.active)} className={`text-xs hover:underline ${doc.active ? 'text-red-500' : 'text-green-600'}`}>
                        {doc.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden space-y-3">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <DocTypeBadge type={doc.type} />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${doc.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {doc.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-800 mb-1 line-clamp-2">{doc.title}</h4>
              <div className="text-xs text-slate-500 mb-3">{doc.system.replace('SIESA ', '')} · v{doc.version} · {doc.year}</div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                <span>Vistas: {doc.views}</span>
                <span>Descargas: {doc.downloads}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(doc.id)} className="flex-1 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors">Editar</button>
                <button onClick={() => handleToggleActive(doc.id, doc.active)} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${doc.active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                  {doc.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-800 mb-5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {modal === 'create' ? 'Crear documento' : 'Editar documento'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Título *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600" placeholder="Título del documento" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tipo *</label>
                  <select value={form.type} onChange={e => set('type', e.target.value as DocType)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                    <option>Manual</option>
                    <option>Comunicado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sistema *</label>
                  <select value={form.system} onChange={e => set('system', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                    <option value="">Seleccionar...</option>
                    {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Aplicativo *</label>
                  <select value={form.app} onChange={e => set('app', e.target.value)} disabled={!form.system} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white disabled:bg-slate-50">
                    <option value="">Seleccionar...</option>
                    {appsForSystem.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Versión</label>
                  <select value={form.version} onChange={e => set('version', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                    <option value="">—</option>
                    {VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Año</label>
                  <select value={form.year} onChange={e => set('year', Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Palabras clave (separadas por coma)</label>
                <input value={form.keywords} onChange={e => set('keywords', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600" placeholder="ej: nómina, liquidación, configuración" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Documento PDF {modal === 'create' ? '*' : '(nueva versión opcional)'}</label>
                <input type="file" accept="application/pdf,.pdf" onChange={e => handleFile(e.target.files?.[0])} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white" />
                <p className="text-xs text-slate-500 mt-1">Solo PDF · máximo 25 MB · formato y tamaño detectados automáticamente.</p>
                {pdfFile && (
                  <div className="mt-2 p-3 rounded-lg bg-navy-50 border border-navy-100 text-xs text-slate-700">
                    <div className="font-medium">{pdfFile.name}</div>
                    <div className="mt-1">application/pdf · {(pdfFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    {uploadProgress > 0 && <div className="mt-2 h-1.5 rounded-full bg-white overflow-hidden"><div className="h-full bg-navy-600 transition-all" style={{ width: `${uploadProgress}%` }} /></div>}
                  </div>
                )}
                {fileError && <p role="alert" className="text-xs text-red-600 mt-2">{fileError}</p>}
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.isNew} onChange={e => set('isNew', e.target.checked)} className="rounded" /> Etiqueta &ldquo;Nuevo&rdquo;
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.isUpdated} onChange={e => set('isUpdated', e.target.checked)} className="rounded" /> Etiqueta &ldquo;Actualizado&rdquo;
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="rounded" /> Activo
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={handleSave} disabled={saving || !form.title || !form.system || !form.app || (modal === 'create' && !pdfFile)} className="flex-1 py-2.5 bg-navy-800 text-white text-sm font-semibold rounded-lg hover:bg-navy-900 disabled:opacity-60">
                {saving ? `Cargando ${uploadProgress}%` : modal === 'create' ? 'Publicar documento' : 'Guardar nueva versión'}
              </button>
              <button onClick={() => setModal(null)} className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
