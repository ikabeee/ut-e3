# Arquitectura

El sitio implementa el diseño de la carpeta UTG (`index.html`, `juegos.html`, `juego.html` y
`croquis.html`) con Next.js 16.4, HeroUI v3 y TanStack Query, organizado con
**screaming architecture**: las carpetas dicen de qué trata la aplicación.

## Capas

```
src/app/                    Rutas. Cada archivo sólo exporta la page de una feature.
src/features/<feature>/
  api/                      Contrato HTTP: Route Handlers, cliente del navegador y DTO validado.
  pages/                    Contenedores: piden datos, definen Suspense/notFound y metadata.
  components/               UI. Reciben datos por props; los interactivos llevan "use client".
  hooks/                    Estado e interacción del cliente (sin JSX).
  lib/                      Tipos, datos y funciones puras (probadas con Jest).
  lib/server/               Sólo servidor ("server-only"): consultas cacheadas y prefetch.
src/shared/                 Piezas sin reglas de negocio: tema, botones, hooks genéricos.
```

Crea cada carpeta (`lib/`, `hooks/`, `components/`, `pages/`) cuando la necesites; el linter
valida las que existen. No se dejan carpetas vacías ni `.gitkeep`.

| Feature | Responsabilidad | Usa |
| --- | --- | --- |
| `games` | Catálogo, detalle, carrusel de destacados, exhibidor 3D, API `/api/games`. | `event` (fecha y calendario en el detalle) |
| `floor-plan` | Croquis: zonas, stands, layouts, zoom, filtros y directorio. | `games` (cada juego ocupa su stand) |
| `event` | Contenido del evento: reel, actividades, programa, ubicación y cierre. | Nada |
| `home` | Compone la portada y conecta el programa con el croquis. | `event`, `games`, `floor-plan` |
| `example` | Scaffold para copiar; no se monta en ninguna ruta. | Nada |

## Grafo de dependencias entre features

Fuera de `pages/`, una feature sólo importa las que declara `FEATURE_DEPENDENCIES` en
`eslint.config.mjs`. Es un grafo dirigido y **sin ciclos**: si alguien agrega una arista que
cierra uno, ESLint se detiene con el ciclo en el mensaje.

```
home ──> event
  │ └──> floor-plan ──> games ──> event
  └────────────────────> games
```

Las `pages/` son la excepción: pueden componer cualquier feature, porque nada las importa salvo
`src/app/` y por eso nunca forman parte de un ciclo. Cuando dos features necesitan hablar y la
arista cerraría un ciclo, se conectan en una page (o en `home`, que compone la portada).

## Reglas que valida ESLint

| Regla | Qué impide |
| --- | --- |
| Capas | `lib/` no importa `hooks/`, `components/` ni `pages/`; `hooks/` no importa `components/` ni `pages/`; `pages/` no importa `hooks/`. |
| Servidor por ubicación | `import "server-only"` sólo en `lib/server/`, `@shared/lib/server/` y `@shared/lib/prisma/`; nada que llegue al navegador importa esas carpetas. |
| Base de datos | Sólo `lib/server/` importa `@shared/lib/prisma/db`. |
| Grafo de features | Imports entre features que no están en `FEATURE_DEPENDENCIES` (salvo desde `pages/`). |
| Ciclos | Ciclos entre archivos, también dentro de una feature (`import/no-cycle`). |
| Rutas | `src/app/` sólo importa pages; un `route.ts` sólo re-exporta `@features/<feature>/api/<feature>-route`; `sitemap.ts` y `robots.ts` sólo delegan en `lib/`. |
| API | Los Route Handlers (`api/*-route.ts`) sólo los importa `src/app`; componentes, hooks y `lib/` usan el cliente (`api/*-api-client.ts`). |
| Imports | `../`, el alias `@/`, archivos barril y `shared` importando `features`. |

## Flujo de datos

