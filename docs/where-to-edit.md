# Dónde modificar cada cosa

Guía rápida para cambiar el contenido o la apariencia del sitio sin recorrer todo el código.
Después de cualquier cambio corre `npm run lint`, `npm run typecheck` y `npm test`.

## Contenido del evento

Cada dato se escribe **una sola vez**: los textos que lo citan (tarjetas, detalle del juego,
croquis, Google Calendar, datos estructurados) lo componen. No vuelvas a escribir una hora, la
sede o el nombre de la división dentro de un texto.

| Quiero cambiar... | Archivo |
| --- | --- |
| Fecha y horario del evento | `startsAt` y `endsAt` en `src/features/event/lib/event-info.ts`. De ahí salen "27.11.2026", "27.11.26", "10:00—20:00" y el enlace de Google Calendar |
| "Entrada libre" | `admission` en `src/features/event/lib/event-info.ts` |
| Sede, dirección (por partes), enlace de Google Maps | `src/features/event/lib/event-info.ts` (`EVENT_VENUE`). La dirección visible y la que se copia se arman con `streetAddress`, `postalCode`, `locality` y `region` |
| Nombre de la división y de la universidad | `organization` en `src/shared/lib/site-config.ts` (lo usan la presentación, "Acerca del juego", el stand C1, el pie y los datos estructurados) |
| Título y descripción del encabezado, texto del botón principal | `src/features/event/lib/event-program.ts` (`EVENT_HERO`) |
| "Juegos hechos en la UT Cancún" y sus dos párrafos | `src/features/event/lib/event-program.ts` (`EVENT_INTRO`) |
| Programa del día | `src/features/event/lib/event-program.ts` (`EVENT_SCHEDULE`). Cada renglón lleva el `zoneId` de su zona del croquis; si no existe, `npm test` y el build fallan |
| Horarios de torneos (inscripción, rondas, finales) y de sorteos | El renglón del programa marcado con `milestone` en `EVENT_SCHEDULE`. Las tarjetas de la portada, el aviso de torneo del detalle y la Arena y Premios del croquis los toman de ahí |
| Textos de las tarjetas de torneos y sorteos | `buildEventActivities` en `src/features/event/lib/event-program.ts` |
| Textos de la interfaz del evento ("Ubicación", "Copiar dirección", controles del reel, esquema) | `src/features/event/lib/event-copy.ts` (`EVENT_COPY`) |
| Video del encabezado | Reemplaza `public/media/reel.webm`, `reel.mp4` y `reel.jpg` (mismos nombres) |
| Ancho mínimo para que el reel se reproduzca solo | `REEL_AUTOPLAY_MIN_WIDTH` en `src/features/event/lib/event-media.ts` |
| Esquema de la carretera | `src/features/event/components/venue-map.tsx` |

### Publicar una versión ligera del reel

El reel sólo se descarga solo en pantallas de al menos `REEL_AUTOPLAY_MIN_WIDTH` px (1024),
sin ahorro de datos y sin movimiento reducido; en el resto se ve el póster hasta que alguien
toca "Reproducir video" (ver `useVideoPlayback` en `src/features/event/hooks/`). Aun así,
cada descarga cuenta en la red de la sede, así que el video debe ser ligero:

- Resolución de 720p (1280x720), sin audio y de pocos segundos, porque se repite en bucle.
- Cada archivo pesa **500 KB o menos**.
- Conserva los mismos nombres en `public/media/`: `reel.webm` (VP9, se usa primero),
  `reel.mp4` (H.264, respaldo para Safari) y `reel.jpg` (póster, primer cuadro del video).

