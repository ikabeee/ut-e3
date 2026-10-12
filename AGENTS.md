<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — UT Game Showcase

Plataforma comunitaria de la universidad para el evento donde se exhiben los videojuegos
desarrollados por los estudiantes del edificio E3. Contribuyen estudiantes de toda la
generación, así que el código debe ser **simple, predecible y fácil de leer**.

Idioma: la interfaz, la documentación, los issues y los commits van en **español**.
Todo el naming (directorios, archivos y código) va en **inglés**.

## Stack y versiones

| Herramienta | Versión | Notas |
| --- | --- | --- |
| Node.js | `>= 22.18` | Requerido por Prisma 8. |
| Next.js | `16.4.0` | App Router, `cacheComponents` y `partialPrefetching` activados. |
| React | `19.3` | Server Components por defecto. |
| TypeScript | `6.x` | `strict`, `module: preserve`, `moduleResolution: bundler`. |
| Prisma ORM | `8.x` (`prisma`, `@prisma/orm-postgres`) | Contract-first. **No es Prisma 7.** |
| PostgreSQL | `>= 15` | |
| Tailwind CSS | `4` | Configurado vía `@tailwindcss/turbopack`. |
| TanStack Query | `5.x` (`@tanstack/react-query` + devtools) | Estado de servidor en el cliente. |
| HeroUI | `3.x` (`@heroui/react`, `@heroui/styles`) | Librería de componentes (React Aria + Tailwind 4). |
| ESLint | `9.x` + `eslint-plugin-sonarjs` | Reglas de SonarQube. ESLint 10 aún no es compatible con `eslint-config-next`. |
| Jest | `30.x` + Testing Library | Pruebas unitarias y de componentes (`next/jest`). |

Las versiones de Prisma 8 están fijadas (sin `^`) porque son release candidates.

## Comandos

```bash
npm run dev                # servidor de desarrollo
npm run lint               # ESLint (incluye reglas de fronteras entre features)
npm run typecheck          # next typegen + tsc --noEmit
npm test                   # pruebas con Jest (npm run test:coverage para cobertura)
npm run build              # emite el contrato de Prisma y compila
npm run db:emit            # regenera contract.json / contract.d.ts
npm run db:update          # aplica el contrato a la BD LOCAL (sin migraciones)
npm run db:migration:plan  # genera una migración formal en migrations/app/
npm run db:migrate         # aplica migraciones pendientes
```

Antes de dar por terminado un cambio, `npm run lint`, `npm run typecheck` y `npm test` deben pasar.
El workflow `.github/workflows/ci.yml` ejecuta lo mismo (más `npm run build`) en cada PR.

## Arquitectura: screaming architecture

La estructura de carpetas "grita" el dominio, no el framework.
Cada dominio es una **feature** dentro de `src/features/`. La feature `example` es el scaffold
mínimo; `games` es la referencia completa (datos, TanStack Query, componentes y pages).
Los datos todavía son mock (ver `docs/data-sources.md`); el contrato de Prisma no tiene modelos.

```
src/
├── app/                      # SOLO rutas de Next.js: renderizan una page de una feature
├── features/
│   ├── event/                # Evento: fecha, sede, programa, actividades, reel y ubicación
│   ├── example/              # Scaffold mínimo: cópialo para crear tus features
│   ├── floor-plan/           # Croquis interactivo (/floor-plan): zonas, stands, zoom y directorio
│   ├── games/                # Catálogo (/games), detalle (/games/[slug]), API y carruseles
│   └── home/                 # Portada (/): compone event, games y floor-plan
└── shared/                   # Código transversal SIN reglas de negocio
    ├── __tests__/            # Pruebas de shared (mismas subcarpetas que el código)
    ├── components/           # QueryProvider, navegación, pie, botones del diseño...
    ├── hooks/                # Hooks genéricos (movimiento reducido, estado en la URL...)
    ├── styles/               # Tema UTG de HeroUI, tipografía y efectos
    └── lib/
        ├── prisma/           # Contrato y cliente (db.ts) de Prisma 8
        ├── query/            # getQueryClient() de TanStack Query
        └── server/           # Código sólo de servidor: dehydrateForPrerender()
```

### Anatomía de una feature

