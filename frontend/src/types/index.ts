export type UserRole = 'cliente' | 'agente';
export type UserStatus = 'activo' | 'inactivo';
export type DocType = 'Manual' | 'Comunicado';
export type DocFormat = 'PDF' | 'DOCX' | 'XLSX';
export type RequestType = 'Documento nuevo' | 'Actualización' | 'Corrección';
export type Priority = 'Baja' | 'Media' | 'Alta';
export type NotificationChannel = 'aplicación' | 'correo' | 'ambos';
export type ThemePreference = 'light' | 'dark' | 'system';

export type RequestStatus =
  | 'Recibida'
  | 'En validación'
  | 'Información adicional requerida'
  | 'Aprobada'
  | 'En producción'
  | 'Documento disponible'
  | 'Rechazada'
  | 'Cerrada';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  nit: string;
  jobTitle: string;
  system: string;
  userRole: UserRole;
  registeredAt: string;
  status: UserStatus;
  avatarInitials: string;
  themePreference?: ThemePreference;
  onboardingCompleted?: boolean;
}

export interface RegistrationData {
  email: string;
  nit: string;
  company: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  password: string;
}

export interface ProfileUpdateInput {
  phone?: string;
  company?: string;
  jobTitle?: string;
  system?: string;
}

export interface PasswordChangeInput {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}

export type DocumentStatus = 'borrador' | 'publicado' | 'inactivo';

export interface Document {
  id: string;
  title: string;
  description: string;
  type: DocType;
  system: string;
  app: string;
  version: string;
  year: number;
  publishedAt: string;
  updatedAt: string;
  format: DocFormat;
  fileSize: string;
  keywords: string[];
  isNew?: boolean;
  isUpdated?: boolean;
  views: number;
  downloads: number;
  relatedDocIds: string[];
  active: boolean;
  status?: DocumentStatus;
  currentVersion?: number;
}

export interface HistoryEntry {
  id: string;
  previousStatus: RequestStatus | null;
  newStatus: RequestStatus;
  date: string;
  userId: string;
  comment: string;
  internal: boolean;
  action?: string;
}

export interface Comment {
  id: string;
  requestId: string;
  userId: string;
  text: string;
  date: string;
  internal: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  mime: string;
  date: string;
  uploadedBy: string;
}

export interface DocumentRequest {
  id: string;
  number: string;
  clientId: string;
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
  status: RequestStatus;
  assignedTo?: string | null;
  estimatedDate?: string | null;
  createdAt: string;
  updatedAt: string;
  history: HistoryEntry[];
  comments: Comment[];
  attachments: Attachment[];
  notificationChannel: NotificationChannel;
  linkedDocumentId?: string | null;
  productionInstructions?: string;
  client?: User;
  assignee?: User | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'solicitud' | 'documento' | 'estado' | 'sistema';
  requestId?: string;
  documentId?: string;
  linkPath?: string | null;
}

export interface SessionPayload {
  user: User | null;
  permissions: Permissions | null;
  csrfToken: string;
}

export interface Permissions {
  manageDocuments: boolean;
  manageRequests: boolean;
  viewAllRequests: boolean;
  download: boolean;
  isDemo: boolean;
}

export type Page =
  | 'login'
  | 'client.dashboard'
  | 'client.library'
  | 'client.document'
  | 'client.requests'
  | 'client.request'
  | 'client.new-request'
  | 'client.profile'
  | 'client.notifications'
  | 'agent.dashboard'
  | 'agent.requests'
  | 'agent.request'
  | 'agent.documents';

export interface RouterState {
  page: Page;
  params?: Record<string, string>;
}
