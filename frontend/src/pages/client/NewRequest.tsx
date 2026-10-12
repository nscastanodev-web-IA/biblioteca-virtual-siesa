import { useState } from 'react';
import { useApp } from '../../store/AppContext';
import Layout from '../../components/Layout';
import { SYSTEMS, APPS_BY_SYSTEM, VERSIONS } from '../../data/mockData';
import type { DocType, RequestType, Priority, NotificationChannel } from '../../types';

const YEARS = [2024, 2025, 2026];

interface FormData {
  type: DocType;
  requestType: RequestType;
  system: string;
  app: string;
  version: string;
  year: number;
  title: string;
  description: string;
  reason: string;
  priority: Priority;
  notificationChannel: NotificationChannel;
  confirmed: boolean;
}

const initForm: FormData = {
  type: 'Manual',
  requestType: 'Documento nuevo',
  system: '',
  app: '',
  version: '',
  year: 2026,
  title: '',
  description: '',
  reason: '',
  priority: 'Media',
  notificationChannel: 'ambos',
  confirmed: false,
};

export default function NewRequest() {
  const { currentUser, createRequest, navigate } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ number: string } | null>(null);

  if (!currentUser) return null;

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: val, ...(key === 'system' ? { app: '' } : {}) }));

  const appsForSystem = form.system ? APPS_BY_SYSTEM[form.system] ?? [] : [];

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.type) e.type = 'Selecciona el tipo';
    if (!form.requestType) e.requestType = 'Selecciona el tipo de solicitud';
    if (!form.system) e.system = 'Selecciona un sistema';
    if (!form.app) e.app = 'Selecciona un aplicativo';
    if (!form.version) e.version = 'Selecciona una versión';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'El título es requerido';
    if (form.title.trim().length < 10) e.title = 'El título debe tener al menos 10 caracteres';
    if (!form.description.trim()) e.description = 'La descripción es requerida';
    if (form.description.trim().length < 30) e.description = 'Describe la necesidad con más detalle (mínimo 30 caracteres)';
    if (!form.reason.trim()) e.reason = 'El motivo es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!form.confirmed) { setErrors({ confirmed: 'Debes confirmar la información' }); return; }
    setSubmitting(true);
    try {
      const req = await createRequest({
        clientId: currentUser.id,
        type: form.type,
        requestType: form.requestType,
        system: form.system,
        app: form.app,
        version: form.version,
        year: form.year,
        title: form.title,
        description: form.description,
        reason: form.reason,
        priority: form.priority,
        notificationChannel: form.notificationChannel,
      });
      setCreated({ number: req.number });
    } catch (caught) {
      setErrors({ confirmed: caught instanceof Error ? caught.message : 'No fue posible enviar la solicitud.' });
    } finally {
      setSubmitting(false);
    }
  };

  const Label = ({ children, error }: { children: React.ReactNode; error?: string }) => (
    <div>
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
      {children}
    </div>
  );

  if (created) {
    return (
      <Layout title="Solicitud creada">
        <div className="p-4 lg:p-6 max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              ¡Solicitud enviada!
            </h2>
            <p className="text-slate-500 text-sm mb-1">Tu solicitud ha sido registrada con el número:</p>
            <div className="font-mono text-lg font-bold text-navy-700 my-3 bg-navy-50 px-4 py-2 rounded-lg inline-block">
              {created.number}
            </div>
            <p className="text-slate-500 text-sm mb-2">Estado inicial: <strong>Recibida</strong></p>
            <p className="text-slate-500 text-sm mb-1">Se ha simulado el envío de una notificación por correo electrónico a:</p>
            <p className="text-slate-700 text-sm font-medium mb-6">{currentUser.email}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('client.requests')}
                className="flex-1 py-2.5 bg-navy-800 text-white font-semibold text-sm rounded-xl hover:bg-navy-900 transition-colors"
              >
                Ver mis solicitudes
              </button>
              <button
                onClick={() => { setForm(initForm); setCreated(null); setStep(1); }}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors"
              >
                Nueva solicitud
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Nueva Solicitud de Documento">
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <button onClick={() => navigate('client.requests')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5">
          ← Cancelar
        </button>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-navy-800 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 w-12 transition-colors ${step > s ? 'bg-navy-800' : 'bg-slate-200'}`} />}
            </div>
          ))}
          <div className="ml-2 text-sm text-slate-500">
            {step === 1 ? 'Clasificación' : step === 2 ? 'Descripción' : 'Confirmación'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          {/* Step 1: Classification */}
          {step === 1 && (
            <div className="p-6 space-y-5">
              <h2 className="text-base font-semibold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>Datos de la solicitud</h2>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Datos del solicitante</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  {[
                    ['Nombre', currentUser.name],
                    ['Correo', currentUser.email],
                    ['Teléfono', currentUser.phone],
                    ['Empresa', currentUser.company],
                    ['NIT', currentUser.nit],
                    ['Cargo', currentUser.jobTitle],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <span className="text-slate-500">{l}: </span>
                      <span className="text-slate-800 font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de documento *</label>
                  <div className="flex gap-2">
                    {(['Manual', 'Comunicado'] as DocType[]).map(t => (
                      <button key={t} type="button" onClick={() => set('type', t)} className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${form.type === t ? 'border-navy-600 bg-navy-600 text-white' : 'border-slate-300 text-slate-700 hover:border-slate-400'}`}>{t}</button>
                    ))}
                  </div>
                  {errors.type && <p className="text-xs text-red-600 mt-0.5">{errors.type}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de solicitud *</label>
                  <select value={form.requestType} onChange={e => set('requestType', e.target.value as RequestType)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                    {(['Documento nuevo', 'Actualización', 'Corrección'] as RequestType[]).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.requestType && <p className="text-xs text-red-600 mt-0.5">{errors.requestType}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Sistema *</label>
                  <select value={form.system} onChange={e => set('system', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                    <option value="">Seleccionar...</option>
                    {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.system && <p className="text-xs text-red-600 mt-0.5">{errors.system}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Aplicativo *</label>
                  <select value={form.app} onChange={e => set('app', e.target.value)} disabled={!form.system} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white disabled:bg-slate-50 disabled:text-slate-400">
                    <option value="">Seleccionar...</option>
                    {appsForSystem.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {errors.app && <p className="text-xs text-red-600 mt-0.5">{errors.app}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Versión *</label>
                  <select value={form.version} onChange={e => set('version', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                    <option value="">Seleccionar...</option>
                    {VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  {errors.version && <p className="text-xs text-red-600 mt-0.5">{errors.version}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Año</label>
                  <select value={form.year} onChange={e => set('year', Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Prioridad</label>
                  <div className="flex gap-2">
                    {(['Baja', 'Media', 'Alta'] as Priority[]).map(p => (
                      <button key={p} type="button" onClick={() => set('priority', p)}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${form.priority === p
                          ? p === 'Alta' ? 'border-red-500 bg-red-500 text-white' : p === 'Media' ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-500 bg-slate-500 text-white'
                          : 'border-slate-300 text-slate-700 hover:border-slate-400'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Notificar por</label>
                  <select value={form.notificationChannel} onChange={e => set('notificationChannel', e.target.value as NotificationChannel)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white">
                    <option value="aplicación">Aplicación</option>
                    <option value="correo">Correo electrónico</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Description */}
          {step === 2 && (
            <div className="p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>Descripción de la necesidad</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Título sugerido *</label>
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Manual de configuración de nómina para el año 2026" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600" />
                {errors.title && <p className="text-xs text-red-600 mt-0.5">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción detallada de la necesidad *</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Describe qué necesitas, qué proceso o funcionalidad cubre el documento solicitado..." className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 resize-none" />
                {errors.description && <p className="text-xs text-red-600 mt-0.5">{errors.description}</p>}
                <p className="text-xs text-slate-400 mt-0.5">{form.description.length} caracteres</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Motivo de la solicitud *</label>
                <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={2} placeholder="¿Por qué necesitas este documento? ¿Qué impacto tiene su ausencia?" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 resize-none" />
                {errors.reason && <p className="text-xs text-red-600 mt-0.5">{errors.reason}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Archivos de referencia (opcional)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-400">
                  <div className="text-sm font-semibold text-navy-600 mb-1">Adjuntar archivo</div>
                  <p className="text-sm">Arrastra archivos aquí o <span className="text-navy-600 cursor-pointer hover:underline">selecciona</span></p>
                  <p className="text-xs mt-1">PDF, DOCX, PNG, JPG (máx. 10 MB)</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="p-6 space-y-5">
              <h2 className="text-base font-semibold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>Resumen de la solicitud</h2>

              <div className="bg-slate-50 rounded-lg border border-slate-200 divide-y divide-slate-200">
                <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-slate-500 text-xs">Solicitante</span><div className="font-medium text-slate-800">{currentUser.name}</div></div>
                  <div><span className="text-slate-500 text-xs">Empresa</span><div className="font-medium text-slate-800">{currentUser.company}</div></div>
                  <div><span className="text-slate-500 text-xs">Tipo de documento</span><div className="font-medium text-slate-800">{form.type}</div></div>
                  <div><span className="text-slate-500 text-xs">Tipo de solicitud</span><div className="font-medium text-slate-800">{form.requestType}</div></div>
                  <div><span className="text-slate-500 text-xs">Sistema</span><div className="font-medium text-slate-800">{form.system}</div></div>
                  <div><span className="text-slate-500 text-xs">Aplicativo</span><div className="font-medium text-slate-800">{form.app}</div></div>
                  <div><span className="text-slate-500 text-xs">Versión</span><div className="font-medium text-slate-800">{form.version}</div></div>
                  <div><span className="text-slate-500 text-xs">Prioridad</span><div className="font-medium text-slate-800">{form.priority}</div></div>
                </div>
                <div className="px-4 py-3">
                  <span className="text-slate-500 text-xs">Título sugerido</span>
                  <div className="font-medium text-slate-800 text-sm mt-0.5">{form.title}</div>
                </div>
                <div className="px-4 py-3">
                  <span className="text-slate-500 text-xs">Descripción</span>
                  <div className="text-slate-700 text-sm mt-0.5 leading-relaxed">{form.description}</div>
                </div>
                <div className="px-4 py-3">
                  <span className="text-slate-500 text-xs">Motivo</span>
                  <div className="text-slate-700 text-sm mt-0.5">{form.reason}</div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.confirmed} onChange={e => set('confirmed', e.target.checked)} className="mt-0.5 rounded" />
                <span className="text-sm text-slate-700">Confirmo que la información proporcionada es correcta y autorizo el procesamiento de mi solicitud.</span>
              </label>
              {errors.confirmed && <p className="text-xs text-red-600">{errors.confirmed}</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="px-6 pb-6 flex justify-between">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                ← Anterior
              </button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <button onClick={nextStep} className="px-5 py-2 bg-navy-800 text-white text-sm font-semibold rounded-lg hover:bg-navy-900 transition-colors">
                Siguiente →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60">
                {submitting ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