Una feature se organiza en cuatro carpetas, más `api/` si expone datos por HTTP y `__tests__/` para
sus pruebas. Crea cada carpeta (`lib/`, `hooks/`, `components/`, `pages/`, `api/`) cuando la
necesites; el linter valida las que existen. No dejes carpetas vacías ni `.gitkeep`.

```
src/features/<feature>/
├── __tests__/     # Pruebas, con las mismas subcarpetas que el código (ver "Pruebas").
├── api/           # Contrato HTTP: Route Handlers (<feature>-route.ts) y cliente (<feature>-api-client.ts).
├── lib/           # Tipos, constantes y utilidades puras (se pueden usar en el navegador).
│   └── server/    # Sólo servidor: consultas a la BD (<feature>-queries.ts) y prefetch.
├── hooks/         # Hooks de React de la feature (use-<algo>.ts).
├── components/    # Componentes de presentación de la feature.
└── pages/         # Contenedores de página que usa src/app/.
```

| Carpeta | Responsabilidad | No puede importar |
| --- | --- | --- |
| `lib/` | Tipos de dominio (`types.ts`), constantes y utilidades puras. Llegan al navegador cuando un componente las usa. | `hooks/`, `components/`, `pages/`, código de servidor |
| `lib/server/` | Todo lo que lleva `import "server-only"`: consultas a la BD (`*-queries.ts` con `"use cache"` + `cacheLife(...)` o `await connection()`), que mapean las filas de Prisma a los tipos de dominio, y prefetch. Es lo único que importa `@shared/lib/prisma/db`. | `hooks/`, `components/`, `pages/` |
| `hooks/` | Estado y lógica de interacción en el cliente. Sin JSX. | `components/`, `pages/`, código de servidor |
| `components/` | UI. Reciben datos por props, también el contenido fijo (fechas, textos del evento, zonas): lo lee la page y lo pasa. **No consultan la BD**. Agrega `"use client"` sólo si usan hooks o eventos. | `pages/`, código de servidor |
| `pages/` | **Contenedores**: obtienen los datos (vía `lib/server/`), definen `Suspense`/`notFound` y componen componentes. Sin estilos complejos ni lógica de negocio. Exportan también su `Metadata`. Son el único lugar donde se combinan features libremente. | `hooks/`, `api/`, `@shared/lib/prisma/db` |
| `api/` | Cómo la feature **expone** y **consume** sus datos por HTTP: `<feature>-route.ts` (Route Handlers con `import "server-only"` que usan `lib/server/`), `<feature>-api-client.ts` (ruta del endpoint y `fetch` del navegador) y, si lo que viaja difiere del tipo de dominio, `<feature>-contract.ts` (DTO y validación de la respuesta). | `hooks/`, `components/`, `pages/`; el cliente tampoco importa código de servidor |

"Código de servidor" es `lib/server/` de cualquier feature, `@shared/lib/server/` y `@shared/lib/prisma/`.
La frontera depende de la carpeta, no del nombre del archivo: `import "server-only"` sólo se permite ahí.

### Pruebas

Las pruebas viven en la carpeta `__tests__/` de cada feature, que repite las subcarpetas del
código: `lib/game-filters.ts` -> `__tests__/lib/game-filters.test.ts`. Lo mismo aplica a
`src/shared/__tests__/` y a `src/app/__tests__/` (Next.js no enruta las carpetas que empiezan con `_`).

- Jest corre todo archivo `*.test.ts(x)` dentro de `src/`. En `__tests__/`, lo que no termina en
  `.test` es un helper de prueba y no cuenta en la cobertura.
- Los componentes que leen el catálogo de juegos se prueban con `renderWithGames(<Componente />)`
  (`@features/games/__tests__/render-with-games`): monta un `QueryClient` con `MOCK_GAMES` ya en caché.
- Las pruebas de `src/app/` importan las rutas con el alias `@app/*` (`@app/error`).
- Una prueba sigue las reglas de dependencias de la carpeta que prueba (`__tests__/lib/` las de
  `lib/`, etc.), pero además puede importar `@app/*` y los helpers de `__tests__/`. ESLint impide que
  el código de la app importe cualquiera de los dos.

### Pages como contenedores

Una page de feature sólo orquesta: pide datos, maneja estados de carga/no encontrado y
compone componentes. Toda la UI vive en `components/`.

La feature `example` es el scaffold de referencia y contiene exactamente esto:

