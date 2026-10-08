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

Las versiones de Prisma 8 están fijadas (sin `^`) porque son release candidates.

## Comandos

```bash
npm run dev                # servidor de desarrollo
npm run lint               # ESLint (incluye reglas de fronteras entre features)
npm run typecheck          # next typegen + tsc --noEmit
npm run build              # emite el contrato de Prisma y compila
npm run db:emit            # regenera contract.json / contract.d.ts
npm run db:update          # aplica el contrato a la BD LOCAL (sin migraciones)
npm run db:migration:plan  # genera una migración formal en migrations/app/
npm run db:migrate         # aplica migraciones pendientes
```

Antes de dar por terminado un cambio, `npm run lint` y `npm run typecheck` deben pasar.

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
    ├── components/           # Componentes genéricos
    ├── hooks/                # Hooks genéricos
    └── lib/prisma/           # Contrato y cliente (db.ts) de Prisma 8
```

### Anatomía obligatoria de una feature

Toda feature tiene **siempre** estas cuatro carpetas (si una está vacía, deja un `.gitkeep`):

```
src/features/<feature>/
├── lib/           # Tipos, constantes, utilidades y acceso a datos (<feature>-queries.ts).
├── hooks/         # Hooks de React de la feature (use-<algo>.ts).
├── components/    # Componentes de presentación de la feature.
├── pages/         # Contenedores de página que usa src/app/. Incluye pages/index.ts.
└── index.ts       # API pública client-safe: tipos, componentes y hooks reutilizables.
```

| Carpeta | Responsabilidad | Puede importar |
| --- | --- | --- |
| `lib/` | Tipos de dominio (`types.ts`), constantes, utilidades puras y consultas a la BD (`*-queries.ts` con `import "server-only"` y `await connection()`). Mapea las filas de Prisma a los tipos de dominio. | `@/shared/lib/*` |
| `hooks/` | Estado y lógica de interacción en el cliente. Sin JSX. | `lib/` (sólo tipos y utilidades puras), React |
| `components/` | UI. Reciben datos por props; **no consultan la BD**. Agrega `"use client"` sólo si usan hooks o eventos. | `lib/` (tipos/constantes), `hooks/`, `@/shared/components` |
| `pages/` | **Contenedores**: obtienen los datos (vía `lib/`), definen `Suspense`/`notFound` y componen componentes. Sin estilos complejos ni lógica de negocio. Exportan también su `Metadata`. | `lib/`, `components/`, `@/shared/components` |

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
import { ExamplePage } from "@/features/example/pages";

export { examplePageMetadata as metadata } from "@/features/example/pages";

export default ExamplePage;
```

### Reglas de dependencias

1. Fuera de una feature sólo se importa su API pública:
   - `@/features/<feature>`: tipos, componentes y hooks (seguro en Client Components).
   - `@/features/<feature>/pages`: contenedores de página (sólo desde `src/app/`).
   ESLint (`no-restricted-imports`) bloquea cualquier import profundo. Dentro de la feature se usan imports relativos.
2. Sólo `lib/*-queries.ts` importa `@/shared/lib/prisma/db`.
3. `components/` y `hooks/` nunca importan `*-queries.ts` ni nada con `server-only`.
4. `src/app/` no contiene UI ni lógica: sólo `layout.tsx`, `globals.css` y archivos de ruta que delegan en `pages/`.
5. `shared/` nunca importa de `features/` (también lo valida ESLint).
6. Una feature puede usar la API pública de otra, evitando dependencias circulares.

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
4. Expón las pages en `pages/index.ts` y lo reutilizable en `index.ts`.
5. Crea la ruta en `src/app/` que sólo renderiza la page.

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
- Alias de imports: `@/*` → `src/*`.

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

## TypeScript 6

- `strict` activado; no uses `any` (usa `unknown` y estrecha el tipo).
- Prefiere `type`/`interface` explícitos en `lib/types.ts` y deja que el resto se infiera.
- Usa `import type` para imports que sólo son tipos.
- No uses opciones deprecadas en TS 6 (`baseUrl`, `moduleResolution: node`/`node10`, `target: ES5`).

## Estilo de código

- **Nada de emojis.** Prohibidos en código, UI, comentarios, logs, documentación, issues,
  PRs y mensajes de commit.
- Sin `export default`, excepto en los archivos de ruta de `src/app/`.
- Estilos con clases de Tailwind; soporta modo oscuro (`dark:`).
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
