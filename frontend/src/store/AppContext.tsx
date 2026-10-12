import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type {
  User,
  Document,
  DocumentRequest,
  Notification,
  Page,
  RouterState,
  RequestStatus,
  RegistrationData,
  ThemePreference,
  DocType,
  RequestType,
  Priority,
  NotificationChannel,
} from '../types';
import {
  ApiError,
  authApi,
  documentsApi,
  notificationsApi,
  profileApi,
  requestsApi,
  setCsrfToken,
} from '../services/api';

export interface CreateRequestInput {
  clientId?: string;
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
}

export interface NewDocumentInput {
  title: string;
  description: string;
  type: DocType;
  system: string;
  app: string;
  version: string;
  year: number;
  keywords: string[];
  active?: boolean;
}

interface AppContextValue {
  currentUser: User | null;
  users: User[];
  documents: Document[];
  requests: DocumentRequest[];
  notifications: Notification[];
  router: RouterState;
  booting: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<User | null>;
  register: (data: RegistrationData & { confirmPassword?: string }) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  navigate: (page: Page, params?: Record<string, string>) => void;
  refresh: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  createRequest: (req: CreateRequestInput) => Promise<DocumentRequest>;
  updateRequestStatus: (requestId: string, newStatus: RequestStatus, comment: string, internal: boolean, agentId?: string) => void;
  addComment: (requestId: string, userId: string, text: string, internal: boolean) => void;
  assignRequest: (requestId: string, agentId: string, estimatedDate?: string) => void;
  linkDocument: (requestId: string, documentId: string, publish?: boolean) => void;
  sendToProduction: (requestId: string, agentId: string, assignedTo: string, estimatedDate: string, instructions: string, comment: string) => void;
  cancelRequest: (requestId: string) => void;
  addDocument: (doc: NewDocumentInput, file?: File | null) => Promise<boolean>;
  updateDocument: (id: string, updates: Partial<Document>, file?: File | null) => Promise<boolean>;
  unreadNotificationCount: (userId: string) => number;
  getUserById: (id: string) => User | undefined;
  getDocumentById: (id: string) => Document | undefined;
  getRequestById: (id: string) => DocumentRequest | undefined;
  getClientRequests: (clientId: string) => DocumentRequest[];
}

const AppContext = createContext<AppContextValue | null>(null);

const HOME_PAGE: Record<string, Page> = {
  agente: 'agent.dashboard',
  cliente: 'client.dashboard',
};

