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

/**
 * Archivos de la app instalada que se guardan al instalar (≈30 KB): el manifest y sus íconos, para
 * que el ícono de la pantalla de inicio y el de la pestaña se vean sin conexión. Si cambian los
 * íconos de `src/app/manifest.ts` o de `layout.tsx`, actualiza esta lista.
 */
export const PRECACHE_ASSET_URLS: readonly string[] = [
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];
