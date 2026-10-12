import "server-only";
import { getServiceWorkerScript } from "@features/offline/lib/server/service-worker-queries";

/**
 * `GET /sw.js`: service worker del sitio (ver docs/pwa.md). `src/app/sw.js/route.ts` sólo
 * re-exporta este handler. Las cabeceras de caché están en next.config.ts.
 */
export async function GET() {
  return new Response(await getServiceWorkerScript(), {
    headers: { "Content-Type": "application/javascript; charset=utf-8" },
  });
}
