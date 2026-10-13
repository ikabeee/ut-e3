import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { listGames } from "@features/games/lib/server/games-queries";
import { buildPrecacheRoutes, PRECACHE_ASSET_URLS } from "@features/offline/lib/precache-routes";
import {
  CACHE_PREFIX,
  MAX_IMAGE_ENTRIES,
  NETWORK_TIMEOUT_MS,
  OFFLINE_PATH,
  SKIP_WAITING_MESSAGE,
} from "@features/offline/lib/service-worker-config";
import { buildServiceWorkerScript } from "@features/offline/lib/service-worker-script";

/**
 * Versión del sitio: el id de cada `next build` (`.next/BUILD_ID`, que Next escribe antes de
 * prerenderizar). Cuando cambia, cambian los nombres de las cachés y el navegador instala el worker
 * nuevo. Con `deploymentId` el id es fijo: en ese caso define `SERVICE_WORKER_VERSION`.
 */
function getServiceWorkerVersion() {
  if (process.env.SERVICE_WORKER_VERSION) return process.env.SERVICE_WORKER_VERSION;

  try {
    return readFileSync(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
  } catch {
    return "dev";
  }
}

/** Código de `/sw.js`. Los juegos salen de la caché de Next, así que la ruta se prerenderiza. */
export async function getServiceWorkerScript() {
  const games = await listGames();

  return buildServiceWorkerScript({
    version: getServiceWorkerVersion(),
    cachePrefix: CACHE_PREFIX,
    precacheUrls: buildPrecacheRoutes(games.map((game) => game.slug)),
    precacheAssetUrls: [...PRECACHE_ASSET_URLS],
    offlineUrl: OFFLINE_PATH,
    networkTimeoutMs: NETWORK_TIMEOUT_MS,
    maxImageEntries: MAX_IMAGE_ENTRIES,
    skipWaitingMessage: SKIP_WAITING_MESSAGE,
  });
}