```
src/features/example/
├── __tests__/
│   ├── api/
│   │   ├── example-route.test.ts
│   │   └── example-api-client.test.ts
│   ├── hooks/
│   │   └── use-toggle.test.ts
│   ├── components/
│   │   ├── example-card.test.tsx
│   │   └── example-toggle.test.tsx
│   └── pages/
│       └── example-page.test.tsx # Prueba de humo de la composición
├── api/
│   ├── example-route.ts          # GET: Route Handler ("server-only"); no se monta en src/app/api
│   └── example-api-client.ts     # EXAMPLE_API_PATH, fetchExampleMessage() y validación de la respuesta
├── lib/
│   ├── types.ts                  # ExampleMessage
│   └── server/
│       └── example-queries.ts    # getExampleMessage(): "server-only" + "use cache" + cacheLife
├── hooks/
│   └── use-toggle.ts             # useToggle(): estado del cliente, sin JSX
├── components/
│   ├── example-card.tsx          # ExampleCard: recibe `message` por props (Card de HeroUI)
│   └── example-toggle.tsx        # ExampleToggle: "use client", usa useToggle (Button + onPress)
└── pages/
    └── example-page.tsx          # ExamplePage + examplePageMetadata
```

```ts
// src/features/example/lib/server/example-queries.ts
import "server-only";
import { cacheLife } from "next/cache";
import type { ExampleMessage } from "@features/example/lib/types";

// Con Prisma, aquí iría la consulta (`db.orm.public.<Model>`) y el mapeo de la fila al tipo de
// dominio. "use cache" + cacheLife permite prerenderizar la page sin `<Suspense>`.
export async function getExampleMessage(): Promise<ExampleMessage> {
  "use cache";
  cacheLife("hours");

  return {
    title: "Feature de ejemplo",
    description: "Copia src/features/example para crear tu propia feature.",
  };
}
```

```tsx
// src/features/example/pages/example-page.tsx
import type { Metadata } from "next";
import { ExampleCard } from "@features/example/components/example-card";
import { ExampleToggle } from "@features/example/components/example-toggle";
import { getExampleMessage } from "@features/example/lib/server/example-queries";

// Al copiar la feature, agrega `alternates: { canonical: "/<ruta>" }` y la ruta a `src/app/sitemap.ts`.
export const examplePageMetadata: Metadata = {
  title: "Ejemplo",
  description: "Feature de ejemplo para crear nuevas secciones del showcase.",
};

export async function ExamplePage() {
  const message = await getExampleMessage(); // lib/server/

  return (
    <main className="page-wrap flex flex-col gap-6 py-8">
      <ExampleCard message={message} />
      <ExampleToggle />
    </main>
  );
}
```

Si la consulta no se cachea (usa `await connection()`), envuelve la parte que espera los datos en
`<Suspense>` (ver "Convenciones de Next.js 16.4").

**`example` no se monta en ninguna ruta**: no existe `src/app/example/` y no aparece en el sitio
ni en el sitemap. Su prueba de humo (`__tests__/pages/example-page.test.tsx`) es lo que garantiza
que sigue funcionando. Cuando copies la feature, enlázala con una ruta creando un archivo en
`src/app/` que sólo exporte la page y su metadata:

```tsx
// src/app/<ruta>/page.tsx  (por ejemplo, src/app/teams/page.tsx para la feature teams)
import { TeamsPage } from "@features/teams/pages/teams-page";

export { teamsPageMetadata as metadata } from "@features/teams/pages/teams-page";

export default TeamsPage;
```

Si la feature tiene `api/`, el Route Handler de `src/app/` también es una sola línea:

```ts
// src/app/api/<ruta>/route.ts  (por ejemplo, src/app/api/teams/route.ts)
export { GET } from "@features/teams/api/teams-route";
```

### Reglas de dependencias

1. `src/app/` sólo importa pages: `@features/<feature>/pages/<name>-page`.
2. Sólo `lib/server/` de una feature importa `@shared/lib/prisma/db`.
3. Sólo `lib/server/`, `@shared/lib/server/`, `@shared/lib/prisma/` y los Route Handlers
   (`api/*-route.ts`) importan `server-only`, y nada que pueda llegar al navegador (`lib/`, `hooks/`,
   `components/`, `api/*-api-client.ts`) importa esas carpetas ni los Route Handlers.
