# UT Game Showcase

Plataforma comunitaria para el evento donde se exhiben los videojuegos desarrollados
por los estudiantes de la Ingeniería en Desarrollo y Gestión de Software

## Stack

- [Next.js 16.4](https://nextjs.org) (App Router, Cache Components) + React 19
- TypeScript 6
- [Prisma 8](https://www.prisma.io) (PostgreSQL ≥ 15) como ORM
- Tailwind CSS 4
- [TanStack Query 5](https://tanstack.com/query/latest) con sus devtools (sólo en desarrollo)

## Empezar

Requisitos: **Node.js ≥ 22.18** y **PostgreSQL ≥ 15**.

```bash
npm install
cp .env.example .env   # configura DATABASE_URL
npm run db:emit        # genera los artefactos del contrato de Prisma
npm run db:init        # crea el esquema en tu base local
npm run dev            # http://localhost:3000
```

## Scripts

| Script                        | Qué hace                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`               | Servidor de desarrollo.                                                        |
| `npm run build`             | Emite el contrato de Prisma y compila para producción.                        |
| `npm run lint`              | ESLint (incluye las reglas de fronteras entre features).                      |
| `npm run typecheck`         | Genera los tipos de rutas y ejecuta`tsc`.                                    |
| `npm run db:emit`           | Regenera`contract.json` y `contract.d.ts` tras editar `contract.prisma`. |
| `npm run db:init`           | Crea el esquema en una base de datos vacía.                                   |
| `npm run db:update`         | Aplica cambios del contrato a tu base**local** (sin migraciones).        |
| `npm run db:migration:plan` | Genera una migración formal en`migrations/app/`.                            |
| `npm run db:migrate`        | Aplica las migraciones pendientes.                                             |

## Estructura (screaming architecture)

```
src/
├── app/                  # Sólo rutas: cada archivo renderiza una page de una feature
├── features/             # Dominios del negocio: "gritan" de qué trata la app
│   └── example/          # Feature de ejemplo: cópiala para crear las tuyas
└── shared/               # Código transversal sin reglas de negocio
    ├── components/
    ├── hooks/
    └── lib/
        ├── prisma/       # Contrato y cliente de Prisma 8
        └── query/        # QueryClient de TanStack Query
```

Cada feature tiene siempre `lib/`, `hooks/`, `components/` y `pages/`. Las pages son
contenedores que obtienen datos y componen componentes. Todo el naming va en inglés.
Los detalles están en [`AGENTS.md`](./AGENTS.md).

## Contribuir

Lee [`CONTRIBUTING.md`](./CONTRIBUTING.md). Trabajamos con **git flow**: las ramas
`feature/*` salen de `develop` y regresan a `develop` mediante Pull Request.
