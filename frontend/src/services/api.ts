/**
 * Frontera única entre React y la API PHP (docs/API.md).
 * Todas las respuestas del backend usan el sobre { data, meta }; aquí se
 * desenvuelven para que los componentes reciban directamente el modelo.
 */
import type {
  Document,
  DocumentRequest,
  Notification,
  PasswordChangeInput,
  Permissions,
  ProfileUpdateInput,
  SessionPayload,
  User,
} from '../types';

export const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

let csrfToken: string | null = null;

/** El token CSRF vive en memoria; se obtiene de /auth/me y de login. */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

function buildQuery(params: Record<string, string | number | undefined> = {}): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&');
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };

  if (WRITE_METHODS.has(method) && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> };
    throw new ApiError(
      response.status,
      payload.message ?? 'No fue posible completar la solicitud.',
      payload.errors ?? {},
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json() as Envelope<T> | T;

  if (payload && typeof payload === 'object' && 'data' in (payload as Envelope<T>)) {
    return (payload as Envelope<T>).data;
  }

  return payload as T;
}

/** URL directa (navegador) para ver o descargar un PDF manteniendo la sesión. */
export function documentFileUrl(id: string, action: 'download' | 'preview' = 'download'): string {
  return `${API_URL}/documents/${id}/${action}`;
}

export interface DocumentDetailPayload {
  document: Document;
  related: Document[];
  versions: unknown[];
  createdBy: User | null;
}

export interface DocumentFilters {
  types: string[];
  systems: string[];
  apps: string[];
  versions: string[];
  years: string[];
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<SessionPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () =>
    apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  register: (payload: unknown) =>
    apiRequest<{ id: string }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => apiRequest<SessionPayload>('/auth/me'),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (payload: unknown) =>
    apiRequest<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
};

export const documentsApi = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    apiRequest<Document[]>(`/documents${buildQuery(params)}`),
  detail: (id: string) => apiRequest<DocumentDetailPayload>(`/documents/${id}`),
  filters: () => apiRequest<DocumentFilters>('/documents/filters'),
  create: (payload: FormData) =>
    apiRequest<DocumentDetailPayload>('/documents', { method: 'POST', body: payload }),
  update: (id: string, payload: FormData | Record<string, unknown>) =>
    apiRequest<DocumentDetailPayload>(`/documents/${id}`, {
      method: 'PATCH',
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    }),
  updateStatus: (id: string, status: string) =>
    apiRequest<DocumentDetailPayload>(`/documents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  feedback: (id: string, helpful: boolean) =>
    apiRequest<{ helpful: boolean }>(`/documents/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    }),
};

export const requestsApi = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    apiRequest<DocumentRequest[]>(`/requests${buildQuery(params)}`),
  detail: (id: string) => apiRequest<DocumentRequest>(`/requests/${id}`),
  create: (payload: Record<string, unknown>) =>
    apiRequest<DocumentRequest>('/requests', { method: 'POST', body: JSON.stringify(payload) }),
  comment: (id: string, text: string, internal: boolean) =>
    apiRequest<DocumentRequest>(`/requests/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, internal }),
    }),
  transition: (id: string, status: string, comment?: string, internal = false) =>
    apiRequest<DocumentRequest>(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment, internal }),
    }),
  assign: (id: string, assignedTo: string, estimatedDate?: string) =>
    apiRequest<DocumentRequest>(`/requests/${id}/assignment`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedTo, estimatedDate }),
    }),
  production: (id: string, assignedTo: string, estimatedDate: string, instructions: string, comment: string) =>
    apiRequest<DocumentRequest>(`/requests/${id}/production`, {
      method: 'POST',
      body: JSON.stringify({ assignedTo, estimatedDate, instructions, comment }),
    }),
  linkDocument: (id: string, documentId: string, publish = false, comment?: string) =>
    apiRequest<DocumentRequest>(`/requests/${id}/document`, {
      method: 'PATCH',
      body: JSON.stringify({ documentId, publish, comment }),
    }),
  cancel: (id: string) =>
    apiRequest<DocumentRequest>(`/requests/${id}/cancel`, { method: 'PATCH' }),
  agents: () => apiRequest<User[]>('/requests/agents'),
};

export const notificationsApi = {
  list: (unreadOnly = false) =>
    apiRequest<Notification[]>(`/notifications${unreadOnly ? '?unread=1' : ''}`),
  markRead: (id: string) =>
    apiRequest<{ id: string; read: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAll: () =>
    apiRequest<{ updated: number; unread: number }>('/notifications/read-all', { method: 'PATCH' }),
};

export const profileApi = {
  show: () => apiRequest<User>('/profile'),
  update: (payload: ProfileUpdateInput) =>
    apiRequest<User>('/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
  updatePassword: (payload: PasswordChangeInput) =>
    apiRequest<{ message: string }>('/profile/password', { method: 'PATCH', body: JSON.stringify(payload) }),
  updatePreferences: (theme: string) =>
    apiRequest<User>('/profile/preferences', { method: 'PATCH', body: JSON.stringify({ theme }) }),
  updateOnboarding: (completed: boolean) =>
    apiRequest<User>('/profile/onboarding', { method: 'PATCH', body: JSON.stringify({ completed }) }),
};

export type { Permissions, SessionPayload };
