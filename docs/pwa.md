# Sitio sin conexión (PWA)

El internet de la sede del evento se cae. Esta guía explica cómo el sitio sigue funcionando sin
conexión, cómo probarlo y qué hacer el día del evento. El código vive en la feature
`src/features/offline/`.

> Un service worker sólo ayuda a quien ya abrió el sitio **con** conexión al menos una vez. Por
> eso la parte más importante del día del evento es lograr esa primera visita (ver la lista final).

## Piezas

| Pieza | Archivo | Qué hace |
| --- | --- | --- |
| Service worker | `src/features/offline/lib/service-worker.ts` | Guarda páginas y archivos y responde sin red. |
| Funciones puras del worker | `src/features/offline/lib/service-worker-strategies.ts` | Elige la estrategia de cada petición y encuentra los archivos con hash de un HTML o CSS. |
| `/sw.js` | `src/app/sw.js/route.ts` (re-exporta `api/offline-route.ts`) → `lib/server/service-worker-queries.ts` → `lib/service-worker-script.ts` | Arma el archivo del worker con la versión y la lista de páginas. Se prerenderiza en el build. |
| Páginas y archivos a precargar | `src/features/offline/lib/precache-routes.ts` | `/`, `/games`, `/floor-plan`, `/offline` y `/games/<slug>` de cada juego, más el manifest y los íconos (`PRECACHE_ASSET_URLS`). |
| Constantes | `src/features/offline/lib/service-worker-config.ts` | Tiempo límite de red (3 s), máximo de imágenes (60), prefijo de cachés. |
| Registro y actualización | `src/features/offline/hooks/use-service-worker.ts` y `components/service-worker-registration.tsx` | Registra `/sw.js` (sólo en producción) y muestra "Hay una versión nueva". |
| Aviso de conexión | `src/features/offline/components/offline-banner.tsx` y `hooks/use-is-offline.ts` | "Sin conexión. Lo que ya visitaste sigue disponible." |
| Página `/offline` | `src/features/offline/pages/offline-page.tsx` | Respaldo para rutas que no están guardadas. No se indexa ni va en el sitemap. |
| Textos | `src/features/offline/lib/offline-copy.ts` | Avisos de conexión y de versión nueva, y textos de `/offline`. |
| Configuración | `next.config.ts` | `experimental.useOffline: true` y cabeceras de `/sw.js`. |

`src/app/layout.tsx` monta `OfflineNotices` (aviso de conexión + registro del worker). Junto con
la cabecera y el pie de `site`, es la excepción a "`src/app` sólo importa pages", declarada en
`eslint.config.mjs` (`rootLayoutImports`).

## Por qué un service worker escrito a mano