4. Dentro de una feature, las capas siguen la tabla de arriba: `lib/` no importa `hooks/`,
   `components/` ni `pages/`; `hooks/` no importa `components/` ni `pages/`; `pages/` no importa `hooks/`.
5. `src/app/` no contiene UI ni lógica: sólo `layout.tsx` (que monta `QueryProvider`), `globals.css`,
   archivos de ruta que delegan en `pages/`, Route Handlers (`route.ts`) que re-exportan
   `@features/<feature>/api/<feature>-route`, y `sitemap.ts` y `robots.ts` que delegan en `lib/`.
6. `shared/` nunca importa de `features/`.
7. Fuera de `pages/`, una feature sólo importa las features que declara `FEATURE_DEPENDENCIES` en
   `eslint.config.mjs`. Ese grafo no puede tener ciclos (ESLint se detiene si lo tiene) y está
   dibujado en `docs/architecture.md`. Las `pages/` pueden componer cualquier feature, porque sólo
   `src/app/` las importa y así nunca cierran un ciclo.
8. No hay ciclos entre archivos, tampoco dentro de una misma feature (`import/no-cycle`).

ESLint valida todas estas reglas (`no-restricted-imports` e `import/no-cycle`), además de las de
imports de abajo. Si una regla te bloquea, el mensaje dice qué capa o feature puedes usar.

### Imports y path aliases

No usamos archivos barril (`index.ts` que re-exportan). Cada import apunta al archivo concreto
mediante los path aliases de `tsconfig.json`:

| Alias | Apunta a |
| --- | --- |
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |
| `@app/*` | `src/app/*` (sólo en las pruebas de `src/app/__tests__/`) |

```ts
import { ExampleCard } from "@features/example/components/example-card";
import type { ExampleMessage } from "@features/example/lib/types";
import { getQueryClient } from "@shared/lib/query/get-query-client";
```

- Usa siempre un alias, también dentro de la misma feature. Lo único relativo permitido es `./`
  para un archivo de la misma carpeta; `../` está prohibido.
- No crees `index.ts` de re-exportación ni importes una carpeta (`@features/example`,
  `@features/example/components`).
- Por qué: los barriles mezclan código de servidor y cliente en un mismo módulo (riesgo de
  arrastrar `server-only` o Prisma al bundle del navegador), favorecen dependencias circulares,
  hacen más lentos el dev server y el tree-shaking, y esconden de dónde viene cada cosa.
- ESLint rechaza `../`, el alias viejo `@/` y los imports de barriles o carpetas.

### Naming

- **Todo nombre en inglés**: directorios, archivos, variables, funciones, tipos, props,
  ids de formularios, nombres de ramas y labels.
- Directorios y archivos en `kebab-case`: `example-card.tsx`, `use-toggle.ts`, `example-queries.ts`.
- Componentes y pages en `PascalCase` con export nombrado: `ExampleCard`, `ExamplePage`.
  Las pages terminan en `Page` y su metadata en `PageMetadata` (`examplePageMetadata`).
- Hooks con prefijo `use`: `useToggle`.
- Funciones de datos con verbo: `getExampleMessage`, `listGames`, `getGameBySlug`.
- Los ids de HTML, las anclas (`#featured`, `#schedule`) y los ids de datos (`zoneId: "raffles"`) también van en inglés.
- Sólo el contenido visible para el usuario (textos de la UI) y la documentación van en español.

### Agregar una feature nueva

1. Copia `src/features/example/` a `src/features/<feature>/` (nombre en inglés) y renombra sus
   archivos, funciones y pruebas (`ExampleCard` -> `TeamCard`, `examplePageMetadata` ->
   `teamsPageMetadata`...). Borra lo que no uses: crea cada carpeta sólo cuando la necesites.
2. Si persiste datos, agrega los modelos a `contract.prisma`, ejecuta `npm run db:emit` y
   escribe las consultas en `lib/server/<feature>-queries.ts`.
3. Si importa otra feature fuera de `pages/`, agrégala a `FEATURE_DEPENDENCIES` en `eslint.config.mjs`.
4. Crea los componentes en `components/` y el contenedor en `pages/<name>-page.tsx`. Si el navegador
   necesita pedir datos por HTTP, agrega `api/` como en `example` (Route Handler, cliente y pruebas).
