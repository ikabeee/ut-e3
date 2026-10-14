import type { ServiceWorkerConfig } from "@features/offline/lib/service-worker-config";
import type { RequestStrategy, StrategyRequest } from "@features/offline/lib/service-worker-strategies";

/*
 * Service worker del sitio, escrito a mano (ver docs/pwa.md).
 *
 * `runServiceWorker` se copia tal cual dentro de `/sw.js` con `Function.prototype.toString()`
 * (ver `service-worker-script.ts`). Por eso NO puede usar imports ni variables de este módulo
 * en tiempo de ejecución (los `import type` se borran al compilar); lo que necesita llega por parámetros.
 */

interface ExtendableEventLike {
  waitUntil(promise: Promise<unknown>): void;
}

interface FetchEventLike extends ExtendableEventLike {
  request: Request;
  respondWith(response: Promise<Response>): void;
}

interface MessageEventLike {
  data: unknown;
}

/** Lo que el service worker usa de `self` (`ServiceWorkerGlobalScope`). */
export interface ServiceWorkerScope {
  location: { origin: string };
  caches: CacheStorage;
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void> };
  addEventListener(type: "install" | "activate", listener: (event: ExtendableEventLike) => void): void;
  addEventListener(type: "fetch", listener: (event: FetchEventLike) => void): void;
  addEventListener(type: "message", listener: (event: MessageEventLike) => void): void;
}

/** Funciones puras de `service-worker-strategies.ts`, que también se copian en `/sw.js`. */
export interface ServiceWorkerHelpers {
  getRequestStrategy(request: StrategyRequest, origin: string): RequestStrategy;
  extractStaticAssetUrls(text: string, baseUrl: string, origin: string): string[];
}