La guía de PWA de Next enlaza [Serwist](https://github.com/serwist/serwist). Su integración con
Turbopack (`@serwist/turbopack` 9.5) sirve el worker desde un Route Handler que exporta
`dynamicParams = false` y `dynamic = "force-static"`, y su propio código dice que es "para cuando
NO se usa `cacheComponents`". Next rechaza esas opciones con `cacheComponents`, que este proyecto
tiene activado. Además agregaba tres dependencias (`serwist`, `@serwist/turbopack` y `esbuild`).

El worker escrito a mano resuelve los dos problemas que Serwist resolvía:

- **La lista de archivos con hash.** No se genera en el build: al instalarse, el worker descarga
  cada página precargada, busca en su HTML los archivos de `/_next/static/` (scripts, CSS y los
  chunks que menciona el payload de React) y, en cada CSS, las fuentes de `url(...)`. Así la
  lista siempre corresponde al build que se está sirviendo y no hay nada que mantener.
- **Escribirlo y probarlo en TypeScript sin bundler.** `runServiceWorker` y sus funciones puras
  se copian dentro de `/sw.js` con `Function.prototype.toString()`. Por eso esas funciones **no
  pueden usar imports ni variables del módulo**: todo les llega por parámetros. Las pruebas de
  `__tests__/lib/service-worker.test.ts` las ejecutan con una Cache API simulada.

## Estrategias

| Recurso | Estrategia | Caché |
| --- | --- | --- |
| `/_next/static/*` (JS, CSS, fuentes) | Cache first: llevan hash en el nombre y nunca cambian. | `ut-e3-static-<versión>` |
| HTML de `/`, `/games`, `/floor-plan`, `/offline` y `/games/<slug>` | Se precargan al instalar. Network first con tiempo límite de 3 s y respaldo en caché. La clave no lleva `?query` (`/games?genre=Puzle` usa `/games`). | `ut-e3-pages-<versión>` |
| Navegación a una ruta no guardada, sin conexión | Responde la página `/offline`. Con conexión, la red responde (un 404 sigue siendo 404). | |
| Peticiones RSC de Next (`?_rsc=` o cabecera `RSC: 1`) | Red con tiempo límite de 3 s. Si falla, responde 503 y Next cambia a una navegación completa, que el worker responde con el HTML guardado. Así la navegación interna no se queda colgada. | No se guardan |
| Manifest e íconos (`/manifest.webmanifest`, `/icon.svg`, `/icons/*.png`) | Se precargan al instalar (≈30 KB) para que la app instalada muestre su ícono sin conexión. Si alguno falla, la instalación sigue. Si cambian los íconos de `src/app/manifest.ts`, actualiza `PRECACHE_ASSET_URLS`. | `ut-e3-static-<versión>` |
| Imágenes (`/_next/image`, `/mock/*` y el póster) | Stale-while-revalidate, máximo 60 entradas (se borran las más antiguas). Sólo las que ya se vieron. | `ut-e3-images-<versión>` |
| `/api/*` | Network first con respaldo en caché. | `ut-e3-api-<versión>` |
| Video `/media/reel.webm` y `.mp4`, peticiones con `Range` | Nunca pasan por el worker. Sin conexión se ve el póster. | |
| Otro dominio, métodos distintos de GET, `/sw.js` | Nunca pasan por el worker. | |
| Lo demás del mismo origen (manifest, ícono...) | Red; si falla, cualquier copia guardada. | |

Además, `experimental.useOffline` hace que Next deje pendiente (y reintente al volver la red) una
navegación o Server Action que falla. El aviso combina `useOffline()` (detecta peticiones que
fallan aunque el sistema diga que hay red, como un wifi sin internet) con `navigator.onLine`
(cubre la página que ya abrió sin conexión desde el worker, donde no ha fallado ninguna petición).

### Tamaño

Medido con el catálogo mock de 18 juegos: 22 páginas, 40 archivos de `/_next/static/` y 6 del
manifest e íconos. Transferencia ≈ 1 MB comprimido (parte ya está en la caché HTTP de la primera
visita) y ≈ 3.2 MB guardados sin comprimir en el teléfono. Cada juego agrega ≈ 10 KB comprimidos.

## Versiones y actualizaciones

- **Versión.** Es el id de cada `next build` (`.next/BUILD_ID`), que se escribe dentro de `/sw.js`
  y en el nombre de cada caché. Si usan `deploymentId`, Next fija ese id: definan entonces
  `SERVICE_WORKER_VERSION` en el build (por ejemplo, el commit).
- **Detección.** `/sw.js` se sirve con `Cache-Control: no-cache, no-store, must-revalidate` y se
  registra con `updateViaCache: "none"`. En cada visita el navegador lo compara byte a byte; si
  cambió, instala el worker nuevo, que precarga las páginas y archivos de la versión nueva en sus
  propias cachés, **sin tocar las de la versión anterior**.
- **Sin `skipWaiting` a ciegas.** El worker nuevo queda en espera mientras haya una pestaña abierta
  con la versión anterior. Si se activara solo, `activate` borraría las cachés viejas y una página
  abierta podría pedir un chunk que ya no existe. En su lugar aparece el aviso **"Hay una versión
  nueva del sitio"** con el botón **Actualizar**: envía `SKIP_WAITING` al worker en espera, éste se
  activa, borra las cachés viejas y la página se recarga con la versión nueva.
- Si nadie pulsa el botón, la versión nueva se activa sola cuando se cierran todas las pestañas
  del sitio.
- La primera instalación no muestra el aviso ni recarga: el worker toma el control con
  `clients.claim()` porque no hay versión anterior.

En `npm run dev` el worker no se registra (y se quita uno que haya quedado de `npm start`).

## Cómo probar sin conexión

Siempre con el build de producción: `cp .env.example .env && npm run build && npm start`.

### En Chrome (DevTools)

1. Abre `http://localhost:3000/` y espera unos segundos.
2. DevTools → **Application** → **Service workers**: `/sw.js` debe estar *activated and is running*.
   En **Cache storage** verás `ut-e3-pages-<versión>` (22 páginas) y `ut-e3-static-<versión>`.
3. Marca **Offline** (en Application → Service workers o en Network).
4. Recarga y recorre `/`, `/games`, un juego que no hayas abierto y `/floor-plan`, escribiendo la
   URL y con los enlaces. Abajo aparece "Sin conexión. Lo que ya visitaste sigue disponible.".
5. Abre `/cualquier-cosa`: debe mostrar "Estás sin conexión".
6. Desmarca **Offline**: el aviso desaparece.

`localhost` cuenta como origen seguro; en otra máquina el service worker necesita HTTPS.

### En un teléfono (modo avión)

1. Abre el sitio publicado (HTTPS) con datos o wifi y espera unos segundos en la portada.
2. Opcional: "Agregar a pantalla de inicio".
3. Cierra el navegador, activa el **modo avión** y vuelve a abrir el sitio (o el ícono).
4. Recorre las cuatro secciones y un juego que no hayas abierto.

### Probar una actualización

Con el sitio abierto, haz otro `npm run build` y reinicia `npm start`. Al recargar (o al volver a
la pestaña tras un rato) aparece "Hay una versión nueva del sitio"; **Actualizar** recarga y en
Cache storage sólo quedan las cachés de la versión nueva.

## Lista para el día del evento

- **Antes del evento.** Difundir el enlace o QR días antes (redes de la universidad, carteles) y
  pedir "ábrelo una vez y agrégalo a tu pantalla de inicio". Con una visita con internet el
  teléfono ya guarda el catálogo, cada juego y el croquis.
- **Publicar la versión final antes.** Cada build es una versión nueva que se vuelve a descargar.
  Eviten publicar cambios el mismo día para que nadie tenga que actualizar dentro de la sede.
- **En la entrada.** Colocar el QR donde sí haya señal (o en la red de la sede), no dentro del
  edificio sin cobertura, y pedir que esperen unos segundos en la portada.
- **Plan B en la red local.** El sitio es estático: una laptop conectada al router de la sede
  puede servir una copia con `npm run build && npm start` aunque no haya internet, con un segundo
  QR a su IP (`http://192.168.x.x:3000`). Sin HTTPS el service worker no se registra en esa copia,
  pero en la red local no hace falta.
- **Probar en un teléfono real** en modo avión el día anterior, con la versión publicada.
