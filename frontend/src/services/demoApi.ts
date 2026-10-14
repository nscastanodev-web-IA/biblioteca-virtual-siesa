/**
 * Modo demostración (solo interfaz).
 *
 * Cuando el frontend se publica sin backend (por ejemplo en Vercel), este
 * módulo intercepta las llamadas `fetch` dirigidas a la API (`/api/v1`) y las
 * responde con los datos de ejemplo de `src/data/mockData.ts`. Así la interfaz
 * completa (login, biblioteca, solicitudes, notificaciones, perfil y recorrido
 * guiado) funciona de forma estática, sin PHP ni base de datos.
 *
 * Se activa con la constante de compilación `__DEMO_MODE__` (ver vite.config.ts).
 */
import type {
  Comment,
  Document,
  DocumentRequest,
  HistoryEntry,
  Notification,
  Permissions,
  SessionPayload,
  User,
} from '../types';
import { DOCUMENTS, NOTIFICATIONS, REQUESTS, USERS } from '../data/mockData';
import { API_URL } from './api';

const STORAGE_KEY = 'siesa-demo-user';
const PREFIX = API_URL.replace(/\/+$/, '');

/* -------------------------------------------------------------------------- */
/* Estado en memoria                                                          */
/* -------------------------------------------------------------------------- */

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readStoredUser(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeUser(id: string | null): void {
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

let users: User[] = clone(USERS);
let documents: Document[] = clone(DOCUMENTS);
let requests: DocumentRequest[] = clone(REQUESTS).map(hydrateRequest);
let notifications: Notification[] = clone(NOTIFICATIONS);
let currentUserId: string | null = readStoredUser();

function currentUser(): User | null {
  return currentUserId ? users.find(user => user.id === currentUserId) ?? null : null;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

function now(): string {
  return new Date().toISOString().slice(0, 16);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function permissionSetFor(user: User | null): Permissions | null {
  if (!user) return null;
  const isAgent = user.userRole === 'agente';
  return {
    manageDocuments: isAgent,
    manageRequests: isAgent,
    viewAllRequests: isAgent,
    download: true,
    isDemo: true,
  };
}

function session(): SessionPayload {
  const user = currentUser();
  return { user, permissions: permissionSetFor(user), csrfToken: 'demo-csrf-token' };
}

function hydrateRequest(request: DocumentRequest): DocumentRequest {
  return {
    ...request,
    client: request.client ?? users.find(user => user.id === request.clientId),
    assignee:
      request.assignee ??
      users.find(user => user.id === request.assignedTo && user.userRole === 'agente') ??
      null,
  };
}

/* -------------------------------------------------------------------------- */
/* Respuestas                                                                 */
/* -------------------------------------------------------------------------- */

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function ok<T>(data: T): Response {
  return jsonResponse({ data }, 200);
}

function fail(status: number, message: string, errors: Record<string, string[]> = {}): Response {
  return jsonResponse({ message, errors }, status);
}

/* -------------------------------------------------------------------------- */
/* Utilidades de la petición                                                  */
/* -------------------------------------------------------------------------- */

function rawUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

async function readBody(init: RequestInit): Promise<Record<string, unknown>> {
  const body = init.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const result: Record<string, unknown> = {};
    body.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  return {};
}

function visibleDocuments(user: User | null): Document[] {
  if (user?.userRole === 'agente') return documents;
  return documents.filter(document => document.active !== false && document.status !== 'borrador');
}

function relatedDocuments(document: Document): Document[] {
  return documents
    .filter(
      item =>
        item.id !== document.id &&
        item.active !== false &&
        (item.system === document.system || item.type === document.type),
    )
    .slice(0, 4);
}

function buildFilters() {
  const unique = (values: Array<string | number>) => [...new Set(values.map(String))].sort();
  return {
    types: unique(documents.map(document => document.type)),
    systems: unique(documents.map(document => document.system)),
    apps: unique(documents.map(document => document.app)),
    versions: unique(documents.map(document => document.version)),
    years: unique(documents.map(document => document.year)).reverse(),
  };
}

function documentPayload(document: Document) {
  return {
    document,
    related: relatedDocuments(document),
    versions: [] as unknown[],
    createdBy: users.find(user => user.userRole === 'agente') ?? null,
  };
}

function findDocument(id: string): Document | undefined {
  return documents.find(document => document.id === id);
}

function findRequest(id: string): DocumentRequest | undefined {
  return requests.find(request => request.id === id);
}

function addHistory(
  request: DocumentRequest,
  newStatus: DocumentRequest['status'],
  comment: string,
  internal = false,
): void {
  const entry: HistoryEntry = {
    id: `h${Date.now()}`,
    previousStatus: request.status,
    newStatus,
    date: now(),
    userId: currentUser()?.id ?? '',
    comment,
    internal,
  };
  request.status = newStatus;
  request.updatedAt = now();
  request.history = [...request.history, entry];
}

function pushNotification(notification: Omit<Notification, 'id' | 'date' | 'read'>): void {
  notifications = [
    { ...notification, id: `n${Date.now()}`, date: now(), read: false },
    ...notifications,
  ];
}

/* -------------------------------------------------------------------------- */
/* Enrutado                                                                   */
/* -------------------------------------------------------------------------- */

async function route(requestUrl: string, init: RequestInit): Promise<Response> {
  const url = new URL(requestUrl, window.location.origin);
  const path = url.pathname.startsWith(PREFIX) ? url.pathname.slice(PREFIX.length) : url.pathname;
  const query = url.searchParams;
  const method = (init.method ?? 'GET').toUpperCase();
  const body = await readBody(init);
  const user = currentUser();

  /* ---------------------------- Autenticación ---------------------------- */
  if (path === '/auth/me' && method === 'GET') return ok(session());

  if (path === '/auth/login' && method === 'POST') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const found = users.find(item => item.email.toLowerCase() === email);
    if (!found || password.length < 4) {
      return fail(401, 'Correo o contraseña incorrectos.');
    }
    currentUserId = found.id;
    storeUser(found.id);
    return ok(session());
  }

  if (path === '/auth/logout' && method === 'POST') {
    currentUserId = null;
    storeUser(null);
    return ok({ ok: true });
  }

  if (path === '/auth/register' && method === 'POST') {
    const email = String(body.email ?? '').toLowerCase();
    const fullName =
      [body.firstName, body.lastName].filter(Boolean).join(' ').trim() || email || 'Usuario demo';
    const created: User = {
      id: `u${Date.now()}`,
      name: fullName,
      email,
      phone: String(body.phone ?? ''),
      company: String(body.company ?? ''),
      nit: String(body.nit ?? ''),
      jobTitle: String(body.jobTitle ?? ''),
      system: String(body.system ?? 'Todos'),
      userRole: 'cliente',
      registeredAt: today(),
      status: 'activo',
      avatarInitials: initials(fullName),
    };
    users = [...users, created];
    return ok({ id: created.id });
  }

  if (path === '/auth/forgot-password' && method === 'POST') {
    return ok({ message: 'Si el correo existe, enviamos un enlace de recuperación.' });
  }

  if (path === '/auth/reset-password' && method === 'POST') {
    return ok({ message: 'Contraseña restablecida (modo demostración).' });
  }

  /* ------------------------------ Documentos ----------------------------- */
  if (path === '/documents' && method === 'GET') {
    return ok(visibleDocuments(user));
  }

  if (path === '/documents/filters' && method === 'GET') {
    return ok(buildFilters());
  }

  if (path === '/documents' && method === 'POST') {
    const published = String(body.publish ?? '1') !== '0';
    const created: Document = {
      id: `d${Date.now()}`,
      title: String(body.title ?? 'Documento sin título'),
      description: String(body.description ?? ''),
      type: (body.type ?? 'Manual') as Document['type'],
      system: String(body.system ?? ''),
      app: String(body.app ?? ''),
      version: String(body.version ?? '1.0'),
      year: Number(body.year ?? new Date().getFullYear()),
      publishedAt: today(),
      updatedAt: today(),
      format: 'PDF',
      fileSize: String(body.fileSize ?? '1.2 MB'),
      keywords: String(body.keywords ?? '')
        .split(',')
        .map(keyword => keyword.trim())
        .filter(Boolean),
      isNew: true,
      views: 0,
      downloads: 0,
      relatedDocIds: [],
      active: published,
      status: published ? 'publicado' : 'borrador',
      currentVersion: 1,
    };
    documents = [created, ...documents];
    return ok(documentPayload(created));
  }

  const docStatus = path.match(/^\/documents\/([^/]+)\/status$/);
  if (docStatus && method === 'PATCH') {
    const document = findDocument(docStatus[1]);
    if (!document) return fail(404, 'Documento no encontrado.');
    const status = String(body.status ?? 'publicado') as NonNullable<Document['status']>;
    document.status = status;
    document.active = status === 'publicado';
    document.updatedAt = today();
    return ok(documentPayload(document));
  }

  const docFeedback = path.match(/^\/documents\/([^/]+)\/feedback$/);
  if (docFeedback && method === 'POST') {
    return ok({ helpful: Boolean(body.helpful) });
  }

  const docId = path.match(/^\/documents\/([^/]+)$/);
  if (docId && method === 'GET') {
    const document = findDocument(docId[1]);
    if (!document) return fail(404, 'Documento no encontrado.');
    return ok(documentPayload(document));
  }

  if (docId && method === 'PATCH') {
    const document = findDocument(docId[1]);
    if (!document) return fail(404, 'Documento no encontrado.');
    const fields: Array<keyof Document> = ['title', 'description', 'system', 'app', 'version', 'year'];
    fields.forEach(field => {
      if (body[field] !== undefined) {
        (document[field] as unknown) = body[field];
      }
    });
    if (body.keywords !== undefined) {
      document.keywords = String(body.keywords)
        .split(',')
        .map(keyword => keyword.trim())
        .filter(Boolean);
    }
    if (body.active !== undefined) document.active = Boolean(body.active);
    document.updatedAt = today();
    return ok(documentPayload(document));
  }

  /* ------------------------------ Solicitudes ---------------------------- */
  if (path === '/requests/agents' && method === 'GET') {
    return ok(users.filter(item => item.userRole === 'agente'));
  }

  if (path === '/requests' && method === 'GET') {
    const list = user?.userRole === 'agente'
      ? requests
      : requests.filter(request => request.clientId === user?.id);
    return ok(list.map(hydrateRequest));
  }

  if (path === '/requests' && method === 'POST') {
    if (!user) return fail(401, 'No autenticado.');
    const number = `SOL-${String(requests.length + 1).padStart(4, '0')}`;
    const timestamp = now();
    const created: DocumentRequest = {
      id: `r${Date.now()}`,
      number,
      clientId: user.id,
      type: (body.type ?? 'Manual') as DocumentRequest['type'],
      requestType: (body.requestType ?? 'Documento nuevo') as DocumentRequest['requestType'],
      system: String(body.system ?? ''),
      app: String(body.app ?? ''),
      version: String(body.version ?? ''),
      year: Number(body.year ?? new Date().getFullYear()),
      title: String(body.title ?? ''),
      description: String(body.description ?? ''),
      reason: String(body.reason ?? ''),
      priority: (body.priority ?? 'Media') as DocumentRequest['priority'],
      status: 'Recibida',
      assignedTo: null,
      estimatedDate: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      history: [
        {
          id: `h${Date.now()}`,
          previousStatus: null,
          newStatus: 'Recibida',
          date: timestamp,
          userId: user.id,
          comment: 'Solicitud enviada por el cliente.',
          internal: false,
        },
      ],
      comments: [],
      attachments: [],
      notificationChannel: (body.notificationChannel ?? 'aplicación') as DocumentRequest['notificationChannel'],
      linkedDocumentId: null,
    };
    requests = [hydrateRequest(created), ...requests];
    pushNotification({
      userId: user.id,
      title: 'Solicitud recibida',
      message: `Registramos tu solicitud ${number}.`,
      type: 'solicitud',
      requestId: created.id,
    });
    return ok(hydrateRequest(created));
  }

  const reqComment = path.match(/^\/requests\/([^/]+)\/comments$/);
  if (reqComment && method === 'POST') {
    const request = findRequest(reqComment[1]);
    if (!request) return fail(404, 'Solicitud no encontrada.');
    const comment: Comment = {
      id: `c${Date.now()}`,
      requestId: request.id,
      userId: user?.id ?? '',
      text: String(body.text ?? ''),
      date: now(),
      internal: Boolean(body.internal),
    };
    request.comments = [...request.comments, comment];
    request.updatedAt = now();
    return ok(hydrateRequest(request));
  }

  const reqStatus = path.match(/^\/requests\/([^/]+)\/status$/);
  if (reqStatus && method === 'PATCH') {
    const request = findRequest(reqStatus[1]);
    if (!request) return fail(404, 'Solicitud no encontrada.');
    addHistory(
      request,
      String(body.status ?? request.status) as DocumentRequest['status'],
      String(body.comment ?? ''),
      Boolean(body.internal),
    );
    return ok(hydrateRequest(request));
  }

  const reqAssignment = path.match(/^\/requests\/([^/]+)\/assignment$/);
  if (reqAssignment && method === 'PATCH') {
    const request = findRequest(reqAssignment[1]);
    if (!request) return fail(404, 'Solicitud no encontrada.');
    request.assignedTo = String(body.assignedTo ?? '');
    request.estimatedDate = body.estimatedDate ? String(body.estimatedDate) : request.estimatedDate;
    request.status = 'En validación';
    request.updatedAt = now();
    return ok(hydrateRequest(request));
  }

  const reqProduction = path.match(/^\/requests\/([^/]+)\/production$/);
  if (reqProduction && method === 'POST') {
    const request = findRequest(reqProduction[1]);
    if (!request) return fail(404, 'Solicitud no encontrada.');
    request.assignedTo = String(body.assignedTo ?? request.assignedTo ?? '');
    request.estimatedDate = body.estimatedDate ? String(body.estimatedDate) : request.estimatedDate;
    request.productionInstructions = String(body.instructions ?? '');
    addHistory(request, 'En producción', String(body.comment ?? 'Enviada a producción.'), false);
    return ok(hydrateRequest(request));
  }

  const reqDocument = path.match(/^\/requests\/([^/]+)\/document$/);
  if (reqDocument && method === 'PATCH') {
    const request = findRequest(reqDocument[1]);
    if (!request) return fail(404, 'Solicitud no encontrada.');
    request.linkedDocumentId = String(body.documentId ?? '');
    if (body.publish) {
      addHistory(request, 'Documento disponible', String(body.comment ?? 'Documento publicado.'), false);
    } else {
      request.updatedAt = now();
    }
    return ok(hydrateRequest(request));
  }

  const reqCancel = path.match(/^\/requests\/([^/]+)\/cancel$/);
  if (reqCancel && method === 'PATCH') {
    const request = findRequest(reqCancel[1]);
    if (!request) return fail(404, 'Solicitud no encontrada.');
    addHistory(request, 'Cerrada', 'Solicitud cerrada por el cliente.', false);
    return ok(hydrateRequest(request));
  }

  const reqId = path.match(/^\/requests\/([^/]+)$/);
  if (reqId && method === 'GET') {
    const request = findRequest(reqId[1]);
    if (!request) return fail(404, 'Solicitud no encontrada.');
    return ok(hydrateRequest(request));
  }

  /* ---------------------------- Notificaciones --------------------------- */
  if (path === '/notifications' && method === 'GET') {
    const mine = notifications.filter(notification => notification.userId === user?.id);
    const list = query.get('unread') === '1' ? mine.filter(item => !item.read) : mine;
    return ok(list);
  }

  if (path === '/notifications/read-all' && method === 'PATCH') {
    let updated = 0;
    notifications = notifications.map(notification => {
      if (notification.userId === user?.id && !notification.read) {
        updated += 1;
        return { ...notification, read: true };
      }
      return notification;
    });
    return ok({ updated, unread: 0 });
  }

  const notifRead = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (notifRead && method === 'PATCH') {
    notifications = notifications.map(notification =>
      notification.id === notifRead[1] ? { ...notification, read: true } : notification,
    );
    return ok({ id: notifRead[1], read: true });
  }

  /* -------------------------------- Perfil ------------------------------- */
  if (path === '/profile' && method === 'GET') {
    return user ? ok(user) : fail(401, 'No autenticado.');
  }

  if (path === '/profile' && method === 'PATCH') {
    if (!user) return fail(401, 'No autenticado.');
    const fields: Array<keyof User> = ['phone', 'company', 'jobTitle', 'system'];
    fields.forEach(field => {
      if (body[field] !== undefined) {
        (user[field] as unknown) = body[field];
      }
    });
    return ok(user);
  }

  if (path === '/profile/password' && method === 'PATCH') {
    return ok({ message: 'Contraseña actualizada (modo demostración).' });
  }

  if (path === '/profile/preferences' && method === 'PATCH') {
    if (!user) return fail(401, 'No autenticado.');
    user.themePreference = String(body.theme ?? 'light') as User['themePreference'];
    return ok(user);
  }

  if (path === '/profile/onboarding' && method === 'PATCH') {
    if (!user) return fail(401, 'No autenticado.');
    user.onboardingCompleted = Boolean(body.completed);
    return ok(user);
  }

  return fail(404, `Recurso no encontrado en modo demostración: ${method} ${path}`);
}

/* -------------------------------------------------------------------------- */
/* Instalación                                                                */
/* -------------------------------------------------------------------------- */

export function installDemoApi(): void {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = rawUrl(input);

    // Solo interceptamos las llamadas a nuestra propia API.
    if (!url.includes(PREFIX)) {
      return originalFetch(input, init);
    }

    // Pequeña latencia para que los estados de carga sean visibles.
    await new Promise(resolve => window.setTimeout(resolve, 120));

    const request = input instanceof Request ? input : null;
    const merged: RequestInit = {
      method: request?.method ?? init.method ?? 'GET',
      body: request ? await request.clone().text() : init.body,
    };

    try {
      return await route(url, merged);
    } catch (error) {
      console.error('[demo] Error al simular la API', error);
      return fail(500, 'Error inesperado en el modo demostración.');
    }
  };

  console.info(
    '%c[modo demo]%c La interfaz usa datos de ejemplo (sin backend). ' +
      'Ingresa con cliente@siesa.com o agente@siesa.com y la contraseña demo1234.',
    'background:#1e3a8a;color:#fff;padding:2px 6px;border-radius:4px;font-weight:bold',
    'color:#1e3a8a',
  );
}
