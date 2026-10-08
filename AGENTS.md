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
Los identificadores de código (variables, funciones, archivos) van en **inglés**.

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
npm run lint               # ESLint (incluye reglas de fronteras entre módulos)
npm run typecheck          # next typegen + tsc --noEmit
npm run build              # emite el contrato de Prisma y compila
npm run db:emit            # regenera contract.json / contract.d.ts
npm run db:update          # aplica el contrato a la BD LOCAL (sin migraciones)
npm run db:migration:plan  # genera una migración formal en migrations/app/
npm run db:migrate         # aplica migraciones pendientes
npm run db:seed            # datos de ejemplo
```

Antes de dar por terminado un cambio, `npm run lint` y `npm run typecheck` deben pasar.

## Arquitectura: screaming architecture

La estructura de carpetas "grita" el dominio (videojuegos, equipos, evento), no el framework.

```
src/
├── app/                         # SÓLO rutas de Next.js (page, layout, loading, not-found…)
├── modules/
│   ├── games/                   # Catálogo de videojuegos
│   ├── teams/                   # Equipos de desarrollo
│   └── showcase/                # Información y presentación del evento
└── shared/                      # Código transversal SIN reglas de negocio
    ├── infrastructure/prisma/   # Contrato, cliente (db.ts) y seed de Prisma 8
    └── ui/                      # Componentes genéricos (Container, EmptyState…)
