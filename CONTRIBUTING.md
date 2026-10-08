# Guía de contribución

¡Gracias por sumarte al **showcase de videojuegos del edificio**! 🎮
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
| `feature/<issue>-<descripcion>` | `develop` | `develop` | Nuevas funcionalidades y mejoras. |
| `fix/<issue>-<descripcion>` | `develop` | `develop` | Bugs encontrados antes de liberar. |
| `release/<version>` | `develop` | `main` y `develop` | Preparar una versión (ajustes finales, versión en `package.json`). |
| `hotfix/<version>` | `main` | `main` y `develop` | Corregir un bug urgente en producción. |

Ejemplo con la extensión [git-flow (AVH)](https://github.com/petervanderdoes/gitflow-avh):

```bash
git flow init -d                       # una sola vez (main / develop)
git flow feature start 12-catalogo-juegos
# ...commits...
git flow feature publish 12-catalogo-juegos   # sube la rama y abre un PR hacia develop
```

Sin la extensión:

```bash
git checkout develop && git pull origin develop
git checkout -b feature/12-catalogo-juegos
# ...commits...
git push -u origin feature/12-catalogo-juegos
```

Abre el Pull Request **hacia `develop`** usando la plantilla. No se hace push directo a `main` ni a `develop`.

## 3. Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/es/):

```
feat(games): agregar filtro por género
fix(teams): corregir avatar roto en la tarjeta de equipo
docs: actualizar guía de contribución
refactor(shared): extraer componente Button
chore(deps): actualizar prisma
```

El *scope* entre paréntesis es el módulo afectado.

## 4. Entorno local

Requisitos: **Node.js ≥ 22.18** y **PostgreSQL ≥ 15**.

```bash
npm install
cp .env.example .env        # configura DATABASE_URL
npm run db:emit             # genera contract.json y contract.d.ts
npm run db:init             # crea las tablas en tu base local
npm run dev                 # http://localhost:3000
```

Antes de abrir tu PR:

```bash
npm run lint
npm run typecheck
```

## 5. Arquitectura

El código está organizado con **screaming architecture**: las carpetas gritan *de qué trata* la aplicación
(`games`, `teams`, `showcase`), no *con qué está hecha*. Las reglas completas están en [`AGENTS.md`](./AGENTS.md).

## 6. Código de conducta

Sé respetuoso, da retroalimentación constructiva en las revisiones y ayuda a quienes están empezando.
Todos estamos aprendiendo. 💜
