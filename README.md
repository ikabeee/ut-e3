# UT Game Showcase (UTG)

Sitio del showcase de videojuegos de la División de Ingeniería y Tecnologías de la UT Cancún.
Proyecto comunitario: contribuyen estudiantes de toda la generación.

Hoy el sitio es sólo la portada estática (`/`): hero, grupos, introducción, juegos, dinámicas y
programa. La versión anterior (catálogo, croquis, pasaporte, panel y base de datos) se conserva en
la rama `archive/develop-v1`.

## Stack

- [Next.js 16.4](https://nextjs.org) (App Router, Cache Components, Partial Prefetching) + React 19
- TypeScript 6
- [HeroUI v3](https://heroui.com/en/docs/react/components) moldeado al diseño UTG (tema propio)
- Tailwind CSS 4
- ESLint 9 con las reglas de [SonarQube](https://github.com/SonarSource/SonarJS)
- [Jest 30](https://jestjs.io) + [Testing Library](https://testing-library.com) para pruebas

## Empezar

Requisitos: **Node.js ≥ 22.18**.

```bash
npm install
npm run dev            # http://localhost:3000
```

El build de producción exige `NEXT_PUBLIC_SITE_URL` (URL absoluta `http(s)` sin `/` final,
por ejemplo `https://ejemplo.com`): si falta o es inválida, `npm run build` falla con un
mensaje que explica el problema. En desarrollo y pruebas se usa `http://localhost:3000`.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Compila para producción. |
| `npm start` | Sirve el build de producción. |
| `npm run lint` | ESLint: fronteras entre features y SonarQube. |
| `npm run typecheck` | Genera los tipos de rutas y ejecuta `tsc`. |
| `npm test` | Pruebas con Jest y Testing Library. |
| `npm run test:watch` | Pruebas en modo observador. |
| `npm run test:coverage` | Pruebas con reporte de cobertura (`coverage/`). |

## Estructura (screaming architecture)

```
src/
├── app/                  # Sólo rutas: cada archivo renderiza una page de una feature
├── features/
│   └── landing/          # Portada estática en tema claro
└── shared/               # Código transversal sin reglas de negocio (tema, metadata, hooks)
```

Cada feature se organiza en `lib/`, `hooks/`, `components/` y `pages/` (crea cada carpeta cuando la
necesites), más `__tests__/` para sus pruebas. ESLint valida qué capa y qué feature puede importar a
cuál. Las reglas completas están en [`AGENTS.md`](./AGENTS.md).

## Documentación

| Documento | Para qué |
| --- | --- |
| [`docs/design-system.md`](./docs/design-system.md) | Tema UTG sobre HeroUI: colores, tipografía, botones y efectos. |
| [`docs/versioning.md`](./docs/versioning.md) | Versiones, CHANGELOG y cómo publicar un release. |
| [`AGENTS.md`](./AGENTS.md) | Reglas del proyecto (también las leen los agentes de IA). |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Flujo de trabajo, commits y Pull Requests. |

## Contribuir

Lee [`CONTRIBUTING.md`](./CONTRIBUTING.md). Trabajamos con **git flow**: las ramas
`feature/*` salen de `develop` y regresan a `develop` mediante Pull Request. Cada PR pasa por
el CI (lint, typecheck, pruebas y build).
