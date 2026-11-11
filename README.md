# UT Game Showcase (UTG)

Sitio del showcase de videojuegos de la División de Ingeniería y Tecnologías de la UT Cancún:
presenta el evento, el catálogo de juegos de los equipos y el croquis para ubicar cada stand.
Proyecto comunitario: contribuyen estudiantes de toda la generación.

## Páginas

| Ruta | Pantalla del diseño | Qué hace |
| --- | --- | --- |
| `/` | `index.html` | Reel, juegos destacados, evento, exhibidor 3D, programa, croquis y ubicación. |
| `/games` | `juegos.html` | Catálogo con carrusel de géneros, buscador y filtros compartibles (`?genre=`). |
| `/games/[slug]` | `juego.html` | Detalle de cada juego: galería, ficha, dónde jugarlo y más juegos. |
| `/floor-plan` | `croquis.html` | Croquis interactivo con zoom, filtros, directorio y enlaces por stand (`#A1`). |
| `/api/games` | | Lista de juegos en JSON para TanStack Query. |
| `/sitemap.xml`, `/robots.txt` | | SEO. |

## Stack

- [Next.js 16.4](https://nextjs.org) (App Router, Cache Components, Partial Prefetching) + React 19
- TypeScript 6
- [HeroUI v3](https://heroui.com/en/docs/react/components) moldeado al diseño UTG (tema propio)
- [TanStack Query 5](https://tanstack.com/query/latest) para el estado de servidor en el cliente
- Tailwind CSS 4
- [Prisma 8](https://www.prisma.io) (PostgreSQL ≥ 15) como ORM (los datos aún son mock)
- ESLint 9 con las reglas de [SonarQube](https://github.com/SonarSource/SonarJS) y de TanStack Query
- [Jest 30](https://jestjs.io) + [Testing Library](https://testing-library.com) para pruebas

## Empezar

Requisitos: **Node.js ≥ 22.18**. PostgreSQL ≥ 15 sólo cuando se conecte la base de datos.

```bash
npm install
cp .env.example .env   # DATABASE_URL y NEXT_PUBLIC_SITE_URL
npm run dev            # http://localhost:3000
```

Mientras los juegos sean mock no hace falta una base de datos para desarrollar ni para el build.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Emite el contrato de Prisma y compila para producción. |
| `npm start` | Sirve el build de producción. |
| `npm run lint` | ESLint: fronteras entre features, SonarQube y TanStack Query. |
| `npm run typecheck` | Genera los tipos de rutas y ejecuta `tsc`. |
| `npm test` | Pruebas con Jest y Testing Library. |
| `npm run test:watch` | Pruebas en modo observador. |
| `npm run test:coverage` | Pruebas con reporte de cobertura (`coverage/`). |
| `npm run db:emit` | Regenera `contract.json` y `contract.d.ts` tras editar `contract.prisma`. |
| `npm run db:init` | Crea el esquema en una base de datos vacía. |
| `npm run db:update` | Aplica cambios del contrato a tu base **local** (sin migraciones). |
| `npm run db:migration:plan` | Genera una migración formal en `migrations/app/`. |
| `npm run db:migrate` | Aplica las migraciones pendientes. |

## Estructura (screaming architecture)

```
src/
├── app/                  # Sólo rutas: cada archivo renderiza una page de una feature
├── features/             # Dominios: "gritan" de qué trata la app
│   ├── event/            # Fecha, sede, programa, reel, ubicación
│   ├── floor-plan/       # Croquis interactivo
│   ├── games/            # Catálogo, detalle, carruseles y API
│   ├── home/             # Portada (compone las demás features)
│   └── example/          # Scaffold mínimo para crear features nuevas
└── shared/               # Código transversal sin reglas de negocio (tema, botones, hooks)
```

Cada feature tiene `lib/`, `hooks/`, `components/` y `pages/`. Las reglas completas están en
[`AGENTS.md`](./AGENTS.md).

## Documentación

| Documento | Para qué |
| --- | --- |
| [`docs/where-to-edit.md`](./docs/where-to-edit.md) | Dónde cambiar textos, fechas, juegos, colores, el croquis o el reel. |
| [`docs/architecture.md`](./docs/architecture.md) | Cómo está construido: capas, flujo de datos, patrones y principios SOLID. |
| [`docs/data-sources.md`](./docs/data-sources.md) | Datos mock y pasos para conectar Prisma. |
| [`docs/design-system.md`](./docs/design-system.md) | Tema UTG sobre HeroUI: colores, tipografía, botones y efectos. |
| [`docs/versioning.md`](./docs/versioning.md) | Versiones, CHANGELOG y cómo publicar un release. |
| [`AGENTS.md`](./AGENTS.md) | Reglas del proyecto (también las leen los agentes de IA). |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Flujo de trabajo, commits y Pull Requests. |

## Contribuir

Lee [`CONTRIBUTING.md`](./CONTRIBUTING.md). Trabajamos con **git flow**: las ramas
`feature/*` salen de `develop` y regresan a `develop` mediante Pull Request. Cada PR pasa por
el CI (lint, typecheck, pruebas y build).
