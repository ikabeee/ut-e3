## Descripción

<!-- ¿Qué cambia este PR y por qué? -->

Closes #<!-- número del issue -->

## Tipo de cambio

- [ ] Bug fix (`fix/*` o `hotfix/*`)
- [ ] Mejora
- [ ] Nueva funcionalidad (`feature/*`)
- [ ] Refactor
- [ ] Documentación
- [ ] Configuración / infraestructura

## Feature(s) afectada(s)

- [ ] `games`
- [ ] `teams`
- [ ] `showcase`
- [ ] `shared`
- [ ] Base de datos (`contract.prisma`)

## ¿Cómo probarlo?

<!-- Pasos para que quien revise pueda verificar el cambio. -->

1.
2.

## Capturas de pantalla

<!-- Si hay cambios visuales, agrega un antes / después. -->

## Checklist

- [ ] La rama sigue git flow (`feature/*`, `fix/*`, `release/*` o `hotfix/*`) y el PR apunta a la rama correcta (`develop`, o `main` sólo para `release/*` y `hotfix/*`).
- [ ] Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/es/).
- [ ] `npm run lint` y `npm run typecheck` pasan sin errores.
- [ ] El código respeta la screaming architecture (ver `AGENTS.md`): la feature tiene `lib/`, `hooks/`, `components/` y `pages/`, y nada importa archivos internos de otra feature.
- [ ] Directorios, archivos y código tienen naming en inglés.
- [ ] Si cambié `contract.prisma`, ejecuté `npm run db:emit` y subí `contract.json` y `contract.d.ts`.
- [ ] No agregué emojis (regla del proyecto).
- [ ] Actualicé la documentación si era necesario.
