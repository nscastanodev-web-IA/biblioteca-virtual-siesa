/**
 * "Últimos documentos consultados" por usuario.
 *
 * El backend no expone una consulta de vistas por usuario, así que el
 * seguimiento se hace en el navegador (localStorage) por cada cuenta.
 */

const MAX_ITEMS = 6;

const storageKey = (userId: string) => `siesa-recently-viewed-${userId}`;

export function getRecentlyViewedIds(userId: string): string[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export function recordDocumentView(userId: string, documentId: string): void {
  if (!userId || !documentId) return;
  try {
    const current = getRecentlyViewedIds(userId).filter(id => id !== documentId);
    const next = [documentId, ...current].slice(0, MAX_ITEMS);
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // Almacenamiento no disponible: la sección simplemente queda vacía.
  }
}

export function clearRecentlyViewed(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // Ignorar.
  }
}
