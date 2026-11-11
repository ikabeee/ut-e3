# Dónde modificar cada cosa

Guía rápida para cambiar el contenido o la apariencia del sitio sin recorrer todo el código.
Después de cualquier cambio corre `npm run lint`, `npm run typecheck` y `npm test`.

## Contenido del evento

| Quiero cambiar... | Archivo |
| --- | --- |
| Fecha, horario, "Entrada libre", enlace de Google Calendar | `src/features/event/lib/event-info.ts` (`EVENT_INFO`) |
| Sede, dirección, texto que se copia, enlace de Google Maps | `src/features/event/lib/event-info.ts` (`EVENT_VENUE`) |
| Título y descripción del encabezado, texto del botón principal | `src/features/event/lib/event-program.ts` (`EVENT_HERO`) |
| "Juegos hechos en la UT Cancún" y sus dos párrafos | `src/features/event/lib/event-program.ts` (`EVENT_INTRO`) |
| Tarjetas de torneos y sorteos (horarios incluidos) | `src/features/event/lib/event-program.ts` (`EVENT_ACTIVITIES`) |
| Programa del día | `src/features/event/lib/event-program.ts` (`EVENT_SCHEDULE`) |
| Video del encabezado | Reemplaza `public/media/reel.webm`, `reel.mp4` y `reel.jpg` (mismos nombres) |
| Esquema de la carretera | `src/features/event/components/venue-map.tsx` |

## Juegos

| Quiero cambiar... | Archivo |
| --- | --- |
| Juegos, equipos, géneros, stands, descripciones (mientras sean mock) | `src/features/games/lib/mock-games.ts` |
| Portada de un juego | Agrega la imagen en `public/` y ponla en `image.src` del juego; sin imagen se genera arte |
| Colores del arte generado de un juego | `art.palette` del juego (`acid`, `black`, `white`, `panel`, `light`) |
| Textos de "Acerca del juego", características y ficha | `src/features/games/lib/game-details.ts` |
| Criterio de "Más juegos" | `getRelatedGames` en `src/features/games/lib/game-details.ts` |
| Campos en los que busca el buscador | `filterGames` en `src/features/games/lib/game-filters.ts` |
| Velocidad del carrusel de destacados | `FEATURED_SLIDE_DURATION` en `src/features/games/hooks/use-featured-carousel.ts` |
| Medidas del exhibidor 3D | `RACK_VARIABLES` en `src/features/games/components/game-coverflow.tsx` |
| Conectar la base de datos | [`docs/data-sources.md`](./data-sources.md) |

## Croquis

| Quiero cambiar... | Archivo |
| --- | --- |
| Nombre y descripción de zonas (escenario, arena, servicios...) | `src/features/floor-plan/lib/plan-places.ts` (`PLAN_ZONES`) |
| Stands informativos C1-C4 | `src/features/floor-plan/lib/plan-places.ts` (`INFO_STANDS`) |
| Posición o tamaño de zonas, pasillos y stands | `src/features/floor-plan/lib/plan-layouts.ts` (horizontal y vertical) |
| Asignar un juego a un stand | Campo `stand` del juego |
| Stand seleccionado al abrir la portada | `INITIAL_SELECTION` en `src/features/home/components/program-and-floor-plan.tsx` |
| Zoom máximo y márgenes al arrastrar | `src/features/floor-plan/lib/plan-viewport.ts` |

## Apariencia

| Quiero cambiar... | Archivo |
| --- | --- |
| Colores (azul acid, negros, grises) | `src/shared/styles/theme.css` (paleta `--utg-*`) |
| Tipografías | `src/shared/lib/fonts.ts` y `--font-*` en `src/shared/styles/theme.css` |
| Botones (rellenos, bordes, medidas) | `src/shared/styles/components.css` |
| Utilidades de texto (`type-giant`, `type-mono`, `type-tiny`...) | `src/shared/styles/typography.css` |
| Logo UTG | `src/shared/components/utg-logo.tsx` e icono `src/app/icon.svg` |
| Navegación y pie de página | `src/shared/components/site-header.tsx`, `site-nav-links.tsx`, `site-footer.tsx` |

## SEO

| Quiero cambiar... | Archivo |
| --- | --- |
| Nombre, descripción y URL pública del sitio | `src/shared/lib/site-config.ts` y `NEXT_PUBLIC_SITE_URL` en `.env` |
| Imagen para compartir por defecto | `shareImage` en `src/shared/lib/site-config.ts` |
| Título y descripción de cada página | `*PageMetadata` / `generate*Metadata` en `src/features/<feature>/pages/` |
| Páginas del sitemap y reglas de robots | `src/app/sitemap.ts` y `src/app/robots.ts` |
| Datos estructurados (schema.org) | `event-structured-data.ts` y `game-structured-data.ts` en `lib/` |
