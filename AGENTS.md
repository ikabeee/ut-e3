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
Cada dominio es una **feature** dentro de `src/features/`. El proyecto es un lienzo en blanco:
sólo existe la feature `example`, que muestra la forma que debe tener cualquier feature nueva.
El contrato de Prisma no tiene modelos todavía.

```
src/
├── app/                      # SOLO rutas de Next.js: renderizan una page de una feature
├── features/
│   └── example/              # Feature de referencia (scaffold): cópiala para crear las tuyas
└── shared/                   # Código transversal SIN reglas de negocio
    ├── components/           # Componentes genéricos (QueryProvider)
    ├── hooks/                # Hooks genéricos
    └── lib/
        ├── prisma/           # Contrato y cliente (db.ts) de Prisma 8
        └── query/            # getQueryClient() de TanStack Query
```

### Anatomía obligatoria de una feature

Toda feature tiene **siempre** estas cuatro carpetas (si una está vacía, deja un `.gitkeep`):

```
src/features/<feature>/
├── lib/           # Tipos, constantes, utilidades y acceso a datos (<feature>-queries.ts).
├── hooks/         # Hooks de React de la feature (use-<algo>.ts).
├── components/    # Componentes de presentación de la feature.
└── pages/         # Contenedores de página que usa src/app/.
```

| Carpeta | Responsabilidad | Puede importar |
| --- | --- | --- |
| `lib/` | Tipos de dominio (`types.ts`), constantes, utilidades puras y consultas a la BD (`*-queries.ts` con `import "server-only"` y `await connection()`). Mapea las filas de Prisma a los tipos de dominio. | `@shared/lib/*` |
| `hooks/` | Estado y lógica de interacción en el cliente. Sin JSX. | `lib/` (sólo tipos y utilidades puras), React |
| `components/` | UI. Reciben datos por props; **no consultan la BD**. Agrega `"use client"` sólo si usan hooks o eventos. | `lib/` (tipos/constantes), `hooks/`, `@shared/components/*` |
| `pages/` | **Contenedores**: obtienen los datos (vía `lib/`), definen `Suspense`/`notFound` y componen componentes. Sin estilos complejos ni lógica de negocio. Exportan también su `Metadata`. | `lib/`, `components/`, `@shared/components/*` |

### Pages como contenedores

Una page de feature sólo orquesta: pide datos, maneja estados de carga/no encontrado y
compone componentes. Toda la UI vive en `components/`.

```tsx
// src/features/example/pages/example-page.tsx
export async function ExamplePage() {
  const message = await getExampleMessage();   // lib/

  return (
    <main className="p-8">
      <ExampleCard message={message} />         {/* components/ */}
    </main>
  );
}
```

Si la page consulta la base de datos, envuelve la parte que espera los datos en `<Suspense>`
(ver "Convenciones de Next.js 16.4").

Los archivos de `src/app/` sólo enlazan la ruta con la page de la feature:

```tsx
// src/app/page.tsx
import { ExamplePage } from "@features/example/pages/example-page";

export { examplePageMetadata as metadata } from "@features/example/pages/example-page";

export default ExamplePage;
```

### Reglas de dependencias

1. `src/app/` sólo importa pages: `@features/<feature>/pages/<name>-page`.
2. Sólo `lib/*-queries.ts` importa `@shared/lib/prisma/db`.
3. `components/` y `hooks/` nunca importan `*-queries.ts` ni nada con `server-only`.
4. `src/app/` no contiene UI ni lógica: sólo `layout.tsx` (que monta `QueryProvider`), `globals.css`,
   archivos de ruta que delegan en `pages/` y Route Handlers (`route.ts`) que delegan en `lib/`.
5. `shared/` nunca importa de `features/` (también lo valida ESLint).
6. Una feature puede importar componentes, hooks o tipos de otra, evitando dependencias circulares.

ESLint (`no-restricted-imports`) valida las reglas 1, 3 y 5, además de las de imports de abajo.

### Imports y path aliases

No usamos archivos barril (`index.ts` que re-exportan). Cada import apunta al archivo concreto
mediante los path aliases de `tsconfig.json`:

| Alias | Apunta a |
| --- | --- |
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |

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
- Sólo el contenido visible para el usuario (textos de la UI) y la documentación van en español.

### Agregar una feature nueva

1. Copia `src/features/example/` a `src/features/<feature>/` (nombre en inglés) y renombra sus archivos,
   o crea las carpetas `lib/`, `hooks/`, `components/` y `pages/`.
2. Si persiste datos, agrega los modelos a `contract.prisma`, ejecuta `npm run db:emit` y
   escribe las consultas en `lib/<feature>-queries.ts`.
3. Crea los componentes en `components/` y el contenedor en `pages/<name>-page.tsx`.
4. Crea la ruta en `src/app/` que sólo renderiza la page.

