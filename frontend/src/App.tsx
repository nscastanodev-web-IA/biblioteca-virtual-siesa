import { AppProvider, useApp } from './store/AppContext';
import LoginPage from './pages/LoginPage';
import ClientDashboard from './pages/client/ClientDashboard';
import Library from './pages/client/Library';
import DocumentDetail from './pages/client/DocumentDetail';
import MyRequests from './pages/client/MyRequests';
import RequestDetail from './pages/client/RequestDetail';
import NewRequest from './pages/client/NewRequest';
import Profile from './pages/client/Profile';
import Notifications from './pages/client/Notifications';
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentRequests from './pages/agent/AgentRequests';
import AgentRequestDetail from './pages/agent/AgentRequestDetail';
import DocumentAdmin from './pages/agent/DocumentAdmin';

function Router() {
  const { router, booting } = useApp();

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <img src="/brand/Siesa_Logosimbolo_Azul.svg" alt="Siesa" className="w-28 h-auto mx-auto mb-4" />
          <p className="text-sm text-slate-500">Cargando biblioteca…</p>
        </div>
      </div>
    );
  }

  switch (router.page) {
    case 'login': return <LoginPage />;
    case 'client.dashboard': return <ClientDashboard />;
    case 'client.library': return <Library />;
    case 'client.document': return <DocumentDetail />;
    case 'client.requests': return <MyRequests />;
    case 'client.request': return <RequestDetail />;
    case 'client.new-request': return <NewRequest />;
    case 'client.profile': return <Profile />;
    case 'client.notifications': return <Notifications />;
    case 'agent.dashboard': return <AgentDashboard />;
    case 'agent.requests': return <AgentRequests />;
    case 'agent.request': return <AgentRequestDetail />;
    case 'agent.documents': return <DocumentAdmin />;
    default: return <LoginPage />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
