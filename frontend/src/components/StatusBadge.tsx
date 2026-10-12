import type { RequestStatus, Priority } from '../types';

const STATUS_STYLES: Record<RequestStatus, string> = {
  'Recibida': 'bg-blue-100 text-blue-800 border-blue-200',
  'En validación': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Información adicional requerida': 'bg-amber-100 text-amber-800 border-amber-200',
  'Aprobada': 'bg-green-100 text-green-800 border-green-200',
  'En producción': 'bg-purple-100 text-purple-800 border-purple-200',
  'Documento disponible': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Rechazada': 'bg-red-100 text-red-800 border-red-200',
  'Cerrada': 'bg-slate-100 text-slate-600 border-slate-200',
};

const PRIORITY_STYLES: Record<Priority, string> = {
  'Alta': 'bg-red-100 text-red-700 border-red-200',
  'Media': 'bg-amber-100 text-amber-700 border-amber-200',
  'Baja': 'bg-slate-100 text-slate-600 border-slate-200',
};

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md';
}

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${padding} ${cls}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const cls = PRIORITY_STYLES[priority] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap ${padding} ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${priority === 'Alta' ? 'bg-red-500' : priority === 'Media' ? 'bg-amber-500' : 'bg-slate-400'}`} />
      {priority}
    </span>
  );
}

export function DocTypeBadge({ type }: { type: string }) {
  const cls = type === 'Manual'
    ? 'bg-navy-100 text-navy-800 border-navy-200'
    : 'bg-teal-100 text-teal-800 border-teal-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      {type}
    </span>
  );
}

export function NewBadge({ label }: { label: string }) {
  const cls = label === 'Nuevo'
    ? 'bg-green-500 text-white'
    : 'bg-amber-500 text-white';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
