/**
 * Funciones puras del service worker. Se copian tal cual dentro de `/sw.js`
 * (ver `service-worker-script.ts`), así que NO pueden usar imports ni variables de este módulo;
 * lo que necesitan llega por parámetros.
 */

/** Cómo responde el service worker a cada petición (ver la tabla de `docs/pwa.md`). */
export type RequestStrategy =
  | "bypass" // El navegador la resuelve sin el service worker (otro origen, POST, video...).
  | "static" // Cache first: `/_next/static/*` lleva hash en el nombre y nunca cambia.
  | "page" // Network first con tiempo límite; respaldo en caché y luego `/offline`.
  | "private-page" // Red sin guardar copia (datos de un visitante); sin conexión, `/offline`.
  | "rsc" // Navegación interna de Next: red con tiempo límite; si falla, recarga completa.
  | "image" // Stale-while-revalidate con límite de entradas.
  | "api" // Network first con respaldo en caché.
  | "network"; // Red; si falla, cualquier copia guardada.

export type StrategyRequest = Pick<Request, "url" | "method" | "mode" | "destination" | "headers">;

export function getRequestStrategy(request: StrategyRequest, origin: string): RequestStrategy {
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== origin) return "bypass";

  // El video del reel nunca se guarda: pesa mucho y sin conexión basta el póster.
  if (request.destination === "video" || request.headers.has("range")) return "bypass";

  if (url.pathname.startsWith("/media/") && /\.(webm|mp4)$/.test(url.pathname)) return "bypass";

  if (url.pathname === "/sw.js") return "bypass";

  // El panel de administración (`ADMIN_PATH`) es privado: nunca se guarda en la caché del navegador.
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return "bypass";

  // Peticiones RSC: navegación interna y prefetch del router de Next.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return "rsc";

  if (request.mode === "navigate") {
    // El pasaporte (`PASSPORT_PATH`) y el enlace del QR (`VISITOR_QR_PATH`) muestran el gamertag y
    // el token secreto del visitante: no se guardan, así el token no sale de la cookie `httpOnly`.
    const isPrivatePage = url.pathname === "/passport" || url.pathname.startsWith("/v/");

    return isPrivatePage ? "private-page" : "page";
  }

  if (url.pathname.startsWith("/_next/static/")) return "static";

  if (url.pathname.startsWith("/_next/image") || url.pathname.startsWith("/mock/") || request.destination === "image") {
    return "image";
  }

  if (url.pathname.startsWith("/api/")) return "api";

  return "network";
}

/**
 * Busca los archivos de `/_next/static/` que menciona un HTML o una hoja de estilos (scripts,
 * CSS, fuentes). Así el service worker sabe qué archivos con hash precargar sin una lista
 * generada en el build. Las URLs relativas (`url(../media/font.woff2)` en CSS) se resuelven
 * contra `baseUrl`.
 */
export function extractStaticAssetUrls(text: string, baseUrl: string, origin: string): string[] {
  const found = new Set<string>();
  // Rutas absolutas `/_next/static/...` que no sean parte de una URL de otro dominio (el carácter
  // previo no puede ser letra, número, punto, guion ni `:`), y las `url(...)` de una hoja de estilos.
  const paths = [...text.matchAll(/(?:^|[^\w.:-])(\/_next\/static\/[^"'\s()\\<>]+)/g)];
  const cssUrls = [...text.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)];

  for (const [, raw] of [...paths, ...cssUrls]) {
    if (raw.startsWith("data:")) continue;
    const url = new URL(raw.replaceAll("&amp;", "&"), baseUrl);

    if (url.origin === origin && url.pathname.startsWith("/_next/static/")) {
      found.add(url.href);
    }
  }

  return [...found];
}
