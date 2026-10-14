import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { TOUR_STEPS } from '../data/tour';
import type { Page } from '../types';

type IconName = 'home' | 'library' | 'requests' | 'bell' | 'user' | 'documents' | 'help' | 'logout' | 'menu' | 'close';

function Icon({ name, className = 'w-5 h-5' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10M9 20v-6h6v6" /></>,
    library: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" /></>,
    requests: <><path d="M9 5h10v16H5V5h2" /><path d="M9 3h6v4H9zM9 12h6M9 16h6" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    documents: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.3 2.3 0 1 1 3.3 2.1c-.8.4-1.1.9-1.1 1.9M12 17h.01" /></>,
    logout: <><path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">{paths[name]}</svg>;
}

interface NavItem {
  label: string;
  page: Page;
  icon: IconName;
}

const CLIENT_NAV: NavItem[] = [
  { label: 'Inicio', page: 'client.dashboard', icon: 'home' },
  { label: 'Biblioteca', page: 'client.library', icon: 'library' },
  { label: 'Mis solicitudes', page: 'client.requests', icon: 'requests' },
  { label: 'Notificaciones', page: 'client.notifications', icon: 'bell' },
  { label: 'Mi cuenta', page: 'client.profile', icon: 'user' },
];

const AGENT_NAV: NavItem[] = [
  { label: 'Panel', page: 'agent.dashboard', icon: 'home' },
  { label: 'Solicitudes', page: 'agent.requests', icon: 'requests' },
  { label: 'Documentos', page: 'agent.documents', icon: 'documents' },
  { label: 'Notificaciones', page: 'client.notifications', icon: 'bell' },
  { label: 'Mi cuenta', page: 'client.profile', icon: 'user' },
];

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <img src="/brand/Siesa_Logosimbolo_Blanco.svg" alt="Siesa" className="w-24 h-auto" />
      <span className="border-l border-white/30 pl-3 text-xs leading-tight text-white/80">Biblioteca<br />Virtual</span>
    </div>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const {
    currentUser, navigate, logout, router, unreadNotificationCount,
    tourStep, tourDontShowAgain, setTourDontShowAgain, startTour, goToTourStep, finishTour,
  } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) return null;

  const isAgent = currentUser.userRole === 'agente';
  const navItems = isAgent ? AGENT_NAV : CLIENT_NAV;
  const unread = unreadNotificationCount(currentUser.id);

  const handleNav = (page: Page) => {
    navigate(page);
    setSidebarOpen(false);
  };

  const runTourFromStart = () => {
    startTour();
    handleNav('client.dashboard');
  };

  return (
    <div className="app-shell flex h-full bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-navy-800 transition-transform duration-200 lg:relative lg:translate-x-0 lg:flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/15">
          <BrandLogo />
          <button aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white p-2"><Icon name="close" /></button>
        </div>

        <nav aria-label="Navegación principal" className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(item => (
            <button
              key={item.page}
              onClick={() => handleNav(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${router.page === item.page ? 'bg-white text-navy-800' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
            >
              <Icon name={item.icon} />
              <span className="flex-1">{item.label}</span>
              {item.label === 'Notificaciones' && unread > 0 && <span className="bg-white text-navy-800 text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
            </button>
          ))}
          {!isAgent && (
            <button onClick={runTourFromStart} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white">
              <Icon name="help" /> Ayuda y recorrido
            </button>
          )}
        </nav>

        <div className="px-3 pb-4">
          {isAgent && <div className="mb-2 px-3 text-xs text-white/60 uppercase tracking-wider font-medium">Modo agente</div>}
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/10 mb-2">
            <div className="w-9 h-9 rounded-full bg-white text-navy-800 flex items-center justify-center text-xs font-bold flex-shrink-0">{currentUser.avatarInitials}</div>
            <div className="min-w-0"><div className="text-white text-xs font-medium truncate">{currentUser.name}</div><div className="text-white/60 text-xs truncate">{currentUser.email}</div></div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"><Icon name="logout" />Cerrar sesión</button>
        </div>
      </aside>

      {sidebarOpen && <button aria-label="Cerrar menú lateral" className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="app-header bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <button aria-label="Abrir menú" onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-navy-800 p-2"><Icon name="menu" /></button>
          {title && <h1 className="text-base font-semibold text-slate-900">{title}</h1>}
          <div className="flex-1" />
          <button aria-label={`Notificaciones, ${unread} sin leer`} onClick={() => navigate('client.notifications')} className="relative p-2 text-slate-500 hover:text-navy-800 hover:bg-slate-100 rounded-lg">
            <Icon name="bell" />
            {unread > 0 && <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
          </button>
          <button onClick={() => navigate('client.profile')} aria-label="Ir a Mi cuenta" className="w-9 h-9 rounded-full bg-navy-800 flex items-center justify-center text-white text-xs font-bold hover:bg-navy-900 transition-colors">{currentUser.avatarInitials}</button>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {tourStep !== null && !isAgent && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="tour-title">
          <div className="tour-card bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-5"><span className="text-xs font-semibold text-navy-600">Paso {tourStep + 1} de {TOUR_STEPS.length}</span><button aria-label="Cerrar recorrido" onClick={finishTour} className="p-1 text-slate-400 hover:text-slate-700"><Icon name="close" /></button></div>
            <div className="h-1 bg-slate-100 rounded-full mb-6"><div className="h-1 bg-navy-600 rounded-full transition-all" style={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%` }} /></div>
            <h2 id="tour-title" className="text-xl font-semibold text-slate-900 mb-2">{TOUR_STEPS[tourStep].title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{TOUR_STEPS[tourStep].body}</p>
            <label className="flex items-center gap-2 mt-5 text-sm text-slate-600"><input type="checkbox" checked={tourDontShowAgain} onChange={event => setTourDontShowAgain(event.target.checked)} /> No volver a mostrar</label>
            <div className="flex items-center justify-between gap-3 mt-6">
              <button onClick={finishTour} className="text-sm text-slate-500 hover:text-slate-800">Omitir recorrido</button>
              <div className="flex gap-2">
                {tourStep > 0 && <button onClick={() => goToTourStep(tourStep - 1)} className="px-4 py-2 border border-navy-600 text-navy-600 rounded-lg text-sm font-medium">Anterior</button>}
                <button onClick={() => tourStep === TOUR_STEPS.length - 1 ? finishTour() : goToTourStep(tourStep + 1)} className="px-4 py-2 bg-navy-800 text-white rounded-lg text-sm font-semibold">{tourStep === TOUR_STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
