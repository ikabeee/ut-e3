# PWA instalable y pasaporte sin conexión (RNF-14)

Estado: implementado en `feature/pwa` (desde `develop`), pendiente de revisión.

## Alcance

- **Manifest** (`src/app/manifest.ts` -> `pwa/lib/pwa-manifest.ts`): `name` y `short_name` "PIXEL & CODE" (de
  `siteConfig`), `start_url` `/passport`, `scope` `/`, `display: standalone`, `lang: es`, `theme_color` y
  `background_color` negros (`--utg-black` del sistema de diseño; `siteConfig.themeColor` y `backgroundColor`). Íconos 192
  y 512 y uno maskable en `public/icons/`, generados con sharp a partir de `src/app/icon.svg`.
- **Service worker** (`public/sw.js`, escrito a mano, sin dependencias) con sus reglas en `public/sw-policy.js`. Se sirve
  con `Cache-Control: no-cache` y `Service-Worker-Allowed: /` (`next.config.ts`).
  - Páginas públicas: red primero con copia de respaldo (la copia solo responde sin red o tras 4 s si ya existía). Lista
    permitida: `/`, `/games`, `/games/<slug>`, `/sponsors`, `/privacy` y `/offline`.
  - `/_next/static`: primero la copia (los nombres llevan hash). Imágenes (`/_next/image` y las de `public/`): copia y
    actualización en segundo plano, con un máximo de 150.
  - Todo lo demás se ignora: `/passport` (se manda a `/offline` sin red), `/api`, `/admin`, `/stand`, `/support`,
    `/tournament`, `/login`, `/activate`, `/register`, los datos RSC de Next y cualquier petición que no sea GET.
  - Nombre de las cachés con versión (`pwa-pages-v1`, `pwa-assets-v1`, `pwa-images-v1`): subir `CACHE_VERSION` borra las
    anteriores al activar.
  - Precarga (item 4): al instalarse guarda `/` y `/offline`; después, la página le pide al worker las rutas de
    `GET /api/pwa/precache` (portada con croquis, catálogo, cada juego, patrocinadores, privacidad), cada 6 horas como
    máximo. Con cada página guarda sus scripts, estilos, imágenes y hasta 30 fuentes. El worker solo acepta rutas públicas.
- **Pasaporte sin conexión** (item 3): `PassportSnapshotSaver` guarda en `localStorage` del teléfono (`ute3.passport.v1`)
  el PIN, el gamertag, las visitas y la hora de carga, tras cada carga correcta. Sin red, `/passport` redirige a
  `/offline?from=/passport`, que lee esa copia y muestra "Sin conexión. Datos de hace X" (se actualiza cada 30 s). Una
  copia rota o ausente no muestra nada: ahí `/offline` solo explica que no hay copia y enlaza el catálogo y el inicio.
- **Dispositivo reemplazado** (item 5): `/register` borra la copia (`ClearPassportSnapshot`). Un teléfono que ya no es el
  activo llega ahí desde `/passport` en cuanto tiene red.
- **Indicador de conexión y reintento** (item 6): `ConnectionIndicator` en el pasaporte y en `/offline`. Al volver la red,
  el pasaporte refresca sus datos y `/offline` vuelve a la página que se quería abrir (`?from=`, solo rutas del sitio).
- **Instalar la app** (item 7): `InstallAppPrompt` en el pasaporte. Con `beforeinstallprompt` (que el layout captura desde
  la primera página) muestra el botón; en Safari de iPhone, los pasos de Compartir y Añadir a pantalla de inicio; instalada
  o en otro navegador no muestra nada.
- **Registro** solo en producción y desde páginas del flujo público y del visitante (`ServiceWorkerRegistration` en el
  layout, permitido en la regla `rootLayoutImports`). El staff nunca lo dispara, aunque si un navegador ya lo tiene
  registrado el worker deja pasar sus páginas sin tocarlas.
- **Crear mi pasaporte** (item 9): enlace al final de la barra de la landing y segundo botón en la portada, hacia
  `/register`, que ya muestra "El registro se abre el ..." mientras está cerrado.

## Pruebas

- Jest: reglas del worker (el archivo real `public/sw-policy.js`, ejecutado en un `vm`), manifest, alcance del registro,
  captura del evento de instalación, copia del pasaporte (formato, edad, almacenamiento roto), indicador, instalación,
  `/offline`, ruta de precarga.
- `npm run test:e2e:pwa`: construye y sirve la app en producción en localhost; el visitante se registra, el worker toma el
  control y guarda 18 juegos, el teléfono pasa a sin conexión (`context.setOffline`), el pasaporte, la portada con croquis,
  el catálogo y un juego siguen visibles, la red vuelve y la página reintenta sola, el staff no deja nada en las cachés y,
  tras una recuperación de dispositivo, el teléfono viejo borra su copia.

## Decisiones donde la SRS no cerraba

- **Nombre de la app.** El encargo pedía "UT Game Showcase"; la SRS (RF-01) fija "PIXEL & CODE" y `siteConfig` ya lo usa.
  Se usó "PIXEL & CODE" (decisión del usuario).