5. Crea la ruta en `src/app/<ruta>/page.tsx` que sólo renderiza la page (ver el ejemplo de arriba),
   agrega `alternates.canonical` a su metadata y, si debe indexarse, la ruta a `src/app/sitemap.ts`.

## Documentación del proyecto

- `docs/where-to-edit.md`: dónde cambiar cada contenido o estilo.
- `docs/architecture.md`: capas, flujo de datos, rendimiento y SOLID.
- `docs/data-sources.md`: datos mock y pasos para conectar Prisma.
- `docs/data-model.md`: diagrama ER propuesto (juegos, equipos, stands, check-ins y rifa).
- `docs/design-system.md`: tema UTG sobre HeroUI.
- `docs/versioning.md` y `CHANGELOG.md`: versionado semántico y releases con git flow.
- `docs/audit.md`: auditoría técnica (capacidad, PWA, mantenibilidad) y plan de acción por fases.

Si cambias algo visible, agrega una línea en `[Sin publicar]` de `CHANGELOG.md`. Si cambias
dónde vive un contenido, actualiza `docs/where-to-edit.md`.

## SEO

- Cada page exporta su `Metadata` (título, descripción, `alternates.canonical`). Para Open Graph
  usa `buildOpenGraph()` (`@shared/lib/metadata`): Next.js no fusiona el `openGraph` del layout.
- Datos estructurados con `JsonLd` (`@shared/components/json-ld`) y un builder en `lib/`.
- Las rutas nuevas que deban indexarse se agregan a `src/app/sitemap.ts`.

## Convenciones de Next.js 16.4

Lee la guía correspondiente en `node_modules/next/dist/docs/` antes de escribir código. Puntos clave:

- **Server Components por defecto.** Agrega `"use client"` sólo en componentes con estado,
  efectos o eventos del navegador, y mantenlos pequeños (hojas del árbol).
- **Cache Components está activo.** Todo dato que no se pueda prerenderizar debe:
  - ir dentro de `<Suspense>` (streaming en request time), o
  - estar en una función/componente con `"use cache"` + `cacheLife(...)`.
  Consulta `01-app/01-getting-started/08-caching.md`.
- **Prisma 8 y prerender.** El runtime de Prisma usa `crypto.randomUUID()` por consulta, así que
  las funciones de `lib/server/*-queries.ts` llaman `await connection()` (de `next/server`) antes de consultar. Si quieres
  cachear un resultado, envuelve la consulta en una función con `"use cache"` en lugar de usar
  `connection()`, e invalídala con `cacheTag` / `revalidateTag` / `updateTag` tras una mutación.
- `params` y `searchParams` son **Promises**: `const { slug } = await params`.
  Tipa con los helpers globales `PageProps<"/ruta/[param]">` y `LayoutProps<"/ruta">`
  (generados por `next typegen`).
- Mutaciones con **Server Actions** (`"use server"`) en `lib/<feature>-actions.ts` de la feature. Los
  componentes cliente pueden importarlas; dentro llaman a `lib/server/` (no a `db` directamente).
- Metadata con `export const metadata` o `generateMetadata`.
- Imports con path aliases (ver "Imports y path aliases").

## Prisma 8 (ORM)

Prisma 8 es contract-first y su API **es distinta** a Prisma ≤ 7 (no hay `schema.prisma`,
`@prisma/client`, `prisma generate` ni `prisma migrate dev`). La documentación verificada de la
versión instalada está en `node_modules/@prisma/orm-postgres/skills/prisma-8/` (`SKILL.md` y
`references/`). Léela antes de escribir consultas o migraciones; no respondas de memoria.

- Configuración: `prisma.config.ts` (`definePrismaConfig` + `ormConfig`).
- Contrato: `src/shared/lib/prisma/contract.prisma` (primera línea `// use prisma-8`).
- Artefactos generados (se suben a git, **no se editan a mano**): `contract.json` y `contract.d.ts`.
  Después de cambiar el contrato ejecuta `npm run db:emit`.
- Cliente: `src/shared/lib/prisma/db.ts` exporta `db`.
- Consultas ORM en Postgres siempre con namespace: `db.orm.public.<Model>`.

