# Guía de contribución

¡Gracias por sumarte al **showcase de videojuegos del edificio**!
Este es un proyecto comunitario: cualquier estudiante de la generación puede contribuir.

## 1. Antes de empezar

1. Busca o crea un **issue** usando las plantillas (bug, mejora, nueva funcionalidad o registro de videojuego).
2. Comenta en el issue que quieres tomarlo para que se te asigne y nadie duplique trabajo.
3. Lee [`AGENTS.md`](./AGENTS.md): explica el stack y la arquitectura del proyecto.

## 2. Flujo de trabajo: Git Flow

Usamos [git flow](https://nvie.com/posts/a-successful-git-branching-model/).

| Rama | Sale de | Se integra en | Uso |
| --- | --- | --- | --- |
| `main` | — | — | Código en producción. Sólo recibe merges de `release/*` y `hotfix/*`. |
| `develop` | `main` | — | Rama de integración. Aquí llega todo el trabajo terminado. |
| `feature/<issue>-<description>` | `develop` | `develop` | Nuevas funcionalidades y mejoras. |
| `fix/<issue>-<description>` | `develop` | `develop` | Bugs encontrados antes de liberar. |
| `release/<version>` | `develop` | `main` y `develop` | Preparar una versión (ajustes finales, versión en `package.json`). |
| `hotfix/<version>` | `main` | `main` y `develop` | Corregir un bug urgente en producción. |

Ejemplo con la extensión [git-flow (AVH)](https://github.com/petervanderdoes/gitflow-avh):

```bash
git flow init -d                       # una sola vez (main / develop)
git flow feature start 12-games-catalog
# ...commits...
git flow feature publish 12-games-catalog   # sube la rama y abre un PR hacia develop
```

Sin la extensión:

```bash
git checkout develop && git pull origin develop
git checkout -b feature/12-games-catalog
# ...commits...
git push -u origin feature/12-games-catalog
```

Abre el Pull Request **hacia `develop`** usando la plantilla. No se hace push directo a `main` ni a `develop`.

## 3. Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/es/):

```
feat(games): agregar filtro por género
fix(teams): corregir avatar roto en la tarjeta de equipo
docs: actualizar guía de contribución
refactor(shared): extraer componente Button
chore(deps): actualizar next
```

El *scope* entre paréntesis es la feature afectada.

Si tu cambio se nota en el sitio, agrega una línea en la sección `[Sin publicar]` de
[`CHANGELOG.md`](./CHANGELOG.md). Las versiones y los releases se explican en
[`docs/versioning.md`](./docs/versioning.md).

**Regla del proyecto: nada de emojis** en código, interfaz, documentación, commits, issues ni PRs.

## 4. Entorno local

Requisitos: **Node.js ≥ 22.18**.

```bash
npm install
npm run dev                 # http://localhost:3000
```

Configura también `git blame` para que salte los commits que sólo cambian el formato (están en
[`.git-blame-ignore-revs`](./.git-blame-ignore-revs)); así ves quién hizo el último cambio real de
cada línea:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

Antes de abrir tu PR:

```bash
npm run format      # aplica el formato con Prettier
npm run lint        # incluye las reglas de SonarQube
npm run typecheck
npm test
```

El CI de GitHub Actions corre estos mismos pasos (y `npm run build`) en cada Pull Request. En lugar de
`npm run format`, el CI corre `npm run format:check`, que falla si algún archivo no tiene el formato.
Las pruebas viven en la carpeta `__tests__/` de su feature (o de `src/shared/` y `src/app/`), con las
mismas subcarpetas que el código: `landing/lib/countdown.ts` -> `landing/__tests__/lib/countdown.test.ts`.

### Formato del código

[Prettier](https://prettier.io/) formatea el código (`prettier.config.mjs`): ancho de 120 columnas,
comillas dobles, punto y coma y comas finales. No discutas espacios en las revisiones: lo decide Prettier.

- **Activa "format on save" en tu editor.** En VS Code instala la extensión "Prettier - Code formatter"
  (`esbenp.prettier-vscode`) y en tu configuración de usuario pon `"editor.formatOnSave": true` y
  `"editor.defaultFormatter": "esbenp.prettier-vscode"`. WebStorm lo trae integrado: activa
  "Run on save" en Settings > Languages & Frameworks > JavaScript > Prettier.
- Si no lo tienes, corre `npm run format` antes de abrir tu PR.
- `prettier-plugin-tailwindcss` ordena las clases de Tailwind dentro de cada cadena (también dentro de
  `cn(...)`). Sólo reordena dentro de una misma cadena: el orden de los argumentos de `cn()` sí importa
  para tailwind-merge, que descarta la clase que choca con una posterior (por ejemplo, `text-sm` después
  de `leading-*` borra el interlineado). Pon el tamaño del texto en un argumento anterior al interlineado.
- No se formatean los archivos generados (`package-lock.json`), las
  salidas de compilación, `public/` ni el Markdown, porque Prettier alinea las tablas con espacios y
  editar una celda reescribiría la tabla completa (ver `.prettierignore`).
- `.nvmrc` fija Node 22: con [nvm](https://github.com/nvm-sh/nvm), `nvm use` selecciona esa versión.

## 5. Arquitectura

El código está organizado con **screaming architecture**: las carpetas gritan *de qué trata* la aplicación
(cada dominio es una carpeta en `src/features/`), no *con qué está hecha*.
Hoy sólo existe la feature `landing` (la portada estática).

- Cada feature en `src/features/<feature>/` se organiza en `lib/`, `hooks/`, `components/` y `pages/`,
  más `__tests__/` para sus pruebas. Crea cada carpeta cuando la necesites; el linter valida las que existen. No dejes
  carpetas vacías ni `.gitkeep`.
- `npm run lint` valida qué capa puede importar a cuál y qué features pueden depender de otras
  (`FEATURE_DEPENDENCIES` en `eslint.config.mjs`). Si te bloquea, el mensaje dice qué hacer.
- Las `pages/` son contenedores: obtienen datos y componen componentes. `src/app/` sólo las renderiza.
- **Todo el naming va en inglés**: directorios, archivos, código, ramas y labels. Sólo los textos de la
  interfaz y la documentación van en español.

Las reglas completas están en [`AGENTS.md`](./AGENTS.md). Para orientarte rápido:

- [`docs/design-system.md`](./docs/design-system.md): cómo usar HeroUI con el tema UTG.

## 6. Código de conducta

Sé respetuoso, da retroalimentación constructiva en las revisiones y ayuda a quienes están empezando.
Todos estamos aprendiendo.
