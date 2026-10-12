import { useApp } from '../../store/AppContext';
import Layout from '../../components/Layout';

const TYPE_ICONS: Record<string, string> = {
  solicitud: 'S',
  documento: 'D',
  estado: 'E',
  sistema: 'A',
};

export default function Notifications() {
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead, navigate } = useApp();
  if (!currentUser) return null;

  const myNotifs = notifications
    .filter(n => n.userId === currentUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const unread = myNotifs.filter(n => !n.read).length;

  const handleClick = (n: typeof myNotifs[0]) => {
    markNotificationRead(n.id);

    const path = n.linkPath ?? '';
    const requestMatch = path.match(/\/(client|agent)\/requests\/(\d+)/);

    if (requestMatch) {
      navigate(requestMatch[1] === 'agent' ? 'agent.request' : 'client.request', { id: requestMatch[2] });
      return;
    }
    if (path.includes('/client/profile')) {
      navigate('client.profile');
      return;
    }
    if (n.requestId) {
      const targetPage = currentUser.userRole === 'agente' ? 'agent.request' : 'client.request';
      navigate(targetPage, { id: n.requestId });
    } else if (n.documentId) {
      navigate('client.document', { id: n.documentId });
    }
  };

  return (
    <Layout title="Notificaciones">
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-slate-500">
              {unread > 0 ? `${unread} sin leer` : 'Todas leídas'}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="text-sm text-navy-600 hover:text-navy-800 font-medium"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        {myNotifs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <div className="text-sm font-semibold text-navy-600 mb-3">Notificaciones</div>
            <p className="text-slate-500 font-medium">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myNotifs.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-sm ${
                  notif.read
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-navy-50 border-navy-200 hover:border-navy-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${notif.read ? 'bg-slate-100' : 'bg-navy-100'}`}>
                  {TYPE_ICONS[notif.type] ?? 'N'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${notif.read ? 'text-slate-700' : 'text-navy-900'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && <span className="w-2 h-2 bg-navy-600 rounded-full flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {new Date(notif.date).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