Por ejemplo, con [FFmpeg](https://ffmpeg.org/) (sube `-crf` si el archivo pasa de 500 KB):

```bash
ffmpeg -i original.mov -an -vf "scale=-2:720" -c:v libvpx-vp9 -b:v 0 -crf 42 -row-mt 1 public/media/reel.webm
ffmpeg -i original.mov -an -vf "scale=-2:720" -c:v libx264 -crf 30 -preset slow -movflags +faststart public/media/reel.mp4
ffmpeg -i original.mov -vf "scale=-2:720" -frames:v 1 -q:v 4 public/media/reel.jpg
ls -lh public/media/
```

## Juegos

| Quiero cambiar... | Archivo |
| --- | --- |
| Juegos, equipos, integrantes, géneros, plataformas, stands, descripciones, jugadores y "Acerca del juego" | La base de datos, con las acciones de `games-actions.ts` y `teams-actions.ts` (panel de administración en `/admin`) |
| Datos de ejemplo de la base | `src/shared/lib/prisma/seed-data.json` (y `npm run db:seed`) |
| Juegos de las pruebas | `src/features/games/__tests__/game-fixtures.ts` (los usa también `renderWithGames`) |
| Portada y galería de un juego | Tabla `game_image` (`is_cover` marca la portada); un juego sin portada no se muestra |
| Dominios permitidos para fotos por URL | `IMAGE_REMOTE_HOSTS` en `.env` |
| Mensajes de error del panel (duplicados, formatos) | `*_CONSTRAINT_MESSAGES` en `games-actions.ts` y `teams-actions.ts` |
| Textos de la interfaz de juegos (botones, títulos, "Acerca del juego" genérico, "Por asignar", características y ficha) | `src/features/games/lib/games-copy.ts` (`GAMES_COPY`) |
| Criterio de "Más juegos" | `getRelatedGames` en `src/features/games/lib/game-details.ts` |
| Campos en los que busca el buscador | `filterGames` en `src/features/games/lib/game-filters.ts` |
| Velocidad del carrusel de destacados | `FEATURED_SLIDE_DURATION` en `src/features/games/hooks/use-featured-carousel.ts` |
| Diapositivas, título o miniaturas del carrusel de destacados | `featured-slides.tsx`, `featured-caption.tsx` y `featured-thumbnails.tsx` en `src/features/games/components/` |
| Teclas del exhibidor 3D (flechas y Espacio) | `src/features/games/hooks/use-coverflow-keyboard.ts` |
| Medidas del exhibidor 3D | `RACK_VARIABLES` en `src/features/games/components/game-coverflow.tsx` |
| Base de datos local, seeds y acciones del panel | [`docs/data-sources.md`](./data-sources.md) |

## Croquis

| Quiero cambiar... | Archivo |
| --- | --- |
| Nombre y descripción de zonas (escenario, arena, premios, servicios...) | `src/features/floor-plan/lib/plan-places.ts` (`PLAN_ZONES`; ids en inglés: `stage`, `arena`, `raffles`...) |
| Frases de la Arena y de Premios que citan horarios | `PLAN_ZONE_SCHEDULE_NOTES` en `src/features/floor-plan/lib/floor-plan-copy.ts` (los horarios vienen del programa) |
| Textos de la interfaz del croquis (filtros, leyenda, zoom, encabezado) | `src/features/floor-plan/lib/floor-plan-copy.ts` |
| Stands informativos C1-C4 | `src/features/floor-plan/lib/plan-places.ts` (`INFO_STANDS`) |
| Posición o tamaño de zonas, pasillos y stands | `src/features/floor-plan/lib/plan-layouts.ts` (horizontal y vertical) |
| Cómo se dibuja cada parte del croquis | `src/features/floor-plan/components/`: `plan-zones.tsx` (zonas), `plan-stand-block.tsx` (pasillos y stands), `plan-entry.tsx` (entrada), `plan-public-area.tsx` (área de público), `plan-floor.tsx` (retícula y muro) y `plan-defs.tsx` (patrones). `floor-plan-drawing.tsx` sólo los junta |
| Cuándo un stand o zona se ve seleccionado u oculto por los filtros | `getItemInteraction` en `src/features/floor-plan/lib/plan-interaction.ts` |
| Área táctil de stands y zonas en el teléfono | `TOUCH_MARGIN` en `src/features/floor-plan/lib/plan-touch-areas.ts` (si mueves zonas en `plan-layouts.ts`, `npm test` avisa si alguna queda por debajo de 44 px) |
| Asignar un juego a un stand | Campo `stand` del juego |
| Stand seleccionado al abrir la portada | `INITIAL_SELECTION` en `src/features/home/components/program-and-floor-plan.tsx` |
| Zoom máximo y márgenes al arrastrar | `src/features/floor-plan/lib/plan-viewport.ts` |

## Pasaporte y sorteo

| Quiero cambiar... | Archivo |
| --- | --- |
| Textos del pasaporte, el registro, el sorteo y la afluencia | `src/features/visitors/lib/visitors-copy.ts` (`VISITORS_COPY`) |
| Reglas del gamertag y del teléfono (lada por defecto) | `src/features/visitors/lib/visitor-rules.ts` |
| Duración de la cookie del visitante | `VISITOR_COOKIE_MAX_AGE_SECONDS` en `visitor-rules.ts` |
| Mensajes de error (gamertag o teléfono repetidos) | `VISITOR_CONSTRAINT_MESSAGES` en `src/features/visitors/lib/visitors-actions.ts` |
| Qué juegos cuentan para el boleto | `listRequiredGames` en `src/features/visitors/lib/server/visitors-queries.ts` |
| Ventana y umbrales de la afluencia | `TRAFFIC_WINDOW_MINUTES` en `visitor-rules.ts` y `TRAFFIC_THRESHOLDS` en `stand-traffic.ts` |
| Cada cuánto se refresca la afluencia | `STAND_TRAFFIC_REFRESH_MS` en `visitors-query-options.ts` y `cacheLife` en `lib/server/traffic-queries.ts` |
| Máximo de ganadores por sorteo | `MAX_RAFFLE_WINNERS` en `visitor-rules.ts` |
| Nombre del enlace en la navegación ("Mi QR") | `navigation.passport` en `src/features/site/lib/site-copy.ts` |

## Panel de administración

| Quiero cambiar... | Archivo |
| --- | --- |
| Usuario y contraseña del panel | `ADMIN_USER` y `ADMIN_PASSWORD` en `.env` |
| Textos del panel (títulos, botones, ayudas de los campos) | `src/features/admin/lib/admin-copy.ts` (`ADMIN_COPY`) |
| Secciones y rutas del panel | `src/features/admin/lib/admin-links.ts` (y su página en `src/features/admin/pages/`) |
| Rutas protegidas con usuario y contraseña | `config.matcher` en `src/proxy.ts` |
| Campos de cada formulario | `team-fields.tsx`, `team-member-fields.tsx`, `game-fields.tsx` y `game-image-fields.tsx` en `src/features/admin/components/` |
| Zona horaria de las horas del sorteo | `EVENT_TIME_ZONE` en `src/features/admin/lib/admin-records.ts` |

## Apariencia

| Quiero cambiar... | Archivo |
| --- | --- |
| Colores (azul acid, negros, grises) | `src/shared/styles/theme.css` (paleta `--utg-*`) |
| Tipografías | `src/shared/lib/fonts.ts` y `--font-*` en `src/shared/styles/theme.css` |
| Botones (rellenos, bordes, medidas) | `src/shared/styles/components.css` |
| Variantes de botones y toggles (flechas del exhibidor y de la galería, zoom, géneros, filtros, pausa del reel) | `button--*` y `toggle-button--*` en `src/shared/styles/components.css` (lista en [`docs/design-system.md`](./design-system.md#variantes)) |
| Degradados sobre imágenes y fondo del exhibidor 3D | `shade-*` y `coverflow-*` en `src/shared/styles/components.css`; sus colores en `src/shared/styles/theme.css` |
| Utilidades de texto (`type-giant`, `type-section`, `type-mono`, `type-tiny`...) | `src/shared/styles/typography.css` |
| Logo UTG | `src/shared/components/utg-logo.tsx` e icono `src/app/icon.svg` |
| Ícono de la app instalada (PWA) | `src/app/icon.svg` y luego `npm run pwa:icons` (ver abajo) |
| Nombre, colores y accesos directos de la app instalada | `src/app/manifest.ts` (colores en `themeColor` de `src/shared/lib/site-config.ts`) |
| Secciones de la navegación (y accesos directos de la app instalada) | `SECTION_LINKS` en `src/features/site/lib/navigation.ts`; la ruta de cada sección está en el `lib/*-links.ts` de su feature |
| Navegación y pie de página | `src/features/site/components/site-header.tsx`, `site-nav-links.tsx`, `site-footer.tsx` |
| Páginas de error (404 y "Algo salió mal") | `src/features/site/components/not-found-view.tsx` y `error-view.tsx`; textos en `src/features/site/lib/site-copy.ts` |
| Página `/offline` y avisos "Sin conexión" / "Hay una versión nueva" | `src/features/offline/pages/offline-page.tsx` y `src/features/offline/components/`; textos en `src/features/offline/lib/offline-copy.ts` |
| Páginas que se guardan para usar sin conexión | `buildPrecacheRoutes` en `src/features/offline/lib/precache-routes.ts` (ver [`docs/pwa.md`](./pwa.md)) |

### Cambiar el ícono de la app (PWA)

El ícono del navegador y el de la app instalada salen de `src/app/icon.svg`. Android y
Chromium leen los PNG del manifest y iOS usa `apple-touch-icon.png` (declarado en `icons.apple`
de `src/app/layout.tsx`), así que después de editar el SVG regenera los PNG:

```bash
npm run pwa:icons
```

El script `scripts/generate-pwa-icons.mjs` usa `sharp` (ya viene con Next.js) y escribe en
`public/icons/`:

| Archivo | Tamaño | Uso |
| --- | --- | --- |
| `icon-192.png` | 192x192 | Ícono `any` del manifest y de los accesos directos. |
| `icon-512.png` | 512x512 | Ícono `any` del manifest (pantalla de bienvenida en Android). |
| `icon-maskable-512.png` | 512x512 | Ícono `maskable`: el logo ocupa el 80 % central sobre el color de fondo, porque Android lo recorta en círculo o en otras formas. |
| `apple-touch-icon.png` | 180x180 | Ícono de iOS al agregar el sitio a la pantalla de inicio. |

- El SVG debe ser cuadrado y con fondo propio (iOS rellena con negro lo transparente).
- Si cambias el color de fondo, actualiza `themeColor` en `src/shared/lib/site-config.ts` y
  `BACKGROUND_COLOR` en el script, y vuelve a correrlo.
- Revisa el maskable en [maskable.app](https://maskable.app/) o en DevTools > Application > Manifest.
- Sube los PNG regenerados en el mismo PR que el SVG.

## SEO

| Quiero cambiar... | Archivo |
| --- | --- |
| Nombre, descripción y URL pública del sitio | `src/shared/lib/site-config.ts` y `NEXT_PUBLIC_SITE_URL` en `.env` |
| Validación de variables de entorno | `src/shared/lib/env.ts` |
| Imagen para compartir por defecto | `shareImage` en `src/shared/lib/site-config.ts` |
| Título y descripción de cada página | `*PageMetadata` / `generate*Metadata` en `src/features/<feature>/pages/` |
| Páginas del sitemap y reglas de robots | `src/app/sitemap.ts` y `src/app/robots.ts` |
| Datos estructurados (schema.org) | `event-structured-data.ts` y `game-structured-data.ts` en `lib/` |
