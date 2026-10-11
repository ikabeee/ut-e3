import { getServiceWorkerScript } from "@features/offline/lib/service-worker-queries";

/** /sw.js: service worker del sitio (ver docs/pwa.md). Las cabeceras están en next.config.ts. */
export async function GET() {
  return new Response(await getServiceWorkerScript(), {
    headers: { "Content-Type": "application/javascript; charset=utf-8" },
  });
}
