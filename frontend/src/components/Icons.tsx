import type { DocType } from '../types';

interface IconProps {
  className?: string;
}

/**
 * Iconografía de contenido y de cuenta.
 * Trazos coherentes con el Icon de Layout: 24x24, stroke 1.8, sin relleno.
 */
function Svg({ className = 'w-5 h-5', children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

/** Manual: libro abierto con separador. */
export function ManualIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 6.5C10.5 5.2 8.4 4.5 6 4.5H4v13h2c2.4 0 4.5.7 6 2 1.5-1.3 3.6-2 6-2h2v-13h-2c-2.4 0-4.5.7-6 2z" />
      <path d="M12 6.5v13" />
    </Svg>
  );
}

/** Comunicado: megáfono de anuncios. */
export function ComunicadoIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      <path d="M18 9.5v3" />
    </Svg>
  );
}

/** Solicitud: portapapeles con líneas. */
export function RequestIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 4h6v3H9z" />
      <path d="M9 5.5H7a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6.5a1 1 0 0 0-1-1h-2" />
      <path d="M9.5 12h5M9.5 16h5" />
    </Svg>
  );
}

/** Icono según el tipo de documento. */
export function DocTypeIcon({ type, className }: { type: DocType; className?: string }) {
  return type === 'Manual' ? <ManualIcon className={className} /> : <ComunicadoIcon className={className} />;
}

export function UserIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      <path d="M12 14.5v2.5" />
    </Svg>
  );
}

export function PaletteIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.5-1.9-.3-1.2.6-2.1 1.7-2.1H17a4 4 0 0 0 4-4c0-5-4-10-9-10z" />
      <circle cx="7.5" cy="12" r="1" />
      <circle cx="9.5" cy="8" r="1" />
      <circle cx="14" cy="7.5" r="1" />
      <circle cx="17" cy="11" r="1" />
    </Svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="M13.5 6.5l3 3" />
    </Svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </Svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L14.5 13l4 1.5V18a2 2 0 0 1-2.2 2A15 15 0 0 1 3 6.2 2 2 0 0 1 5 4z" />
    </Svg>
  );
}

export function TagIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3.5 11.5V5a1.5 1.5 0 0 1 1.5-1.5h6.5L20 12l-8.5 8.5z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </Svg>
  );
}

export function BuildingIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="1.5" />
      <path d="M9 8h1.5M13.5 8H15M9 12h1.5M13.5 12H15M10 20.5v-4h4v4" />
    </Svg>
  );
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
    </Svg>
  );
}

export function LayersIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m12 3 8.5 4.5L12 12 3.5 7.5z" />
      <path d="m4 12 8 4.2 8-4.2M4 16.5l8 4.2 8-4.2" />
    </Svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </Svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}
