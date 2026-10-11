import type { ServiceWorkerConfig } from "@features/offline/lib/service-worker-config";
import { runServiceWorker } from "@features/offline/lib/service-worker";
import { extractStaticAssetUrls, getRequestStrategy } from "@features/offline/lib/service-worker-strategies";

/**
 * Arma el código de `/sw.js`: copia `runServiceWorker` y sus funciones puras con `toString()` y
 * les pasa la configuración como JSON. Así el worker se escribe y se prueba en TypeScript sin
 * agregar un bundler, y cada versión del sitio produce un archivo distinto (el navegador compara
 * los bytes de `/sw.js` para saber si hay una versión nueva).
 */
export function buildServiceWorkerScript(config: ServiceWorkerConfig) {
  const helpers = `{ getRequestStrategy: ${getRequestStrategy.toString()}, extractStaticAssetUrls: ${extractStaticAssetUrls.toString()} }`;

  return `"use strict";\n(${runServiceWorker.toString()})(self, ${JSON.stringify(config)}, ${helpers});\n`;
}