```ts
// Ejemplos asumiendo modelos Game y Team en el contrato.
// Lista
const games = await db.orm.public.Game.where({ published: true })
  .include("team")
  .orderBy((game) => game.title.asc())
  .all();

// Un registro (agrega LIMIT 1)
const game = await db.orm.public.Game.where({ slug }).first();

// Crear
await db.orm.public.Team.create({ slug, name, members: [] });
```

- `.all()` se consume una sola vez (`await` basta; no escribas helpers `collect()`).
- Para nombrar tipos de filas usa `ResultType` (`@prisma/orm-postgres/components/runtime`)
  o `Models.public_<Model>` de `contract.d.ts`. Mapea las filas a los tipos de `lib/types.ts`
  dentro de `lib/server/*-queries.ts`; el resto de la app no conoce los tipos de Prisma.
- Enums en PSL: `enum nombre { @@type("pg/text@1") valor = "valor" }`.
- Fechas: usa `TimestamptzString` / `temporal.updatedAtString()` (Node 22 no trae `Temporal`).
- Flujo de cambios en la BD:
  - Local: `npm run db:update`.
  - Compartida/producción: `npm run db:migration:plan`, revisa `migrations/app/…`, súbelo en el PR,
    y aplica con `npm run db:migrate`.

## TanStack Query

