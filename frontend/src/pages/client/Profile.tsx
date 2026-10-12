import { useApp } from '../../store/AppContext';
import Layout from '../../components/Layout';

export default function Profile() {
  const { currentUser } = useApp();
  if (!currentUser) return null;

  const fields = [
    { label: 'Nombre completo', value: currentUser.name },
    { label: 'Correo electrónico', value: currentUser.email },
    { label: 'Teléfono', value: currentUser.phone },
    { label: 'Empresa', value: currentUser.company },
    { label: 'NIT', value: currentUser.nit },
    { label: 'Cargo', value: currentUser.jobTitle },
    { label: 'Sistema asociado', value: currentUser.system },
    { label: 'Rol', value: currentUser.userRole === 'cliente' ? 'Cliente' : 'Agente interno' },
    { label: 'Estado', value: currentUser.status === 'activo' ? 'Activo' : 'Inactivo' },
    { label: 'Fecha de registro', value: new Date(currentUser.registeredAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) },
  ];

  return (
    <Layout title="Mi Perfil">
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
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

          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide" style={{ fontFamily: 'DM Sans, sans-serif' }}>Información de la cuenta</h3>
            <div className="divide-y divide-slate-100">
              {fields.map(({ label, value }) => (
                <div key={label} className="py-3 flex items-start justify-between gap-4">
                  <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>
                  <span className="text-sm font-medium text-slate-800 text-right">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                Para actualizar tu información de perfil, contacta al administrador del sistema en <strong>soporte@siesa.com</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
