import { useState, useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import { documentFileUrl } from '../../services/api';
import Layout from '../../components/Layout';
import { DocTypeBadge, NewBadge } from '../../components/StatusBadge';
import { SYSTEMS, APPS_BY_SYSTEM, VERSIONS } from '../../data/mockData';
import type { DocType, DocFormat } from '../../types';

const YEARS = [2024, 2025, 2026];

interface Filters {
  type: DocType | '';
  system: string;
  app: string;
  version: string;
  year: string;
  format: DocFormat | '';
  sort: 'date' | 'relevance' | 'downloads';
}

const initFilters: Filters = { type: '', system: '', app: '', version: '', year: '', format: '', sort: 'date' };

export default function Library() {
  const { documents, navigate } = useApp();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(initFilters);
  const [showFilters, setShowFilters] = useState(false);

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: val, ...(key === 'system' ? { app: '' } : {}) }));
  };

  const hasFilters = Object.entries(filters).some(([k, v]) => k !== 'sort' && v !== '');

  const filtered = useMemo(() => {
    let list = documents.filter(d => d.active);

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.system.toLowerCase().includes(q) ||
        d.app.toLowerCase().includes(q) ||
        d.keywords.some(k => k.toLowerCase().includes(q))
      );
    }
    if (filters.type) list = list.filter(d => d.type === filters.type);
    if (filters.system) list = list.filter(d => d.system === filters.system);
    if (filters.app) list = list.filter(d => d.app === filters.app);
    if (filters.version) list = list.filter(d => d.version === filters.version);
    if (filters.year) list = list.filter(d => d.year === Number(filters.year));
    if (filters.format) list = list.filter(d => d.format === filters.format);

    if (filters.sort === 'date') list = [...list].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    else if (filters.sort === 'downloads') list = [...list].sort((a, b) => b.downloads - a.downloads);

    return list;
  }, [documents, query, filters]);

  const appsForSystem = filters.system ? APPS_BY_SYSTEM[filters.system] ?? [] : [];

  return (
    <Layout title="Biblioteca de Documentos">
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        {/* Search bar */}
        <div className="mb-4 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre, sistema, aplicativo o palabras clave..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg">✕</button>
          )}
        </div>

        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'border-navy-600 bg-navy-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2" />
            </svg>
            Filtros {hasFilters && <span className="bg-white/30 text-xs rounded-full px-1.5 py-0.5">{Object.values(filters).filter((v, i) => i < 6 && v).length}</span>}
          </button>

          {/* Quick type filter */}
          {(['Manual', 'Comunicado'] as DocType[]).map(t => (
            <button
              key={t}
              onClick={() => setFilter('type', filters.type === t ? '' : t)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${filters.type === t ? 'border-navy-600 bg-navy-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}
            >
              {t}
            </button>
          ))}

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-slate-500">Ordenar:</span>
            <select
              value={filters.sort}
              onChange={e => setFilter('sort', e.target.value as Filters['sort'])}
              className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-600"
            >
              <option value="date">Más recientes</option>
              <option value="downloads">Más descargados</option>
              <option value="relevance">Relevancia</option>
            </select>
          </div>

          {hasFilters && (
            <button onClick={() => setFilters(initFilters)} className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1.5">
              Limpiar filtros ✕
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sistema</label>
                <select value={filters.system} onChange={e => setFilter('system', e.target.value)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-navy-600">
                  <option value="">Todos</option>
                  {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Aplicativo</label>
                <select value={filters.app} onChange={e => setFilter('app', e.target.value)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-navy-600" disabled={!filters.system}>
                  <option value="">Todos</option>
                  {appsForSystem.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Versión</label>
                <select value={filters.version} onChange={e => setFilter('version', e.target.value)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-navy-600">
                  <option value="">Todas</option>
                  {VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Año</label>
                <select value={filters.year} onChange={e => setFilter('year', e.target.value)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-navy-600">
                  <option value="">Todos</option>
                  {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Formato</label>
                <select value={filters.format} onChange={e => setFilter('format', e.target.value as any)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-navy-600">
                  <option value="">Todos</option>
                  {['PDF', 'DOCX', 'XLSX'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-slate-500 mb-4">
          {filtered.length} {filtered.length === 1 ? 'documento encontrado' : 'documentos encontrados'}
          {query && <span> para <strong>&ldquo;{query}&rdquo;</strong></span>}
        </p>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <div className="text-sm font-semibold text-navy-600 mb-4">Sin resultados</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              No encontramos un documento que coincida con tu búsqueda
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Puedes solicitar la creación o actualización de un documento.
            </p>
            <button
              onClick={() => navigate('client.new-request')}
              className="px-6 py-2.5 bg-navy-800 text-white font-semibold text-sm rounded-xl hover:bg-navy-900 transition-colors shadow-md"
            >
              Solicitar documento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(doc => (
              <div key={doc.id} className="bg-white rounded-xl border border-slate-200 hover:border-navy-300 hover:shadow-md transition-all flex flex-col">
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <DocTypeBadge type={doc.type} />
                      {doc.isNew && <NewBadge label="Nuevo" />}
                      {doc.isUpdated && <NewBadge label="Actualizado" />}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{doc.format}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-1 line-clamp-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {doc.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{doc.description}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                    <div><span className="text-slate-400">Sistema:</span> {doc.system.replace('SIESA ', '')}</div>
                    <div><span className="text-slate-400">Versión:</span> {doc.version}</div>
                    <div><span className="text-slate-400">Año:</span> {doc.year}</div>
                    <div><span className="text-slate-400">Tamaño:</span> {doc.fileSize}</div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Publicado: {new Date(doc.publishedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {doc.updatedAt !== doc.publishedAt && (
                      <span className="ml-2 text-amber-600">· Actualizado: {new Date(doc.updatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => navigate('client.document', { id: doc.id })}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-navy-800 text-white hover:bg-navy-900 transition-colors"
                  >
                    Ver documento
                  </button>
                  <button
                    onClick={() => window.open(documentFileUrl(doc.id, 'download'), '_blank', 'noopener')}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