TanStack Query `5.x` ya está configurado (referencia: https://tanstack.com/query/latest).

- `src/shared/lib/query/get-query-client.ts`: `getQueryClient()` crea un `QueryClient` nuevo por
  request en el servidor y reutiliza uno solo en el navegador. Configura `staleTime: 60s` y
  deshidrata también las queries `pending` para poder hacer streaming.
- `src/shared/components/query-provider.tsx`: `QueryProvider` (`"use client"`) monta el
  `QueryClientProvider` y las devtools. Ya envuelve toda la app en `src/app/layout.tsx`.
- **Devtools**: botón flotante abajo a la derecha, sólo en `npm run dev`. El paquete las excluye
  automáticamente del build de producción.

### Cuándo usarlo

- **Lecturas iniciales de una page**: Server Components + `lib/server/*-queries.ts` (Prisma) como siempre.
- **TanStack Query**: datos que el cliente debe refrescar, paginar, filtrar o mutar sin recargar
  la page (polling, búsquedas, optimistic updates, etc.).

### Convenciones

- Define las queries con `queryOptions` en `lib/<feature>-query-options.ts`, con la feature como
  primer elemento de la key: `["games", "list"]`, `["games", "detail", slug]`.
- La `queryFn` corre también en el navegador, así que **nunca** llama directo a Prisma: usa el cliente
  de la feature (`api/<feature>-api-client.ts`, que valida la respuesta) hacia su Route Handler
  (`api/<feature>-route.ts`, re-exportado en `src/app/api/<feature>/route.ts`) o una Server Action.
- Los hooks que usan `useQuery`, `useSuspenseQuery` o `useMutation` viven en `hooks/`
  (`use-<feature>-<algo>.ts`). Los componentes que los usan llevan `"use client"`.
- Para prellenar el caché desde el servidor **no uses `dehydrate()` de TanStack**: con Cache
  Components lee `Date.now()` durante el prerender y el build falla. Usa
  `dehydrateForPrerender` (`@shared/lib/server/dehydrate-for-prerender`), que toma la fecha de una
  función cacheada con las mismas etiquetas que los datos (patrón de la guía de Next.js
  `02-guides/client-side-data-fetching/tanstack-query.md`), y `QueryHydrationBoundary`
  (`@shared/components/query-hydration-boundary`) dentro de `<Suspense>`:

```ts
// src/features/games/lib/server/games-prefetch.ts  (server-only)
export async function getGamesHydrationState() {
  const games = await listGames(); // "use cache" + cacheTag("games")
  return dehydrateForPrerender([{ queryKey: gamesQueryKeys.list(), data: games }], [GAMES_CACHE_TAG]);
}
```

```tsx
// src/features/games/pages/games-page.tsx
export function GamesPage() {
  return (
    <Suspense fallback={<GamesCatalogSkeleton />}>
      <QueryHydrationBoundary state={getGamesHydrationState()}>
        <GamesCatalog /> {/* useSuspenseQuery(gamesQueryOptions()) desde hooks/ */}
      </QueryHydrationBoundary>
    </Suspense>
  );
}
```

- En el servidor no existe `/api/...`: la hidratación usa la consulta de `lib/server/*-queries.ts`
  y el navegador usa la `queryFn` con `fetch`. Ambos comparten la misma query key.
- Para datos que vienen de la caché de Next.js usa `staleTime: "static"` en sus `queryOptions`:
  la caché de Next (sus etiquetas) es la fuente de verdad y, con un `staleTime` numérico,
  TanStack lee `Date.now()` al renderizar y Next ya no puede prerenderizar el componente.

- Usa la API vigente de 5.x: `environmentManager.isServer()` (no `isServer`),
  `queryClient.query(...)` (no `fetchQuery` / `prefetchQuery`) y
  `queryClient.query({ ...options, staleTime: "static" })` (no `ensureQueryData`).
- Tras una mutación, invalida las dos cachés: `updateTag("<etiqueta>")` en la Server Action y
  `queryClient.invalidateQueries({ queryKey: ["<feature>"] })` en el cliente.
- Estado de la URL (filtros que se comparten): `useSearchParamState` (`@shared/hooks/use-search-param-state`).
  No usa `useSearchParams`, así la página se sigue prerenderizando completa.

## HeroUI (componentes de UI)

HeroUI v3 ya está configurado (referencia: https://heroui.com/en/docs/react/components).

- Los estilos se cargan en `src/app/globals.css` con `@import "@heroui/styles";` después de
  `@import "tailwindcss";`. **No necesita Provider.**
- **Antes de crear un componente de UI propio, revisa si HeroUI ya lo tiene** (Button, Card, Input,
  Modal, Select, Table, Tabs, etc.). Los componentes propios de la feature componen los de HeroUI.
- Importa desde `@heroui/react`: `import { Button, Card } from "@heroui/react";`.
- API de componentes compuestos: `Card.Header`, `Card.Title`, `Card.Content`, `Card.Footer`...
- Están construidos sobre React Aria: usa `onPress` (no `onClick`), `isDisabled`, `isSelected`, etc.
- Los componentes de HeroUI ya traen `"use client"`, así que pueden usarse dentro de Server
  Components. Si **tu** componente pasa handlers (`onPress`) o usa hooks, ese componente sí lleva
  `"use client"`.
- Variantes por props (`<Button variant="primary" size="sm">`) y ajustes con `className` de Tailwind.
- Colores con los tokens del tema en vez de colores fijos: `bg-background`, `text-foreground`,
  `bg-surface`, `text-muted`, `bg-accent`, `text-danger`, etc.
- **Modo oscuro**: el tema de HeroUI se activa con la clase `dark` (o `data-theme="dark"`) en `<html>`.
  La variante `dark:` (redefinida por HeroUI) se activa con esa clase y, como respaldo, con la
  preferencia del sistema; usa los tokens del tema para que ambos casos se vean igual.
  El diseño UTG tiene **un solo tema oscuro**, así que `layout.tsx` fija `class="dark"`.

### Tema UTG

El diseño (carpeta UTG) se traduce a HeroUI en `src/shared/styles/`:

| Archivo | Contenido |
| --- | --- |
| `theme.css` | Paleta `--utg-*` y su mapeo a las variables de HeroUI (`--accent`, `--surface`, `--border`, `--muted`...), radio 0, tipografías y colores extra de Tailwind (`bg-paper`, `text-copy`, `accent-deep`...). |
| `typography.css` | Estilos base y utilidades del diseño: `page-wrap`, `type-mono`, `type-tiny`, `type-giant`, `type-wide`, `section-block`, `scrollbar-none`. |
| `components.css` | Ajustes BEM de HeroUI (variantes de `Button`), `touch-target` (área táctil de 44x44 px) y efectos: `arrow-glyph`, `link-wipe`, `fill-wipe`, capas de glitch y animaciones `animate-rise` / `animate-flash`. |

Variantes de `Button` según el diseño: `primary` (bloque azul), `outline` (borde blanco),
`tertiary` (negro sin borde), `ghost` (flechas) y `size="lg"` para la "pestaña" sin borde.
Para enlaces con apariencia de botón usa `ActionLink` (`@shared/components/action-link`);
para botones con la etiqueta animada, `ActionButton`; para flechas de carrusel, `ArrowButton`.
Las tipografías (Syncopate, Archivo, JetBrains Mono y Martian Mono) se cargan con `next/font`
en `src/shared/lib/fonts.ts`.

## Móvil primero

La mayoría de los visitantes usa el sitio en su teléfono dentro de la sede. Todo cambio visible
cumple estos criterios (revísalos a 360 y 390 px, en horizontal y en escritorio a 1440 px):

- **Sin scroll horizontal** a 360 y 390 px (`document.documentElement.scrollWidth <= innerWidth`).
  `body` oculta el desborde, así que revisa también que nada quede cortado en el borde.
- **Áreas táctiles de al menos 44x44 px.** Si el diseño no permite agrandar el elemento, usa la
  utilidad `touch-target` (pseudo-elemento invisible; el elemento debe ser `relative` o `absolute`
  y su contenedor no debe recortarlo). Para crecer sólo en pantallas táctiles usa `pointer-coarse:`.
- **Campos de texto de al menos 16 px**: con menos, Safari en iOS hace zoom al enfocar.
- **Nada sólo con `hover`.** Lo que aparece o se activa al pasar el mouse necesita una alternativa
  táctil (tocar, foco o un botón). Los efectos de `hover` propios van dentro de
  `@media (hover: hover)` (la variante `hover:` de Tailwind ya lo hace).
- **Alturas con `svh`/`dvh`**, no con `vh`: en móvil `100vh` queda debajo de la barra del navegador.
  Respeta `safe-area-inset-*` en lo que toca los bordes (la barra fija y el pie ya lo hacen).
- **Nada pesado precargado en móvil**: videos e imágenes grandes sin `preload` ni `priority`
  salvo el contenido principal de la primera pantalla.

## TypeScript 6

- `strict` activado; no uses `any` (usa `unknown` y estrecha el tipo).
- Prefiere `type`/`interface` explícitos en `lib/types.ts` y deja que el resto se infiera.
- Usa `import type` para imports que sólo son tipos.
- No uses opciones deprecadas en TS 6 (`baseUrl`, `moduleResolution: node`/`node10`, `target: ES5`).

## Textos de la interfaz (copys)

- Los textos de la interfaz de una feature (títulos, botones, `aria-label`, mensajes) viven en
  `lib/<feature>-copy.ts` (`GAMES_COPY`, `EVENT_COPY`, `FLOOR_PLAN_COPY`...). Los componentes no
  escriben literales: importan el copy de su feature o reciben el texto por props.
- **Un dato se escribe una sola vez.** Horarios (`EVENT_SCHEDULE`), fecha (`EVENT_INFO.startsAt`),
  sede (`EVENT_VENUE`) y organización (`siteConfig.organization`) tienen un solo dueño. Un texto que
  los cita es una función que recibe el dato (`GAMES_COPY.detail.tournamentNote(schedule)`) o lo
  compone con su dueño; nunca vuelve a escribir "12:00" o el nombre de la división.
- Los datos cruzan features por parámetros desde las pages (por ejemplo, los horarios del
  programa llegan al croquis como `PlanZoneTimes`), no por imports que agreguen aristas al grafo.
- El contenido que podría venir de la base de datos (programa, juegos, zonas) no es copy: sigue
  en sus archivos de datos y llega a los componentes por props.

## Estilo de código

- **Nada de emojis.** Prohibidos en código, UI, comentarios, logs, documentación, issues,
  PRs y mensajes de commit.
- Sin `export default`, excepto en los archivos de ruta de `src/app/`.
- Estilos con componentes de HeroUI y clases de Tailwind con los tokens del tema; soporta modo oscuro (`dark:`).
- Accesibilidad: HTML semántico, `alt` en imágenes, enlaces externos con `rel="noopener noreferrer"`.
- Sin dependencias nuevas sin justificarlo en el PR.

## Flujo de trabajo (git flow)

- `main`: producción. `develop`: integración.
- Trabajo nuevo en `feature/<issue>-<description>` (en inglés) (o `fix/…`) desde `develop`, y PR hacia `develop`.
- `release/<version>` y `hotfix/<version>` se integran en `main` y `develop`.
- Commits con Conventional Commits en español, con la feature como scope:
  `feat(games): agregar filtro por género`.
- Nunca hagas push directo a `main` ni a `develop`, ni reescribas historia compartida.
- Sigue `CONTRIBUTING.md` y las plantillas de `.github/`.