```
GameRepository (mock hoy, Prisma después)
  -> lib/server/games-queries.ts  "use cache" + cacheTag("games")
       -> pages                   getGamesHydrationState() -> QueryHydrationBoundary
       -> api/games-route.ts      GET /api/games: juegos -> GameDto (api/games-contract.ts)
  -> TanStack Query (cliente)     useGames() / useSuspenseQuery(gamesQueryOptions())
       -> api/games-api-client.ts fetchGames(): fetch + parseGamesResponse() -> Game[]
```

- **Servidor**: las consultas se cachean con `"use cache"`, así todas las páginas se
  prerenderizan (`○` en el build): mejor SEO y carga instantánea.
- **Cliente**: TanStack Query guarda los juegos. Las pages los prellenan con
  `dehydrateForPrerender` (la versión de `dehydrate()` compatible con Cache Components) y los
  componentes los leen con `useGames()` sin esperar a la red.
- **Mutaciones**: "Copiar dirección" usa `useMutation`. Cuando existan mutaciones de datos,
  invalida `updateTag("games")` en la Server Action y `gamesQueryKeys.all` en el cliente.
- **Estado de la URL**: el género del catálogo (`?genre=`) y el stand del croquis (`#A1`) viven
  en la URL con `useSearchParamState` y `useUrlHash`, que no fuerzan el render en el cliente.
- **Estado de la interfaz**: carruseles, zoom, filtros y galería usan hooks locales.

## Decisiones de rendimiento

- Todas las rutas se prerenderizan; los detalles de juego se generan con `generateStaticParams`.
- Tipografías con `next/font` (auto-hospedadas, sin saltos de layout).
- Imágenes con `next/image` (AVIF/WebP y `sizes` por cuadrícula); sólo la primera se precarga.
- El croquis y el exhibidor 3D calculan su layout con **container queries** y variables CSS:
  el HTML del servidor ya es correcto en móvil y en escritorio (sin CLS).
- El carrusel sólo pinta la diapositiva actual, la anterior y la siguiente, y su barra de
  progreso se actualiza en el DOM sin renders de React.
- La retícula del croquis es un `<pattern>` SVG en lugar de cientos de elementos.
- Animaciones con `prefers-reduced-motion`: el video empieza en pausa, el zoom es inmediato y
  los carruseles no avanzan solos.

## Principios SOLID aplicados

| Principio | Dónde |
| --- | --- |
| Responsabilidad única | Cada archivo hace una cosa: `game-filters.ts` filtra, `plan-viewport.ts` calcula el zoom, `use-gallery.ts` maneja la galería y `GameGallery` sólo la pinta. |
| Abierto/cerrado | Las variantes de `Button` de HeroUI se extienden con CSS (`components.css`) sin tocar HeroUI; `GameCard` y `PlanItemCard` tienen variantes en lugar de copias. |
| Sustitución de Liskov | Cualquier implementación de `GameRepository` (mock o Prisma) sirve igual a `games-queries.ts`. |
| Segregación de interfaces | Los componentes reciben sólo lo que usan (`ArtLabels` en vez del juego completo; `EventSchedule` recibe nombres de zona, no el croquis). |
| Inversión de dependencias | `games-queries.ts` depende de la interfaz `GameRepository`, no de la fuente de datos. |

## Agregar una feature

1. Copia `src/features/example/` a `src/features/<feature>/` (nombre en inglés) y renombra sus
   archivos. `example` no se monta en ninguna ruta: es sólo la plantilla, protegida por su prueba de humo.
2. Datos en `lib/` (tipos, consultas con `"use cache"`, funciones puras con pruebas).
3. Estado de cliente en `hooks/`, UI en `components/` (HeroUI + tema UTG), contenedor en `pages/`.
4. Ruta en `src/app/` que sólo exporta la page y su metadata.
5. Agrega la ruta a `src/app/sitemap.ts` si debe indexarse.
