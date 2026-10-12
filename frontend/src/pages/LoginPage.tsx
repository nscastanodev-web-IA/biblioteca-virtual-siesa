import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { authApi } from '../services/api';
import type { RegistrationData } from '../types';

type View = 'login' | 'register' | 'forgot';

const EMPTY_REGISTRATION: RegistrationData & { confirmPassword: string; accepted: boolean } = {
  email: '', nit: '', company: '', firstName: '', lastName: '', jobTitle: '',
  password: '', confirmPassword: '', accepted: false,
};

function PasswordField({ value, onChange, label, autoComplete }: { value: string; onChange: (value: string) => void; label: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input type={visible ? 'text' : 'password'} value={value} onChange={event => onChange(event.target.value)} className="form-control pr-16" autoComplete={autoComplete} required />
        <button type="button" onClick={() => setVisible(prev => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-navy-600">{visible ? 'Ocultar' : 'Mostrar'}</button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, register } = useApp();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registration, setRegistration] = useState(EMPTY_REGISTRATION);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => {
    const value = registration.password;
    return [value.length >= 8, /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  }, [registration.password]);

  const changeView = (next: View) => {
    setView(next);
    setError('');
    setSuccess('');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email || !password) return setError('Completa el correo y la contraseña.');
    setLoading(true);
    try {
      await login(email, password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Correo electrónico o contraseña incorrectos.');
    }
    setLoading(false);
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const corporateDomain = registration.email.split('@')[1]?.toLowerCase();
    if (Object.entries(registration).some(([key, value]) => key !== 'accepted' && !value)) return setError('Todos los campos son obligatorios.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.email)) return setError('Ingresa un correo electrónico válido.');
    if (['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'].includes(corporateDomain)) return setError('Utiliza tu correo electrónico empresarial.');
    if (!/^\d+$/.test(registration.nit)) return setError('El NIT debe contener únicamente números, sin dígito de verificación.');
    if (passwordStrength < 3) return setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y se recomienda un símbolo.');
    if (registration.password !== registration.confirmPassword) return setError('Las contraseñas no coinciden.');
    if (!registration.accepted) return setError('Debes aceptar la política de tratamiento de datos.');
    setLoading(true);
    const result = await register(registration);
    setLoading(false);
    if (!result.ok) return setError(result.message);
    setSuccess(result.message);
    setEmail(registration.email);
    setPassword(registration.password);
  };

  const handleForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email);
      setSuccess(result.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible enviar el enlace.');
    }
    setLoading(false);
  };

  return (
    <div className="login-shell min-h-screen flex bg-white">
      <section className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-navy-800 text-white">
        <div className="brand-projection" aria-hidden="true"><span /><span /></div>
        <div className="relative">
          <img src="/brand/Siesa_Logosimbolo_Blanco.svg" alt="Siesa" className="w-40 h-auto mb-20" />
          <p className="text-sm font-semibold tracking-[0.18em] uppercase text-white/70 mb-4">Biblioteca virtual</p>
          <h1 className="text-4xl xl:text-5xl font-semibold leading-tight max-w-lg">Conocimiento que impulsa tu operación.</h1>
          <p className="text-white/75 text-base leading-relaxed mt-6 max-w-md">Encuentra manuales y comunicados, solicita contenido y sigue cada respuesta de forma clara y centralizada.</p>
        </div>
        <div className="relative grid grid-cols-3 gap-4 border-t border-white/20 pt-6">
          {[['01', 'Busca'], ['02', 'Solicita'], ['03', 'Haz seguimiento']].map(([number, label]) => <div key={number}><div className="text-xs text-white/55 mb-1">{number}</div><div className="text-sm font-medium">{label}</div></div>)}
        </div>
      </section>

      <main className="flex-1 flex items-center justify-center px-5 py-10 sm:px-10">
        <div className={`w-full ${view === 'register' ? 'max-w-2xl' : 'max-w-md'}`}>
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/brand/Siesa_Logosimbolo_Azul.svg" alt="Siesa" className="w-28 h-auto" />
          </div>

          {view === 'login' && (
            <>
              <header className="mb-8"><h2 className="text-3xl font-semibold text-slate-900">Bienvenido</h2><p className="text-slate-500 text-sm mt-2">Ingresa con tu cuenta empresarial.</p></header>
              <form onSubmit={handleLogin} className="space-y-5">
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico empresarial</label><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="nombre@empresa.com" className="form-control" autoComplete="email" /></div>
                <PasswordField label="Contraseña" value={password} onChange={setPassword} autoComplete="current-password" />
                <div className="flex justify-end"><button type="button" onClick={() => changeView('forgot')} className="text-sm text-navy-600 font-medium">¿Olvidaste tu contraseña?</button></div>
                {error && <div role="alert" className="notice-error">{error}</div>}
                <button type="submit" disabled={loading} className="primary-button w-full">{loading ? 'Verificando…' : 'Iniciar sesión'}</button>
              </form>
              <div className="mt-7 text-center text-sm text-slate-600">¿Aún no tienes cuenta? <button onClick={() => changeView('register')} className="text-navy-600 font-semibold">Crear cuenta</button></div>
              <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-3">Accesos de demostración</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  <button onClick={() => { setEmail('cliente@siesa.com'); setPassword('demo1234'); }} className="demo-access"><span>Cliente</span><small>cliente@siesa.com</small></button>
                  <button onClick={() => { setEmail('agente@siesa.com'); setPassword('demo1234'); }} className="demo-access"><span>Agente</span><small>agente@siesa.com</small></button>
                </div>
              </div>
            </>
          )}

          {view === 'register' && (
            <>
              <button onClick={() => changeView('login')} className="text-sm text-slate-500 mb-6">Volver al inicio de sesión</button>
              <header className="mb-7"><p className="text-sm font-semibold text-navy-600 mb-2">Registro de clientes</p><h2 className="text-3xl font-semibold text-slate-900">Crea tu cuenta</h2><p className="text-slate-500 text-sm mt-2">Los agentes son habilitados únicamente por Siesa.</p></header>
              {success ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-6"><h3 className="font-semibold text-green-800">Cuenta creada correctamente</h3><p className="text-sm text-green-700 mt-2">{success}</p><button onClick={() => { setSuccess(''); setView('login'); }} className="primary-button mt-5 w-full">Ingresar y continuar</button></div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      ['firstName', 'Nombres', 'Ana'],
                      ['lastName', 'Apellidos', 'García'],
                      ['company', 'Nombre de la empresa', 'Empresa S.A.S.'],
                      ['jobTitle', 'Cargo', 'Coordinadora de nómina'],
                    ].map(([key, label, placeholder]) => <div key={key}><label className="field-label">{label}</label><input value={String(registration[key as keyof typeof registration])} onChange={event => setRegistration(prev => ({ ...prev, [key]: event.target.value }))} placeholder={placeholder} className="form-control" /></div>)}
                    <div><label className="field-label">Correo electrónico empresarial</label><input type="email" value={registration.email} onChange={event => setRegistration(prev => ({ ...prev, email: event.target.value }))} placeholder="nombre@empresa.com" className="form-control" /></div>
                    <div><label className="field-label">NIT sin dígito de verificación</label><input inputMode="numeric" value={registration.nit} onChange={event => setRegistration(prev => ({ ...prev, nit: event.target.value.replace(/\D/g, '') }))} placeholder="900123456" className="form-control" /></div>
                    <PasswordField label="Contraseña" value={registration.password} onChange={value => setRegistration(prev => ({ ...prev, password: value }))} autoComplete="new-password" />
                    <PasswordField label="Confirmar contraseña" value={registration.confirmPassword} onChange={value => setRegistration(prev => ({ ...prev, confirmPassword: value }))} autoComplete="new-password" />
                  </div>
                  <div><div className="flex gap-1 mb-2">{[1, 2, 3, 4].map(level => <span key={level} className={`h-1.5 flex-1 rounded-full ${passwordStrength >= level ? 'bg-navy-600' : 'bg-slate-200'}`} />)}</div><p className="text-xs text-slate-500">Usa 8 caracteres o más, mayúscula, número y símbolo.</p></div>
                  <label className="flex gap-3 items-start text-sm text-slate-600"><input type="checkbox" className="mt-1" checked={registration.accepted} onChange={event => setRegistration(prev => ({ ...prev, accepted: event.target.checked }))} /><span>Acepto la política de tratamiento de datos personales y autorizo la verificación de la información.</span></label>
                  {error && <div role="alert" className="notice-error">{error}</div>}
                  <button type="submit" disabled={loading} className="primary-button w-full">{loading ? 'Creando cuenta…' : 'Crear cuenta'}</button>
                </form>
              )}
            </>
          )}

          {view === 'forgot' && (
            <>
              <button onClick={() => changeView('login')} className="text-sm text-slate-500 mb-6">Volver</button>
              <header className="mb-8"><h2 className="text-3xl font-semibold text-slate-900">Recuperar contraseña</h2><p className="text-slate-500 text-sm mt-2">Te enviaremos un enlace seguro a tu correo empresarial.</p></header>
              {success ? <div className="notice-success">{success}</div> : <form onSubmit={handleForgot} className="space-y-5"><div><label className="field-label">Correo electrónico</label><input type="email" required value={email} onChange={event => setEmail(event.target.value)} className="form-control" /></div><button disabled={loading} className="primary-button w-full">{loading ? 'Enviando…' : 'Enviar enlace'}</button></form>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
