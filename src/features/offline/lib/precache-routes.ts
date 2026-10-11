import { OFFLINE_PATH } from "@features/offline/lib/service-worker-config";
import { getGamePath } from "@features/games/lib/game-links";
import { routes } from "@shared/lib/site-config";

/**
 * Páginas que el service worker guarda al instalarse: las secciones principales, la página
 * `/offline` y el detalle de cada juego. Así abren sin conexión aunque no se hayan visitado.
 */
export function buildPrecacheRoutes(gameSlugs: readonly string[]): string[] {
  const pages = [routes.home, routes.games, routes.floorPlan, OFFLINE_PATH, ...gameSlugs.map(getGamePath)];
  return [...new Set(pages)];
}