```

### Anatomía de un módulo

```
src/modules/<modulo>/
├── domain/            # Tipos/entidades y puertos (interfaces de repositorio). TS puro.
├── application/       # Casos de uso: funciones `makeXxx(repository)` que devuelven la acción.
├── infrastructure/    # Adaptadores: implementaciones Prisma de los repositorios.
├── ui/                # Componentes React del dominio.
├── index.ts           # API pública segura para cliente y servidor (tipos + UI).
└── server.ts          # API pública de servidor: casos de uso ya conectados a infraestructura.
```

No todos los módulos necesitan todas las capas (`showcase` no tiene persistencia).

### Reglas de dependencias

1. `domain/` no importa nada de `application/`, `infrastructure/`, `ui/`, Next.js, React ni Prisma.
2. `application/` sólo depende de `domain/` (recibe el repositorio por parámetro).
3. `infrastructure/` implementa los puertos de `domain/` y es el **único** lugar que importa
   `@/shared/infrastructure/prisma/db`.
4. `ui/` depende de `domain/` y de `@/shared/ui`. Nunca de `infrastructure/`.
5. Fuera de un módulo, sólo se importa su API pública: `@/modules/<modulo>` o
   `@/modules/<modulo>/server`. ESLint (`no-restricted-imports`) bloquea los imports profundos.
   Dentro del módulo se usan imports relativos.
6. Un módulo puede usar la API pública de otro módulo, pero evita dependencias circulares.
7. `src/app/` no contiene lógica de negocio: compone componentes y llama casos de uso de `server.ts`.
8. `shared/` nunca importa de `modules/`.

### Agregar un módulo nuevo

1. Crea `src/modules/<modulo>/` con las capas que necesite.
2. Si persiste datos, agrega los modelos a `contract.prisma`, ejecuta `npm run db:emit` y crea
   el repositorio en `infrastructure/`.
3. Expón tipos y UI en `index.ts`, y los casos de uso conectados en `server.ts` (con `import "server-only"`).
4. Crea las rutas en `src/app/` consumiendo sólo esas APIs públicas.

## Convenciones de Next.js 16.4

Lee la guía correspondiente en `node_modules/next/dist/docs/` antes de escribir código. Puntos clave:

- **Server Components por defecto.** Agrega `"use client"` sólo en componentes con estado,
  efectos o eventos del navegador, y mantenlos pequeños (hojas del árbol).
- **Cache Components está activo.** Todo dato que no se pueda prerenderizar debe:
  - ir dentro de `<Suspense>` (streaming en request time), o
  - estar en una función/componente con `"use cache"` + `cacheLife(...)`.
  Consulta `01-app/01-getting-started/08-caching.md`.
- **Prisma 8 y prerender.** El runtime de Prisma usa `crypto.randomUUID()` por consulta, así que
  los repositorios llaman `await connection()` (de `next/server`) antes de consultar. Si quieres
  cachear un resultado, envuelve la consulta en una función con `"use cache"` en lugar de usar
  `connection()`, e invalídala con `cacheTag` / `revalidateTag` / `updateTag` tras una mutación.
- `params` y `searchParams` son **Promises**: `const { slug } = await params`.
  Tipa con los helpers globales `PageProps<"/ruta/[param]">` y `LayoutProps<"/ruta">`
  (generados por `next typegen`).
- Mutaciones con **Server Actions** (`"use server"`), ubicadas en el módulo
  (por ejemplo `src/modules/<modulo>/application/` + export desde `server.ts`).
- Metadata con `export const metadata` o `generateMetadata`.
- Alias de imports: `@/*` → `src/*`.

## Prisma 8 (ORM)

Prisma 8 es contract-first y su API **es distinta** a Prisma ≤ 7 (no hay `schema.prisma`,
`@prisma/client`, `prisma generate` ni `prisma migrate dev`). La documentación verificada de la
versión instalada está en `node_modules/@prisma/orm-postgres/skills/prisma-8/` (`SKILL.md` y
`references/`). Léela antes de escribir consultas o migraciones; no respondas de memoria.

- Configuración: `prisma.config.ts` (`definePrismaConfig` + `ormConfig`).
- Contrato: `src/shared/infrastructure/prisma/contract.prisma` (primera línea `// use prisma-8`).
- Artefactos generados (se suben a git, **no se editan a mano**): `contract.json` y `contract.d.ts`.
  Después de cambiar el contrato ejecuta `npm run db:emit`.
- Cliente: `src/shared/infrastructure/prisma/db.ts` exporta `db`.
- Consultas ORM en Postgres siempre con namespace: `db.orm.public.<Model>`.

```ts
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
  o `Models.public_<Model>` de `contract.d.ts`. Mapea las filas a los tipos de `domain/`
  dentro del repositorio; el resto de la app no conoce los tipos de Prisma.
- Enums en PSL: `enum nombre { @@type("pg/text@1") valor = "valor" }`.
- Fechas: usa `TimestamptzString` / `temporal.updatedAtString()` (Node 22 no trae `Temporal`).
- Flujo de cambios en la BD:
  - Local: `npm run db:update`.
  - Compartida/producción: `npm run db:migration:plan`, revisa `migrations/app/…`, súbelo en el PR,
    y aplica con `npm run db:migrate`.

## TypeScript 6

- `strict` activado; no uses `any` (usa `unknown` y estrecha el tipo).
- Prefiere `type`/`interface` explícitos en `domain/` y deja que el resto se infiera.
- Usa `import type` para imports que sólo son tipos.
- No uses opciones deprecadas en TS 6 (`baseUrl`, `moduleResolution: node`/`node10`, `target: ES5`).

## Estilo de código

- Componentes en `kebab-case.tsx`, exportados con nombre en `PascalCase` (sin `export default`
  excepto en archivos de rutas de `src/app/`).
- Estilos con clases de Tailwind; soporta modo oscuro (`dark:`).
- Accesibilidad: HTML semántico, `alt` en imágenes, enlaces externos con `rel="noopener noreferrer"`.
- Sin dependencias nuevas sin justificarlo en el PR.

## Flujo de trabajo (git flow)

- `main`: producción. `develop`: integración.
- Trabajo nuevo en `feature/<issue>-<descripcion>` (o `fix/…`) desde `develop`, y PR hacia `develop`.
- `release/<version>` y `hotfix/<version>` se integran en `main` y `develop`.
- Commits con Conventional Commits en español, con el módulo como scope:
  `feat(games): agregar filtro por género`.
- Nunca hagas push directo a `main` ni a `develop`, ni reescribas historia compartida.
- Sigue `CONTRIBUTING.md` y las plantillas de `.github/`.
