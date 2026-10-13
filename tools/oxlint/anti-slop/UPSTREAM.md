# anti-slop (plugin de Oxlint copiado)

Código copiado (vendored): este repositorio es dueño de sus reglas y de su configuración. Para
actualizarlo usa el skill `install-anti-slop` (procedimiento de actualización), que compara contra
la revisión base de abajo en lugar de sobrescribir los cambios locales.

## Origen

- Repositorio: https://github.com/dmmulroy/anti-slop
- Commit: `e6676e8d0bf17c678cb45b9dacb2bd6ca8dea53a` (`feat(effect): prefer Match for literal branches`,
  2026-09-10). Era el último commit que tocaba `skills/install-anti-slop` en `main` (`c44ef22`) al instalarlo.
- Ruta de origen: `skills/install-anti-slop/assets/anti-slop/` (árbol git `a7831feb0c097943ac813ddcb1367e26eef52da5`).
- Copiado con `scripts/install.mjs` del skill `install-anti-slop` (árbol del skill
  `89044d21c75a367eac1ddbaf208e650b1a7d5820`, igual al de `~/.agents/.skill-lock.json`) el 2026-10-13.
- Verificación: el árbol git de esta carpeta, sin este archivo, es `a7831feb…`, el mismo que el de upstream
  en ese commit. Para recuperar la base sin cambios:
  `git archive e6676e8d skills/install-anti-slop/assets/anti-slop` en un clon de upstream.

## Archivos instalados

- `tools/oxlint/anti-slop/` completo: `index.ts` (plugin genérico, registrado), `rules/`, `shared/`,
  `vendor/eslint-stylistic/` (con su `LICENSE` y `UPSTREAM.md`) y `effect/` (plugin opcional de Effect,
  **no registrado**: el proyecto no depende de `effect`).
- Las pruebas de las reglas (`*.test.ts`) no vienen en el skill; viven en el repositorio de upstream.

## Integración local (fuera de esta carpeta)

- `.oxlintrc.json`: registra `./tools/oxlint/anti-slop/index.ts` como `anti-slop` y activa en `"error"`
  las 18 reglas genéricas y `oxc/no-accumulating-spread`. `no-runtime-typeof` usa la opción de upstream
  `allowInTypeGuards: true`: sin librería de esquemas, la validación de datos externos vive en type guards
  (`value is T`), que `no-unknown-parameters` ya acepta. Ignora las carpetas de agentes, esta carpeta y
  los mismos artefactos generados que ignora ESLint (`next-env.d.ts`, `contract.d.ts`, `migrations/`).
- `tools/oxlint/package.json` (`"type": "module"`): Node carga el plugin como ES module sin el aviso
  `MODULE_TYPELESS_PACKAGE_JSON` y sin cambiar el tipo de módulo del resto del proyecto.
- `tools/oxlint/tsconfig.json`: el plugin importa con extensión `.ts` (type stripping de Node), así que
  se revisa con su propio tsconfig (`npm run typecheck` corre `tsc -p tools/oxlint`) y se excluye del
  `tsconfig.json` raíz.
- `eslint.config.mjs` y `.prettierignore` ignoran esta carpeta para conservar el código de upstream tal cual.
- Dependencias: `oxlint` y `@oxlint/plugins` en `1.88.0`, fijadas sin rango para actualizarlas juntas.
- Script: `npm run lint:oxlint`. Todavía no forma parte de `npm run lint` ni del CI.

## Cambios intencionales respecto a upstream

Ninguno en el código de esta carpeta. Sólo se agregó este archivo.