## Convenciones de Next.js 16.4

Lee la guía correspondiente en `node_modules/next/dist/docs/` antes de escribir código. Puntos clave:

- **Server Components por defecto.** Agrega `"use client"` sólo en componentes con estado,
  efectos o eventos del navegador, y mantenlos pequeños (hojas del árbol).
- **Cache Components está activo.** Todo dato que no se pueda prerenderizar debe:
  - ir dentro de `<Suspense>` (streaming en request time), o
  - estar en una función/componente con `"use cache"` + `cacheLife(...)`.
  Consulta `01-app/01-getting-started/08-caching.md`.
- **Prisma 8 y prerender.** El runtime de Prisma usa `crypto.randomUUID()` por consulta, así que
  las funciones de `lib/*-queries.ts` llaman `await connection()` (de `next/server`) antes de consultar. Si quieres
  cachear un resultado, envuelve la consulta en una función con `"use cache"` en lugar de usar
  `connection()`, e invalídala con `cacheTag` / `revalidateTag` / `updateTag` tras una mutación.
- `params` y `searchParams` son **Promises**: `const { slug } = await params`.
  Tipa con los helpers globales `PageProps<"/ruta/[param]">` y `LayoutProps<"/ruta">`
  (generados por `next typegen`).
- Mutaciones con **Server Actions** (`"use server"`) en `lib/<feature>-actions.ts` de la feature.
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
  dentro de `*-queries.ts`; el resto de la app no conoce los tipos de Prisma.
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

- **Lecturas iniciales de una page**: Server Components + `lib/*-queries.ts` (Prisma) como siempre.
- **TanStack Query**: datos que el cliente debe refrescar, paginar, filtrar o mutar sin recargar
  la page (polling, búsquedas, optimistic updates, etc.).

### Convenciones

- Define las queries con `queryOptions` en `lib/<feature>-query-options.ts`, con la feature como
  primer elemento de la key: `["games", "list"]`, `["games", "detail", slug]`.
- La `queryFn` corre también en el navegador, así que **nunca** llama directo a Prisma: usa `fetch`
  hacia un Route Handler (`src/app/api/<feature>/route.ts`) o una Server Action.
- Los hooks que usan `useQuery`, `useSuspenseQuery` o `useMutation` viven en `hooks/`
  (`use-<feature>-<algo>.ts`). Los componentes que los usan llevan `"use client"`.
- Para prellenar el caché desde el servidor, la page de la feature hace el prefetch y envuelve los
  componentes en `HydrationBoundary`:

```tsx
// src/features/<feature>/pages/<name>-page.tsx
import { dehydrate, HydrationBoundary, noop } from "@tanstack/react-query";
import { getQueryClient } from "@shared/lib/query/get-query-client";

export function GamesPage() {
  const queryClient = getQueryClient();
  // Sin await: la query pendiente se transmite al cliente por streaming.
  // `prefetchQuery` está deprecado en 5.x; usa `query(...)` y descarta el error con `noop`.
  queryClient.query(gamesQueryOptions()).catch(noop);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GamesList /> {/* usa useSuspenseQuery(gamesQueryOptions()) desde hooks/ */}
    </HydrationBoundary>
  );
}
```

- Usa la API vigente de 5.x: `environmentManager.isServer()` (no `isServer`),
  `queryClient.query(...)` (no `fetchQuery` / `prefetchQuery`) y
  `queryClient.query({ ...options, staleTime: "static" })` (no `ensureQueryData`).
- Tras una mutación, invalida con `queryClient.invalidateQueries({ queryKey: ["<feature>"] })`.

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
| `components.css` | Ajustes BEM de HeroUI (variantes de `Button`) y efectos: `arrow-glyph`, `link-wipe`, `fill-wipe`, capas de glitch y animaciones `animate-rise` / `animate-flash`. |

Variantes de `Button` según el diseño: `primary` (bloque azul), `outline` (borde blanco),
`tertiary` (negro sin borde), `ghost` (flechas) y `size="lg"` para la "pestaña" sin borde.
Para enlaces con apariencia de botón usa `ActionLink` (`@shared/components/action-link`);
para botones con la etiqueta animada, `ActionButton`; para flechas de carrusel, `ArrowButton`.
Las tipografías (Syncopate, Archivo, JetBrains Mono y Martian Mono) se cargan con `next/font`
en `src/shared/lib/fonts.ts`.

## TypeScript 6

- `strict` activado; no uses `any` (usa `unknown` y estrecha el tipo).
- Prefiere `type`/`interface` explícitos en `lib/types.ts` y deja que el resto se infiera.
- Usa `import type` para imports que sólo son tipos.
- No uses opciones deprecadas en TS 6 (`baseUrl`, `moduleResolution: node`/`node10`, `target: ES5`).

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
