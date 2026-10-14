import type { Page } from '../types';

export interface TourStep {
  title: string;
  body: string;
  page: Page;
}

/**
 * Pasos del recorrido guiado del cliente.
 * Vive fuera del Layout para que el avance no se reinicie al cambiar de página.
 */
export const TOUR_STEPS: TourStep[] = [
  { title: 'Busca en la biblioteca', body: 'Usa el buscador principal para encontrar documentos por título, sistema, aplicativo o palabra clave.', page: 'client.dashboard' },
  { title: 'Aplica filtros', body: 'Combina tipo, sistema, aplicativo, versión y año para precisar los resultados.', page: 'client.library' },
  { title: 'Consulta y descarga', body: 'Abre cualquier resultado para ver sus datos, documentos relacionados y descargar el PDF.', page: 'client.library' },
  { title: 'Solicita un documento', body: 'Si no encuentras lo que necesitas, registra una solicitud desde la biblioteca o Mis solicitudes.', page: 'client.requests' },
  { title: 'Revisa el avance', body: 'Consulta el estado, la línea de tiempo y las respuestas del agente en un solo lugar.', page: 'client.requests' },
  { title: 'Mantente informado', body: 'Las novedades y solicitudes de información aparecen en tu centro de notificaciones.', page: 'client.notifications' },
  { title: 'Elige tu apariencia', body: 'En Mi cuenta puedes cambiar entre tema claro, oscuro o la preferencia de tu sistema.', page: 'client.profile' },
];