function messageOf(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

function mergeUsers(previous: User[], incoming: Array<User | null | undefined>): User[] {
  const map = new Map(previous.map(user => [user.id, user]));
  incoming.forEach(user => {
    if (user && user.id) map.set(user.id, user);
  });
  return [...map.values()];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [router, setRouter] = useState<RouterState>({ page: 'login' });
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem('siesa-theme');
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  });

  const errorTimer = useRef<number | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const reportError = useCallback((caught: unknown) => {
    const message = messageOf(caught);
    console.error(caught);
    setError(message);
    if (errorTimer.current !== null) window.clearTimeout(errorTimer.current);
    errorTimer.current = window.setTimeout(() => setError(null), 6000);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    applyTheme();
    localStorage.setItem('siesa-theme', theme);
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemePreference) => {
    setThemeState(nextTheme);
    setCurrentUser(prev => (prev ? { ...prev, themePreference: nextTheme } : prev));
    profileApi.updatePreferences(nextTheme).catch(() => { /* preferencia local, no bloquea */ });
  }, []);

  const navigate = useCallback((page: Page, params?: Record<string, string>) => {
    setRouter({ page, params });
    window.scrollTo(0, 0);
  }, []);

  const loadAll = useCallback(async (user: User) => {
    const isAgent = user.userRole === 'agente';

    const [docs, reqs, notifs, agents] = await Promise.all([
      documentsApi.list(isAgent ? { per_page: 100, include_unpublished: 1 } : { per_page: 100 }),
      requestsApi.list({ per_page: 100 }),
      notificationsApi.list(),
      isAgent ? requestsApi.agents() : Promise.resolve<User[]>([]),
    ]);

    setDocuments(docs);
    setRequests(reqs);
    setNotifications(notifs);
    setUsers(prev => mergeUsers(
      mergeUsers(prev, [user, ...agents]),
      reqs.flatMap(request => [request.client, request.assignee]),
    ));
  }, []);

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    try {
      await loadAll(currentUser);
    } catch (caught) {
      reportError(caught);
    }
  }, [currentUser, loadAll, reportError]);

  // Comprobación inicial de sesión: permite recargar la página sin volver a entrar.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const session = await authApi.me();
        setCsrfToken(session.csrfToken);

        if (active && session.user) {
          setCurrentUser(session.user);
          setRouter({ page: HOME_PAGE[session.user.userRole] ?? 'client.dashboard' });
          await loadAll(session.user);
        }
      } catch (caught) {
        if (active) reportError(caught);
      } finally {
        if (active) setBooting(false);
      }
    })();

    return () => { active = false; };
  }, [loadAll, reportError]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    setCsrfToken(session.csrfToken);

    if (!session.user) return null;

    setCurrentUser(session.user);
    setRouter({ page: HOME_PAGE[session.user.userRole] ?? 'client.dashboard' });
    await loadAll(session.user);
    return session.user;
  }, [loadAll]);

  const register = useCallback(async (data: RegistrationData & { confirmPassword?: string }) => {
    try {
      await authApi.register({
        email: data.email,
        nit: data.nit,
        company: data.company,
        phone: '',
        firstName: data.firstName,
        lastName: data.lastName,
        jobTitle: data.jobTitle,
        password: data.password,
        passwordConfirmation: data.confirmPassword ?? data.password,
      });
      return { ok: true, message: 'Cuenta creada. Enviamos un enlace de verificación a tu correo.' };
    } catch (caught) {
      return { ok: false, message: messageOf(caught) };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // La sesión del servidor se invalida igual; limpiamos el estado local.
    }
    setCsrfToken(null);
    setCurrentUser(null);
    setUsers([]);
    setDocuments([]);
    setRequests([]);
    setNotifications([]);
    navigate('login');
  }, [navigate]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    notificationsApi.markRead(id).catch(reportError);
  }, [reportError]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notificationsApi.readAll().catch(reportError);
  }, [reportError]);

  const upsertRequest = useCallback((updated: DocumentRequest) => {
    setRequests(prev => {
      const exists = prev.some(request => request.id === updated.id);
      return exists ? prev.map(request => (request.id === updated.id ? updated : request)) : [updated, ...prev];
    });
    setUsers(prev => mergeUsers(prev, [updated.client, updated.assignee]));
  }, []);

  const upsertDocument = useCallback((document: Document) => {
    setDocuments(prev => {
      const exists = prev.some(item => item.id === document.id);
      return exists ? prev.map(item => (item.id === document.id ? document : item)) : [document, ...prev];
    });
  }, []);

  const run = useCallback((operation: () => Promise<void>) => {
    void (async () => {
      try {
        await operation();
      } catch (caught) {
        reportError(caught);
      }
    })();
  }, [reportError]);

  const reloadNotifications = useCallback(async () => {
    try {
      setNotifications(await notificationsApi.list());
    } catch {
      // No interrumpe la acción principal.
    }
  }, []);

  const createRequest = useCallback(async (input: CreateRequestInput) => {
    const created = await requestsApi.create({
      type: input.type,
      requestType: input.requestType,
      system: input.system,
      app: input.app,
      version: input.version,
      year: input.year,
      title: input.title,
      description: input.description,
      reason: input.reason,
      priority: input.priority,
      notificationChannel: input.notificationChannel,
    });
    upsertRequest(created);
    void reloadNotifications();
    return created;
  }, [upsertRequest, reloadNotifications]);

  const updateRequestStatus = useCallback((requestId: string, newStatus: RequestStatus, comment: string, internal: boolean, _agentId?: string) => {
    run(async () => {
      const updated = currentUser?.userRole === 'cliente'
        ? await requestsApi.cancel(requestId)
        : await requestsApi.transition(requestId, newStatus, comment, internal);
      upsertRequest(updated);
      await reloadNotifications();
    });
  }, [run, currentUser, upsertRequest, reloadNotifications]);

  const cancelRequest = useCallback((requestId: string) => {
    run(async () => {
      const updated = await requestsApi.cancel(requestId);
      upsertRequest(updated);
      await reloadNotifications();
    });
  }, [run, upsertRequest, reloadNotifications]);

  const addComment = useCallback((requestId: string, _userId: string, text: string, internal: boolean) => {
    run(async () => {
      const updated = await requestsApi.comment(requestId, text, internal);
      upsertRequest(updated);
      await reloadNotifications();
    });
  }, [run, upsertRequest, reloadNotifications]);

  const assignRequest = useCallback((requestId: string, agentId: string, estimatedDate?: string) => {
    run(async () => {
      const updated = await requestsApi.assign(requestId, agentId, estimatedDate);
      upsertRequest(updated);
      await reloadNotifications();
    });
  }, [run, upsertRequest, reloadNotifications]);

  const linkDocument = useCallback((requestId: string, documentId: string, publish = false) => {
    run(async () => {
      const updated = await requestsApi.linkDocument(requestId, documentId, publish);
      upsertRequest(updated);
      await reloadNotifications();
    });
  }, [run, upsertRequest, reloadNotifications]);

  const sendToProduction = useCallback((requestId: string, _agentId: string, assignedTo: string, estimatedDate: string, instructions: string, comment: string) => {
    run(async () => {
      const updated = await requestsApi.production(requestId, assignedTo, estimatedDate, instructions, comment);
      upsertRequest(updated);
      await reloadNotifications();
    });
  }, [run, upsertRequest, reloadNotifications]);

  const addDocument = useCallback(async (doc: NewDocumentInput, file?: File | null): Promise<boolean> => {
    if (!file) {
      reportError(new ApiError(422, 'Debes adjuntar el archivo PDF del documento.'));
      return false;
    }

    try {
      const payload = new FormData();
      payload.append('title', doc.title);
      payload.append('description', doc.description);
      payload.append('type', doc.type);
      payload.append('system', doc.system);
      payload.append('app', doc.app);
      payload.append('version', doc.version);
      payload.append('year', String(doc.year));
      payload.append('keywords', doc.keywords.join(','));
      payload.append('publish', doc.active === false ? '0' : '1');
      payload.append('file', file);

      const result = await documentsApi.create(payload);
      upsertDocument(result.document);
      return true;
    } catch (caught) {
      reportError(caught);
      return false;
    }
  }, [upsertDocument, reportError]);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>, file?: File | null): Promise<boolean> => {
    try {
      if (file) {
        const payload = new FormData();
        payload.append('file', file);
        const result = await documentsApi.update(id, payload);
        upsertDocument(result.document);
        return true;
      }

      // Un cambio puro de estado (activar/desactivar) usa el endpoint dedicado.
      const keys = Object.keys(updates);
      if (keys.length === 1 && keys[0] === 'active') {
        const result = await documentsApi.updateStatus(id, updates.active ? 'publicado' : 'inactivo');
        upsertDocument(result.document);
        return true;
      }

      const body: Record<string, unknown> = {};
      if (updates.title !== undefined) body.title = updates.title;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.type !== undefined) body.type = updates.type;
      if (updates.system !== undefined) body.system = updates.system;
      if (updates.app !== undefined) body.app = updates.app;
      if (updates.version !== undefined) body.version = updates.version;
      if (updates.year !== undefined) body.year = updates.year;
      if (updates.keywords !== undefined) body.keywords = updates.keywords;

      const result = await documentsApi.update(id, body);
      upsertDocument(result.document);

      if (updates.active !== undefined) {
        const status = await documentsApi.updateStatus(id, updates.active ? 'publicado' : 'inactivo');
        upsertDocument(status.document);
      }

      return true;
    } catch (caught) {
      reportError(caught);
      return false;
    }
  }, [upsertDocument, reportError]);

  const unreadNotificationCount = useCallback((userId: string) =>
    notifications.filter(n => n.userId === userId && !n.read).length,
    [notifications]);

  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);
  const getDocumentById = useCallback((id: string) => documents.find(d => d.id === id), [documents]);
  const getRequestById = useCallback((id: string) => requests.find(r => r.id === id), [requests]);
  const getClientRequests = useCallback((clientId: string) => requests.filter(r => r.clientId === clientId), [requests]);

  return (
    <AppContext.Provider value={{
      currentUser, users, documents, requests, notifications, router,
      booting, error, clearError,
      login, register, logout, navigate, refresh, theme, setTheme,
      markNotificationRead, markAllNotificationsRead,
      createRequest, updateRequestStatus, addComment, assignRequest,
      linkDocument, sendToProduction, cancelRequest, addDocument, updateDocument,
      unreadNotificationCount, getUserById, getDocumentById, getRequestById,
      getClientRequests,
    }}>
      {children}
      {error && (
        <div role="alert" className="fixed bottom-4 right-4 z-[60] max-w-sm">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 shadow-lg">
            <span className="text-red-500 text-lg leading-none">!</span>
            <p className="text-sm text-slate-700 flex-1">{error}</p>
            <button onClick={clearError} aria-label="Cerrar aviso" className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
