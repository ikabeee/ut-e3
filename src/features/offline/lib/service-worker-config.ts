/** Ruta de la página de respaldo que el service worker muestra sin conexión. */
export const OFFLINE_PATH = "/offline";

/** URL del service worker. La sirve el Route Handler `src/app/sw.js/route.ts`. */
export const SERVICE_WORKER_PATH = "/sw.js";

/** Mensaje que la página envía al worker en espera para activarlo ("Hay una versión nueva"). */
export const SKIP_WAITING_MESSAGE = "SKIP_WAITING";

/** Prefijo de todas las cachés del sitio. `activate` borra las que no son de la versión actual. */
export const CACHE_PREFIX = "ut-e3";

/** Tiempo máximo de espera a la red antes de responder con la copia guardada. */
export const NETWORK_TIMEOUT_MS = 3000;

/** Máximo de imágenes guardadas; al pasarlo se borran las más antiguas. */
export const MAX_IMAGE_ENTRIES = 60;

/** Configuración que se inyecta en el service worker al construir `/sw.js`. */
export interface ServiceWorkerConfig {
  /** Versión del sitio; forma parte del nombre de cada caché. */
  version: string;
  cachePrefix: string;
  /** Páginas (HTML) que se guardan al instalar. */
  precacheUrls: string[];
  offlineUrl: string;
  networkTimeoutMs: number;
  maxImageEntries: number;
  skipWaitingMessage: string;
}