- **Cómo se guarda el pasaporte.** La SRS no pide el pasaporte sin conexión (RNF-14 solo habla del contenido público) y
  `/passport` responde `no-store`. Se guarda una copia en `localStorage` del teléfono y no la respuesta HTTP, así no hay
  excepción para esa página (decisión del usuario).
- **Teléfono reemplazado y sin red.** Un teléfono ya reemplazado (RF-18, RF-70) que sigue sin conexión sigue mostrando su
  copia hasta que vuelve la red; entonces `/passport` lo manda a `/register` y la copia se borra. Aceptado, sin caducidad.
  El PIN solo no registra visitas por sí mismo: el servidor valida (EC-04, riesgo ya aceptado).
- **No hay "cerrar sesión" del visitante.** El encargo pedía borrar la copia al cerrar sesión; el pasaporte se identifica
  por la cookie del dispositivo y no tiene salida. La copia se borra al reemplazar el dispositivo. El cierre de sesión del
  staff no toca el pasaporte (otra cookie, otra pantalla).
- **Sin excepción a `no-store`.** El service worker obedece siempre `no-store` y `private`. Para que las páginas públicas
  se puedan guardar, no deben leer el reloj, la sesión ni cookies en el servidor. En las fichas de juego, el enlace a
  itch.io (RF-10) salió de la página: `LiveItchLink` (componente de cliente) pide `GET /api/games/<slug>/itch`, una ruta
  dinámica que decide con la hora del servidor y responde `Cache-Control: no-store` (el worker ignora `/api`). El URL de
  itch.io no viaja en el HTML ni en los datos de la ficha ni de la portada (`Game` ya no lleva `itchUrl`) antes de la hora
  de activación. `useNow` solo repite la consulta cada 30 s mientras el enlace no está abierto. RF-10 se cumple tal cual.
- **Contenido guardado vs. actual.** Las páginas se piden con red primero, así que en línea siempre se ve lo último; sin red
  se ve lo último que se guardó. Los textos que dependen de la hora (el enlace a itch.io) pueden estar
  desactualizados sin conexión: se ve la última respuesta del servidor o nada si nunca hubo una.
- **La app instalada abre en `/passport`.** Quien no tiene pasaporte llega a `/register` (ya existe).
- **Navegadores.** En iPhone la instalación es manual (pasos escritos). Firefox de escritorio no instala PWA; el worker sí
  funciona. No se probó en dispositivos físicos.

## Pruebas manuales

1. `npm run db:deploy && npm run db:seed && npm run db:seed:stands`, luego `npm run build && npm start` (en desarrollo el
   worker no se registra). Con `NEXT_PUBLIC_SITE_URL=http://localhost:3000`; los service workers solo corren en localhost
   o HTTPS.
2. Abre `http://localhost:3000/register`, crea un pasaporte (el registro queda abierto con `db:seed:stands`) y espera
   unos segundos en `/passport`. En Chrome: DevTools, Application, Service Workers (estado "activated") y Cache Storage
   (`pwa-pages-v1` con `/`, `/games` y cada juego).
3. **Modo avión.** En DevTools marca Network, Offline (o activa el modo avión del teléfono) y recarga `/passport`: ves el
   PIN con "Sin conexión. Datos de hace X". Abre `/`, `/games` y un juego: siguen disponibles. Quita Offline: la página
   vuelve sola al pasaporte.
4. **Instalar en Android o escritorio (Chrome).** Menú, "Instalar app" (o el botón "Instalar la app" del pasaporte).
5. **Instalar en iPhone (Safari).** El pasaporte muestra los pasos: Compartir, Añadir a pantalla de inicio. Para probar
   en un teléfono real hace falta HTTPS (por ejemplo un túnel o el VPS); `http://192.168.x.x` no registra el worker.
6. **Reemplazo.** Con `db:seed:support`, entra como `help-desk@ejemplo.com` a `/support/recovery`, recupera el pasaporte,
   abre el enlace en otro navegador y recarga `/passport` en el primero: va a `/register` y la copia desaparece
   (`localStorage` sin `ute3.passport.v1`).

## Pendiente

- **Tarjeta del Marketplace (RF-05, RF-06) fuera de la portada.** Se quitó de la composición de `/` hasta tener el URL del
  formulario (sigue "por definir" en la SRS): su estado depende de la hora del servidor, lo que dejaba la portada en
  `private, no-store` y sin poder guardarse para uso sin conexión. La franja "Marketplace" informativa de las actividades
  (RF-05) se queda. `MarketplaceSlot`, `MarketplaceCard`, `marketplace-registration` y sus pruebas siguen en el
  repositorio; para volver a conectarla, pasa `marketplace={<MarketplaceSlot settings={settings} />}` a `LandingView`
  (y revisa que `/` siga siendo estática si importa guardarla sin conexión).

- Reemplazar los íconos por el logo oficial si existe (mismos nombres y tamaños en `public/icons/`).
- Probar en teléfonos reales (Android y iPhone) y con HTTPS en el VPS.
