# Versiones y releases

## Política

- **Versionado semántico** (`MAYOR.MENOR.PARCHE`) en `package.json`:
  - `PARCHE`: correcciones sin cambios visibles de funcionalidad (`fix:`).
  - `MENOR`: funcionalidades nuevas compatibles (`feat:`).
  - `MAYOR`: cambios que rompen algo existente (rutas, URLs compartidas, datos).
- Mientras el sitio no se publique para el evento, la versión es `0.x`. La versión que salga
  a producción para el evento será `1.0.0`.
- Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/es/); de ellos
  sale el [`CHANGELOG.md`](../CHANGELOG.md) (formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)).
- Cada PR que cambie algo visible agrega una línea en la sección `[Sin publicar]` del CHANGELOG.

## Publicar un release (git flow)

```bash
git checkout develop && git pull origin develop
git checkout -b release/0.2.0

# 1. Versión y changelog
npm version 0.2.0 --no-git-tag-version   # actualiza package.json y package-lock.json
# Mueve lo de [Sin publicar] a una sección "## [0.2.0] - AAAA-MM-DD" en CHANGELOG.md

# 2. Verificación completa
npm run lint && npm run typecheck && npm test && npm run build

git commit -am "chore(release): 0.2.0"
git push -u origin release/0.2.0
```

1. Abre un PR de `release/0.2.0` hacia **`main`**. No se crea la etiqueta a mano: al hacer merge, el workflow
   `Deploy` despliega y, si el despliegue termina bien, su job `release` crea la etiqueta `v0.2.0` y el Release de
   GitHub con las notas de la sección `## [0.2.0]` del `CHANGELOG.md`. Si el job falla, casi siempre es porque falta esa
   sección (o está vacía): agrégala en `main` y vuelve a lanzar el workflow desde Actions ("Re-run failed jobs" o "Run
   workflow" sobre `main`). Si la versión ya tiene etiqueta (por ejemplo, un redespliegue sin subir la versión), el job
   no hace nada.
2. Integra el release de vuelta en **`develop`** (PR de `release/0.2.0` o de `main` hacia `develop`).

## Hotfix

Un error urgente en producción se corrige en `hotfix/<versión>` desde `main` (por ejemplo
`hotfix/0.2.1`), se sube la versión de parche y se integra en `main` y en `develop`.
