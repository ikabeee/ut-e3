## Descripción

<!-- ¿Qué cambia este PR y por qué? -->

Closes #

## Tipo de cambio

- [ ] Bug fix (`fix/*` o `hotfix/*`)
- [ ] Mejora
- [ ] Nueva funcionalidad (`feature/*`)
- [ ] Refactor
- [ ] Documentación
- [ ] Configuración / infraestructura

## Feature(s) afectada(s)

<!-- Lista las carpetas de src/features/ que cambiaste. -->

- [ ] `src/features/<feature>`:
- [ ] `shared`
- [ ] Base de datos (`contract.prisma`)

## ¿Cómo probarlo?

<!-- Pasos para que quien revise pueda verificar el cambio. -->

## Capturas de pantalla

<!-- Si hay cambios visuales, agrega un antes / después. -->

## Checklist

- [ ] La rama sigue git flow (`feature/*`, `fix/*`, `release/*` o `hotfix/*`) y el PR apunta a la rama correcta (`develop`, o `main` sólo para `release/*` y `hotfix/*`).
- [ ] Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/es/).
- [ ] `npm run lint`, `npm run typecheck` y `npm test` pasan sin errores.
- [ ] El código respeta la screaming architecture (ver `AGENTS.md`): la feature tiene `lib/`, `hooks/`, `components/` y `pages/`, y los imports usan los path aliases (`@features/...`, `@shared/...`) sin archivos barril.
- [ ] Directorios, archivos y código tienen naming en inglés.
- [ ] Si cambié `contract.prisma`, ejecuté `npm run db:emit` y subí `contract.json` y `contract.d.ts`.
- [ ] Actualicé la documentación si era necesario.