export function runServiceWorker(
  scope: ServiceWorkerScope,
  config: ServiceWorkerConfig,
  helpers: ServiceWorkerHelpers,
) {
  const origin = scope.location.origin;

  const cacheNames = {
    static: `${config.cachePrefix}-static-${config.version}`,
    pages: `${config.cachePrefix}-pages-${config.version}`,
    images: `${config.cachePrefix}-images-${config.version}`,
    api: `${config.cachePrefix}-api-${config.version}`,
  };

  const currentCaches = new Set(Object.values(cacheNames));
  const offlineUrl = new URL(config.offlineUrl, origin).href;

  function timeout(ms: number) {
    return new Promise<never>((_resolve, reject) => {
      setTimeout(() => reject(new Error("timeout")), ms);
    });
  }

  /** Clave de una página en caché: sin `?query` (`/games?genre=Puzle` usa el HTML de `/games`). */
  function pageKey(requestUrl: string) {
    const url = new URL(requestUrl);

    return `${url.origin}${url.pathname}`;
  }

  function isCacheable(response: Response) {
    return response.ok && !response.redirected;
  }

  async function trimCache(cacheName: string, maxEntries: number) {
    const cache = await scope.caches.open(cacheName);
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((key) => cache.delete(key)));
  }

  /** Guarda los archivos con hash que usan las páginas precargadas (JS, CSS y fuentes de CSS). */
  async function precacheStaticAssets(assetUrls: Iterable<string>) {
    const cache = await scope.caches.open(cacheNames.static);
    const pending = [...new Set(assetUrls)];
    const seen = new Set(pending);

    while (pending.length > 0) {
      const batch = pending.splice(0);
      await Promise.allSettled(
        batch.map(async (assetUrl) => {
          const response = await scope.fetch(assetUrl);

          if (!isCacheable(response)) return;

          if (new URL(assetUrl).pathname.endsWith(".css")) {
            const css = await response.clone().text();

            for (const nested of helpers.extractStaticAssetUrls(css, assetUrl, origin)) {
              if (!seen.has(nested)) {
                seen.add(nested);
                pending.push(nested);
              }
            }
          }

          await cache.put(assetUrl, response);
        }),
      );
    }
  }

  /** Instalación: guarda las páginas y los archivos que necesitan para abrir sin conexión. */
  async function precache() {
    const pages = await scope.caches.open(cacheNames.pages);
    const assetUrls = new Set<string>();

    await Promise.allSettled(
      config.precacheUrls.map(async (path) => {
        const url = new URL(path, origin).href;
        // `no-cache`: revalida con el servidor en lugar de usar la caché HTTP del navegador.
        const response = await scope.fetch(url, { cache: "no-cache" });

        if (!isCacheable(response)) throw new Error(`No se pudo precargar ${path}: ${response.status}`);
        const html = await response.clone().text();

        for (const assetUrl of helpers.extractStaticAssetUrls(html, url, origin)) assetUrls.add(assetUrl);
        await pages.put(url, response);
      }),
    );

    // Sin la página de respaldo la instalación falla y el navegador lo reintenta en otra visita.
    if (!(await pages.match(offlineUrl))) {
      throw new Error("No se pudo precargar la página sin conexión");
    }

    await precacheStaticAssets(assetUrls);
    await precacheAppAssets();
  }

  /** Manifest e íconos de la app instalada. Si alguno falla, la instalación sigue. */
  async function precacheAppAssets() {
    const cache = await scope.caches.open(cacheNames.static);
    await Promise.allSettled(
      config.precacheAssetUrls.map(async (path) => {
        const url = new URL(path, origin).href;
        const response = await scope.fetch(url, { cache: "no-cache" });

        if (isCacheable(response)) await cache.put(url, response);
      }),
    );
  }

  async function deleteOldCaches() {
    const names = await scope.caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith(`${config.cachePrefix}-`) && !currentCaches.has(name))
        .map((name) => scope.caches.delete(name)),
    );
  }

  async function cacheFirst(request: Request) {
    const cache = await scope.caches.open(cacheNames.static);
    const cached = await cache.match(request);

    if (cached) return cached;

    const response = await scope.fetch(request);

    if (isCacheable(response)) void cache.put(request, response.clone()).catch(() => undefined);

    return response;
  }

  /**
   * Network first: espera a la red hasta `networkTimeoutMs`. Si tarda más o falla, responde con la
   * copia guardada; si no hay copia, sigue esperando a la red y al final usa `fallback`.
   */
  async function networkFirst(request: Request, cacheName: string, key: string, fallback: () => Promise<Response>) {
    const cache = await scope.caches.open(cacheName);

    const network = scope.fetch(request).then((response) => {
      if (isCacheable(response)) void cache.put(key, response.clone()).catch(() => undefined);

      return response;
    });

    network.catch(() => undefined);

    try {
      return await Promise.race([network, timeout(config.networkTimeoutMs)]);
    } catch {
      const cached = await cache.match(key);

      if (cached) return cached;
    }

    try {
      return await network;
    } catch {
      return fallback();
    }
  }

  async function offlinePage() {
    const cached = await scope.caches.match(offlineUrl);

    return cached ?? Response.error();
  }

  /** Página con datos de una persona: siempre de la red y nunca se guarda; sin conexión, `/offline`. */
  async function privatePage(request: Request) {
    try {
      return await scope.fetch(request);
    } catch {
      return offlinePage();
    }
  }

  /**
   * Navegación interna de Next (RSC). No se guarda: si la red falla, un 503 hace que Next cambie
   * a una navegación completa, que este mismo worker responde con el HTML guardado o `/offline`.
   */
  async function rscRequest(request: Request) {
    try {
      return await Promise.race([scope.fetch(request), timeout(config.networkTimeoutMs)]);
    } catch {
      return new Response(null, { status: 503, statusText: "Offline", headers: { "Cache-Control": "no-store" } });
    }
  }

  async function staleWhileRevalidate(request: Request) {
    const cache = await scope.caches.open(cacheNames.images);
    // También busca en las demás cachés: los íconos de la app se precargan en la de estáticos.
    const cached = (await cache.match(request)) ?? (await scope.caches.match(request));

    const network = scope.fetch(request).then(async (response) => {
      if (isCacheable(response)) {
        await cache.put(request, response.clone());
        await trimCache(cacheNames.images, config.maxImageEntries);
      }

      return response;
    });

    if (cached) {
      network.catch(() => undefined);

      return cached;
    }

    return network;
  }

  async function networkWithAnyCache(request: Request) {
    try {
      return await scope.fetch(request);
    } catch {
      return (await scope.caches.match(request)) ?? Response.error();
    }
  }

  function respond(request: Request, strategy: Exclude<RequestStrategy, "bypass">) {
    switch (strategy) {
      case "static":
        return cacheFirst(request);
      case "page":
        return networkFirst(request, cacheNames.pages, pageKey(request.url), offlinePage);
      case "private-page":
        return privatePage(request);
      case "rsc":
        return rscRequest(request);
      case "image":
        return staleWhileRevalidate(request);
      case "api":
        return networkFirst(request, cacheNames.api, request.url, async () => Response.error());
      default:
        return networkWithAnyCache(request);
    }
  }

  // Sin `skipWaiting()` aquí: una versión nueva espera a que la persona acepte el aviso
  // "Hay una versión nueva" (o a que cierre todas las pestañas). Ver docs/pwa.md.
  scope.addEventListener("install", (event) => {
    event.waitUntil(precache());
  });

  scope.addEventListener("activate", (event) => {
    event.waitUntil(deleteOldCaches().then(() => scope.clients.claim()));
  });

  scope.addEventListener("message", (event) => {
    // SAFETY: Se comprueba la estructura del mensaje recibido antes de acceder a su propiedad type.
    const data = event.data as { type?: unknown } | null;

    if (data?.type === config.skipWaitingMessage) void scope.skipWaiting();
  });

  scope.addEventListener("fetch", (event) => {
    const strategy = helpers.getRequestStrategy(event.request, origin);

    if (strategy === "bypass") return;
    event.respondWith(respond(event.request, strategy));
  });
}
