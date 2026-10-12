import { useMemo, useState } from 'react';
import { useApp } from '../../store/AppContext';
import Layout from '../../components/Layout';
import {
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  DocTypeIcon,
  LayersIcon,
  LockIcon,
  MailIcon,
  PaletteIcon,
  PencilIcon,
  PhoneIcon,
  TagIcon,
  UserIcon,
} from '../../components/Icons';
import { getRecentlyViewedIds } from '../../data/recentlyViewed';
import { SYSTEMS } from '../../data/mockData';
import type { ThemePreference } from '../../types';

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; description: string }> = [
  { value: 'light', label: 'Claro', description: 'Fondo claro, ideal para espacios iluminados.' },
  { value: 'dark', label: 'Oscuro', description: 'Fondo oscuro, menor fatiga visual.' },
  { value: 'system', label: 'Sistema', description: 'Sigue la preferencia de tu dispositivo.' },
];

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-slate-400 flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-medium text-slate-800 break-words">{value || '—'}</div>
      </div>
    </div>
  );
}

function SectionCard({ icon, title, description, children }: { icon: React.ReactNode; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <span className="w-9 h-9 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">{icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>{title}</h3>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function Profile() {
  const { currentUser, documents, navigate, theme, setTheme, updateProfile, changePassword } = useApp();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: '', company: '', jobTitle: '', system: '' });
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', password: '', passwordConfirmation: '' });
  const [passwordStatus, setPasswordStatus] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const recentlyViewed = useMemo(() => {
    if (!currentUser) return [];
    return getRecentlyViewedIds(currentUser.id)
      .map(id => documents.find(d => d.id === id))
      .filter(Boolean) as typeof documents;
  }, [currentUser, documents]);

  if (!currentUser) return null;

  const systemOptions = Array.from(new Set([...SYSTEMS, currentUser.system])).filter(Boolean);

  const startEditing = () => {
    setForm({
      phone: currentUser.phone,
      company: currentUser.company,
      jobTitle: currentUser.jobTitle,
      system: currentUser.system,
    });
    setSavedMessage('');
    setEditing(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const ok = await updateProfile(form);
    setSaving(false);
    if (ok) {
      setEditing(false);
      setSavedMessage('Datos actualizados correctamente.');
    }
  };

  const handlePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordStatus(null);

    if (passwordForm.password !== passwordForm.passwordConfirmation) {
      setPasswordStatus({ kind: 'error', message: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }

    setChangingPassword(true);
    const result = await changePassword(passwordForm);
    setChangingPassword(false);

    if (result.ok) {
      setPasswordForm({ currentPassword: '', password: '', passwordConfirmation: '' });
      setPasswordStatus({ kind: 'ok', message: result.message });
    } else {
      setPasswordStatus({ kind: 'error', message: result.message });
    }
  };

  const identity = [
    { icon: <MailIcon className="w-5 h-5" />, label: 'Correo electrónico', value: currentUser.email },
    { icon: <PhoneIcon className="w-5 h-5" />, label: 'Teléfono', value: currentUser.phone },
    { icon: <BuildingIcon className="w-5 h-5" />, label: 'Empresa', value: currentUser.company },
    { icon: <BriefcaseIcon className="w-5 h-5" />, label: 'Cargo', value: currentUser.jobTitle },
    { icon: <LayersIcon className="w-5 h-5" />, label: 'Sistema asociado', value: currentUser.system },
    { icon: <TagIcon className="w-5 h-5" />, label: 'NIT', value: currentUser.nit },
    { icon: <UserIcon className="w-5 h-5" />, label: 'Rol', value: currentUser.userRole === 'cliente' ? 'Cliente' : 'Agente interno' },
    { icon: <CheckIcon className="w-5 h-5" />, label: 'Estado', value: currentUser.status === 'activo' ? 'Activo' : 'Inactivo' },
    { icon: <CalendarIcon className="w-5 h-5" />, label: 'Fecha de registro', value: new Date(currentUser.registeredAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) },
  ];

  return (
    <Layout title="Mi cuenta">
      <div className="p-4 lg:p-6 w-full space-y-6">
        {/* Encabezado */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-navy-900 to-navy-700 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-navy-800 text-xl font-bold shadow-md">
              {currentUser.avatarInitials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>{currentUser.name}</h2>
              <p className="text-blue-200 text-sm">{currentUser.jobTitle} &middot; {currentUser.company}</p>
              <span className="inline-block mt-1 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                {currentUser.userRole === 'cliente' ? 'Cliente' : 'Agente interno'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información de la cuenta */}
          <div className="lg:col-span-2">
            <SectionCard
              icon={<UserIcon className="w-5 h-5" />}
              title="Información de la cuenta"
              description="Consulta y actualiza tus datos de contacto."
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Datos personales</h4>
                {!editing && (
                  <button onClick={startEditing} className="inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-800 font-medium">
                    <PencilIcon className="w-4 h-4" /> Editar
                  </button>
                )}
              </div>

              {savedMessage && !editing && (
                <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckIcon className="w-4 h-4" /> {savedMessage}
                </div>
              )}

              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">Teléfono</label>
                      <input value={form.phone} onChange={event => setForm(prev => ({ ...prev, phone: event.target.value }))} className="form-control" placeholder="3001234567" />
                    </div>
                    <div>
                      <label className="field-label">Empresa</label>
                      <input value={form.company} onChange={event => setForm(prev => ({ ...prev, company: event.target.value }))} className="form-control" />
                    </div>
                    <div>
                      <label className="field-label">Cargo</label>
                      <input value={form.jobTitle} onChange={event => setForm(prev => ({ ...prev, jobTitle: event.target.value }))} className="form-control" />
                    </div>
                    <div>
                      <label className="field-label">Sistema asociado</label>
                      <select value={form.system} onChange={event => setForm(prev => ({ ...prev, system: event.target.value }))} className="form-control bg-white">
                        {systemOptions.map(option => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">El correo, el NIT y el rol solo pueden modificarse desde el administrador del sistema.</p>
                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={saving} className="primary-button">{saving ? 'Guardando…' : 'Guardar cambios'}</button>
                    <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
                  </div>
                </form>
              ) : (
                <div className="divide-y divide-slate-100">
                  {identity.map(row => <InfoRow key={row.label} icon={row.icon} label={row.label} value={row.value} />)}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            {/* Seguridad */}
            <SectionCard
              icon={<LockIcon className="w-5 h-5" />}
              title="Seguridad"
              description="Actualiza tu contraseña de acceso."
            >
              <form onSubmit={handlePassword} className="space-y-4">
                <div>
                  <label className="field-label">Contraseña actual</label>
                  <input type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={event => setPasswordForm(prev => ({ ...prev, currentPassword: event.target.value }))} className="form-control" />
                </div>
                <div>
                  <label className="field-label">Nueva contraseña</label>
                  <input type="password" autoComplete="new-password" required value={passwordForm.password} onChange={event => setPasswordForm(prev => ({ ...prev, password: event.target.value }))} className="form-control" />
                </div>
                <div>
                  <label className="field-label">Confirmar nueva contraseña</label>
                  <input type="password" autoComplete="new-password" required value={passwordForm.passwordConfirmation} onChange={event => setPasswordForm(prev => ({ ...prev, passwordConfirmation: event.target.value }))} className="form-control" />
                </div>
                {passwordStatus && (
                  <div className={passwordStatus.kind === 'ok' ? 'notice-success' : 'notice-error'}>{passwordStatus.message}</div>
                )}
                <button type="submit" disabled={changingPassword} className="primary-button w-full">{changingPassword ? 'Actualizando…' : 'Cambiar contraseña'}</button>
              </form>
            </SectionCard>

            {/* Apariencia */}
            <SectionCard
              icon={<PaletteIcon className="w-5 h-5" />}
              title="Apariencia"
              description="Elige cómo quieres ver la plataforma."
            >
              <div className="space-y-2">
                {THEME_OPTIONS.map(option => {
                  const active = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      aria-pressed={active}
                      className={`w-full text-left px-3 py-3 rounded-xl border transition-colors ${active ? 'border-navy-600 bg-navy-50' : 'border-slate-200 hover:border-navy-300 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${active ? 'text-navy-800' : 'text-slate-700'}`}>{option.label}</span>
                        {active && <CheckIcon className="w-4 h-4 text-navy-700" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Últimos documentos consultados */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <span className="w-9 h-9 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0"><ClockIcon className="w-5 h-5" /></span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>Últimos documentos consultados</h3>
              <p className="text-xs text-slate-500 mt-0.5">Retoma rápidamente los documentos que abriste recientemente.</p>
            </div>
          </div>
          <div className="p-5">
            {recentlyViewed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ClockIcon className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">Todavía no has consultado documentos.</p>
                <button onClick={() => navigate('client.library')} className="mt-3 text-sm text-navy-600 hover:text-navy-800 font-medium">Explorar la biblioteca →</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {recentlyViewed.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => navigate('client.document', { id: doc.id })}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-navy-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.type === 'Manual' ? 'bg-navy-50' : 'bg-teal-50'}`}>
                      <DocTypeIcon type={doc.type} className={`w-5 h-5 ${doc.type === 'Manual' ? 'text-navy-700' : 'text-teal-700'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800 truncate">{doc.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{doc.type} · {doc.system}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
