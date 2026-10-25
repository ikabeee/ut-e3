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
Todo el naming (directorios, archivos y código) va en **inglés**.

## Stack y versiones

| Herramienta | Versión | Notas |
| --- | --- | --- |
| Node.js | `>= 22.18` | |
| Next.js | `16.4.0` | App Router, `cacheComponents` y `partialPrefetching` activados. |
| React | `19.3` | Server Components por defecto. |
| TypeScript | `6.x` | `strict`, `module: preserve`, `moduleResolution: bundler`. |
| Tailwind CSS | `4` | Configurado vía `@tailwindcss/turbopack`. |
| HeroUI | `3.x` (`@heroui/react`, `@heroui/styles`) | Librería de componentes (React Aria + Tailwind 4). |
| ESLint | `9.x` + `eslint-plugin-sonarjs` | Reglas de SonarQube. ESLint 10 aún no es compatible con `eslint-config-next`. |
| Oxlint | `1.89.0` + `eslint-plugin-readable-code` | Reglas anti-slop (copiadas en `tools/oxlint/anti-slop`) y de lectura de arriba abajo ([readable-code](https://github.com/ikabeee/eslint-plugin-readable-code)). |
| Jest | `30.x` + Testing Library | Pruebas unitarias y de componentes (`next/jest`). |
| Prettier | `3.x` + `prettier-plugin-tailwindcss` | Formato del código y orden de las clases de Tailwind. |

## Comandos

```bash
npm run dev                # servidor de desarrollo
npm run lint               # ESLint (incluye reglas de fronteras entre features)
npm run lint:oxlint        # Oxlint con las reglas anti-slop (tools/oxlint/anti-slop) y readable-code
npm run format             # aplica el formato con Prettier (npm run format:check sólo revisa)
npm run typecheck          # next typegen + tsc --noEmit (y tsc -p tools/oxlint para el plugin)
npm test                   # pruebas con Jest (npm run test:coverage para cobertura)
npm run build              # compila para producción (exige NEXT_PUBLIC_SITE_URL)
```

Antes de dar por terminado un cambio, corre `npm run format` y verifica que `npm run lint`,
`npm run lint:oxlint`, `npm run typecheck` y `npm test` pasen. El workflow `.github/workflows/ci.yml` ejecuta lo mismo (con
`npm run format:check` en lugar de `format`, más `npm run build`) en cada PR.

## Arquitectura: screaming architecture

La estructura de carpetas "grita" el dominio, no el framework.
Cada dominio es una **feature** dentro de `src/features/`. Hoy sólo existe `landing`, una portada
provisional mientras se construye la versión 2. La portada estática anterior se conserva en la rama
`archive/landing-v1`, y la versión previa del proyecto (catálogo, croquis, pasaporte, panel, Prisma y
TanStack Query) en `archive/develop-v1`.

```
src/
├── app/                      # SOLO rutas de Next.js: renderizan una page de una feature
├── features/
│   └── landing/              # Portada (/) provisional
└── shared/                   # Código transversal SIN reglas de negocio
    ├── __tests__/            # Pruebas de shared (mismas subcarpetas que el código)
    ├── components/           # Primitivos: JsonLd
    ├── hooks/                # Hooks genéricos (movimiento reducido)
    ├── styles/               # Tema UTG de HeroUI, tipografía y efectos
    └── lib/                  # env, fuentes, metadata y siteConfig
```

### Anatomía de una feature

Una feature se organiza en cuatro carpetas, más `api/` si expone datos por HTTP y `__tests__/` para
sus pruebas. Crea cada carpeta (`lib/`, `hooks/`, `components/`, `pages/`, `api/`) cuando la
necesites; el linter valida las que existen. No dejes carpetas vacías ni `.gitkeep`.

```
src/features/<feature>/
├── __tests__/     # Pruebas, con las mismas subcarpetas que el código (ver "Pruebas").
├── api/           # Contrato HTTP: Route Handlers (<feature>-route.ts) y cliente (<feature>-api-client.ts).
├── lib/           # Tipos, constantes y utilidades puras (se pueden usar en el navegador).
│   └── server/    # Sólo servidor: consultas a la BD (<feature>-queries.ts) y prefetch.
├── hooks/         # Hooks de React de la feature (use-<algo>.ts).
├── components/    # Componentes de presentación de la feature.
└── pages/         # Contenedores de página que usa src/app/.
```

| Carpeta | Responsabilidad | No puede importar |
| --- | --- | --- |
| `lib/` | Tipos de dominio (`types.ts`), constantes y utilidades puras. Llegan al navegador cuando un componente las usa. | `hooks/`, `components/`, `pages/`, código de servidor |
| `lib/server/` | Todo lo que lleva `import "server-only"`: lectura de datos (`*-queries.ts` con `"use cache"` + `cacheLife(...)` o `await connection()`), que mapea lo que llega a los tipos de dominio. | `hooks/`, `components/`, `pages/` |
| `hooks/` | Estado y lógica de interacción en el cliente. Sin JSX. | `components/`, `pages/`, código de servidor |
| `components/` | UI. Reciben datos por props, también el contenido fijo (fechas, textos del evento, zonas): lo lee la page y lo pasa. **No consultan la BD**. Agrega `"use client"` sólo si usan hooks o eventos. | `pages/`, código de servidor |
| `pages/` | **Contenedores**: obtienen los datos (vía `lib/server/`), definen `Suspense`/`notFound` y componen componentes. Sin estilos complejos ni lógica de negocio. Exportan también su `Metadata`. Son el único lugar donde se combinan features libremente. | `hooks/`, `api/` |
| `api/` | Cómo la feature **expone** y **consume** sus datos por HTTP: `<feature>-route.ts` (Route Handlers con `import "server-only"` que usan `lib/server/`), `<feature>-api-client.ts` (ruta del endpoint y `fetch` del navegador) y, si lo que viaja difiere del tipo de dominio, `<feature>-contract.ts` (DTO y validación de la respuesta). | `hooks/`, `components/`, `pages/`; el cliente tampoco importa código de servidor |

"Código de servidor" es `lib/server/` de cualquier feature y `@shared/lib/server/`.
La frontera depende de la carpeta, no del nombre del archivo: `import "server-only"` sólo se permite ahí.

### Pruebas

Las pruebas viven en la carpeta `__tests__/` de cada feature, que repite las subcarpetas del
código: `lib/countdown.ts` -> `__tests__/lib/countdown.test.ts`. Lo mismo aplica a
`src/shared/__tests__/` y a `src/app/__tests__/` (Next.js no enruta las carpetas que empiezan con `_`).

- Jest corre todo archivo `*.test.ts(x)` dentro de `src/`. En `__tests__/`, lo que no termina en
  `.test` es un helper de prueba y no cuenta en la cobertura.
- Las pruebas de `src/app/` importan las rutas con el alias `@app/*` (`@app/error`).
- Una prueba sigue las reglas de dependencias de la carpeta que prueba (`__tests__/lib/` las de
  `lib/`, etc.), pero además puede importar `@app/*` y los helpers de `__tests__/`. ESLint impide que
  el código de la app importe cualquiera de los dos.

### Pages como contenedores

Una page de feature sólo orquesta: pide datos, maneja estados de carga/no encontrado y
compone componentes. Toda la UI vive en `components/`.

La referencia es `src/features/landing/pages/landing-page.tsx`: lee los datos de `@shared/lib/` y los
pasa por props a los componentes. Cada ruta de `src/app/` sólo exporta la page y su metadata:

```tsx
// src/app/page.tsx
export { landingPageMetadata as metadata, LandingPage as default } from "@features/landing/pages/landing-page";
```

Si una consulta no se cachea (usa `await connection()`), envuelve la parte que espera los datos en
`<Suspense>` (ver "Convenciones de Next.js 16.4").

### Reglas de dependencias

1. `src/app/` sólo importa pages: `@features/<feature>/pages/<name>-page`. Tampoco importa
   `@shared/components/*`. `layout.tsx` sólo importa de `@shared/lib/` (fuentes, metadata y siteConfig).
2. Sólo `lib/server/`, `@shared/lib/server/` y los Route Handlers
   (`api/*-route.ts`) importan `server-only`, y nada que pueda llegar al navegador (`lib/`, `hooks/`,
   `components/`, `api/*-api-client.ts`) importa esas carpetas ni los Route Handlers.
3. Dentro de una feature, las capas siguen la tabla de arriba: `lib/` no importa `hooks/`,
   `components/` ni `pages/`; `hooks/` no importa `components/` ni `pages/`; `pages/` no importa `hooks/`.
4. `src/app/` no contiene UI ni lógica: sólo `layout.tsx`, `globals.css`, archivos de ruta que delegan
   en `pages/` y Route Handlers (`route.ts`) que re-exportan `@features/<feature>/api/<feature>-route`.
5. `shared/` nunca importa de `features/`, y no conoce rutas, secciones ni textos del evento. Criterio:
   **si sabe el nombre de una página, una ruta o un texto del evento, no es `shared/`**. Cada
   feature declara sus rutas en `lib/<feature>-links.ts` (`HOME_PATH`).
6. Fuera de `pages/`, una feature sólo importa las features que declara `FEATURE_DEPENDENCIES` en
   `eslint.config.mjs`. Ese grafo no puede tener ciclos (ESLint se detiene si lo tiene). Las `pages/` pueden componer cualquier feature, porque sólo
   `src/app/` las importa y así nunca cierran un ciclo.
7. No hay ciclos entre archivos, tampoco dentro de una misma feature (`import/no-cycle`).

ESLint valida todas estas reglas (`no-restricted-imports` e `import/no-cycle`), además de las de
imports de abajo. Si una regla te bloquea, el mensaje dice qué capa o feature puedes usar.

### Imports y path aliases

No usamos archivos barril (`index.ts` que re-exportan). Cada import apunta al archivo concreto
mediante los path aliases de `tsconfig.json`:

| Alias | Apunta a |
| --- | --- |
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |
| `@app/*` | `src/app/*` (sólo en las pruebas de `src/app/__tests__/`) |

```ts
import { LandingPlaceholder } from "@features/landing/components/landing-placeholder";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { siteConfig } from "@shared/lib/site-config";
```

- Usa siempre un alias, también dentro de la misma feature. Lo único relativo permitido es `./`
  para un archivo de la misma carpeta; `../` está prohibido.
- No crees `index.ts` de re-exportación ni importes una carpeta (`@features/landing`,
  `@features/landing/components`).
- Por qué: los barriles mezclan código de servidor y cliente en un mismo módulo (riesgo de
  arrastrar `server-only` al bundle del navegador), favorecen dependencias circulares,
  hacen más lentos el dev server y el tree-shaking, y esconden de dónde viene cada cosa.
- ESLint rechaza `../`, el alias viejo `@/` y los imports de barriles o carpetas.

### Naming

- **Todo nombre en inglés**: directorios, archivos, variables, funciones, tipos, props,
  ids de formularios, nombres de ramas y labels.
- Directorios y archivos en `kebab-case`: `landing-hero.tsx`, `use-countdown.ts`, `event-content.ts`.
- Componentes y pages en `PascalCase` con export nombrado: `LandingHero`, `LandingPage`.
  Las pages terminan en `Page` y su metadata en `PageMetadata` (`landingPageMetadata`).
- Hooks con prefijo `use`: `useCountdown`.
- Funciones de datos con verbo: `getGroupLabels`, `buildEventStructuredData`.
- Los ids de HTML, las anclas (`#games`, `#program`) y los ids de datos (`id: "raffle"`) también van en inglés.
- Sólo el contenido visible para el usuario (textos de la UI) y la documentación van en español.

### Agregar una feature nueva

1. Crea `src/features/<feature>/` (nombre en inglés) con las carpetas que necesites, siguiendo la
   anatomía de arriba y la feature `landing` como referencia.
2. Si importa otra feature fuera de `pages/`, agrégala a `FEATURE_DEPENDENCIES` en `eslint.config.mjs`.
   Declara su ruta en `lib/<feature>-links.ts`.
3. Crea los componentes en `components/` y el contenedor en `pages/<name>-page.tsx`.
4. Crea la ruta en `src/app/<ruta>/page.tsx` que sólo exporta la page y su metadata (ver el ejemplo
   de arriba) y agrega `alternates.canonical` a su metadata.

## Documentación del proyecto

- `docs/design-system.md`: tema UTG sobre HeroUI.
- `docs/versioning.md` y `CHANGELOG.md`: versionado semántico y releases con git flow.

Si cambias algo visible, agrega una línea en `[Sin publicar]` de `CHANGELOG.md`.

## SEO

- Cada page exporta su `Metadata` (título, descripción, `alternates.canonical`). Para Open Graph
  usa `buildOpenGraph()` (`@shared/lib/metadata`): Next.js no fusiona el `openGraph` del layout.
- Datos estructurados con `JsonLd` (`@shared/components/json-ld`) y un builder en `lib/`.

## Convenciones de Next.js 16.4

Lee la guía correspondiente en `node_modules/next/dist/docs/` antes de escribir código. Puntos clave:

- **Server Components por defecto.** Agrega `"use client"` sólo en componentes con estado,
  efectos o eventos del navegador, y mantenlos pequeños (hojas del árbol).
- **Cache Components está activo.** Todo dato que no se pueda prerenderizar debe:
  - ir dentro de `<Suspense>` (streaming en request time), o
  - estar en una función/componente con `"use cache"` + `cacheLife(...)`.
  Consulta `01-app/01-getting-started/08-caching.md`.
- Para cachear datos, envuélvelos en una función con `"use cache"` e invalídalos con `cacheTag` /
  `revalidateTag` / `updateTag` tras una mutación.
- `params` y `searchParams` son **Promises**: `const { slug } = await params`.
  Tipa con los helpers globales `PageProps<"/ruta/[param]">` y `LayoutProps<"/ruta">`
  (generados por `next typegen`).
- Mutaciones con **Server Actions** (`"use server"`) en `lib/<feature>-actions.ts` de la feature. Son
  endpoints públicos: valida su entrada y sus permisos dentro de la acción.
- Metadata con `export const metadata` o `generateMetadata`.
- Imports con path aliases (ver "Imports y path aliases").

## HeroUI (componentes de UI)

HeroUI v3 ya está configurado (referencia: https://heroui.com/en/docs/react/components).

- Los estilos se cargan en `src/app/globals.css` con `@import "@heroui/styles";` después de
  `@import "tailwindcss";`. **No necesita Provider.**
- **Antes de crear un componente de UI propio, revisa si HeroUI ya lo tiene** (Button, Card, Input,
  Modal, Select, Table, Tabs, etc.). Los componentes propios de la feature componen los de HeroUI.
- Importa desde `@heroui/react`: `import { Button, Card } from "@heroui/react";`.
- API de componentes compuestos: `Card.Header`, `Card.Title`, `Card.Content`, `Card.Footer`...
- Están construidos sobre React Aria: usa `onPress` (no `onClick`), `isDisabled`, `isSelected`, etc.
- Los componentes de HeroUI ya traen `"use client"`, así que pueden usarse dentro de Server
  Components. Si **tu** componente pasa handlers (`onPress`) o usa hooks, ese componente sí lleva
  `"use client"`.
- Variantes por props (`<Button variant="primary" size="sm">`) y ajustes con `className` de Tailwind.
- Colores con los tokens del tema en vez de colores fijos: `bg-background`, `text-foreground`,
  `bg-surface`, `text-muted`, `bg-accent`, `text-danger`, etc.
- **Modo oscuro**: el tema de HeroUI se activa con la clase `dark` (o `data-theme="dark"`) en `<html>`.
  La variante `dark:` (redefinida por HeroUI) se activa con esa clase y, como respaldo, con la
  preferencia del sistema; usa los tokens del tema para que ambos casos se vean igual.
  El diseño UTG tiene **un solo tema oscuro**, así que `layout.tsx` fija `class="dark"`.

### Tema UTG

El diseño (carpeta UTG) se traduce a HeroUI en `src/shared/styles/`:

| Archivo | Contenido |
| --- | --- |
| `theme.css` | Paleta `--utg-*` y su mapeo a las variables de HeroUI (`--accent`, `--surface`, `--border`, `--muted`...), radio 0, tipografías y colores extra de Tailwind (`bg-paper`, `text-copy`, `accent-deep`...). |
| `typography.css` | Estilos base y utilidades del diseño: `page-wrap`, `type-mono`, `type-tiny`, `type-giant`, `type-wide`, `section-block`, `scrollbar-none`. |
| `components.css` | Ajustes BEM de HeroUI (variantes de `Button`), `touch-target` (área táctil de 44x44 px) y efectos: `arrow-glyph`, `link-wipe`, `fill-wipe`, capas de glitch y animaciones `animate-rise` / `animate-flash`. |

Variantes de `Button` según el diseño: `primary` (bloque azul), `outline` (borde blanco),
`tertiary` (negro sin borde), `ghost` (flechas) y `size="lg"` para la "pestaña" sin borde.
Las tipografías (Syncopate, Archivo, JetBrains Mono y Martian Mono) se cargan con `next/font`
en `src/shared/lib/fonts.ts`.

## Móvil primero

La mayoría de los visitantes usa el sitio en su teléfono dentro de la sede. Todo cambio visible
cumple estos criterios (revísalos a 360 y 390 px, en horizontal y en escritorio a 1440 px):

- **Sin scroll horizontal** a 360 y 390 px (`document.documentElement.scrollWidth <= innerWidth`).
  `body` oculta el desborde, así que revisa también que nada quede cortado en el borde.
- **Áreas táctiles de al menos 44x44 px.** Si el diseño no permite agrandar el elemento, usa la
  utilidad `touch-target` (pseudo-elemento invisible; el elemento debe ser `relative` o `absolute`
  y su contenedor no debe recortarlo). Para crecer sólo en pantallas táctiles usa `pointer-coarse:`.
  Dentro de un SVG (`touch-target` no funciona ahí) usa un `<rect>` transparente junto al
  elemento (ver "Áreas táctiles" en `docs/design-system.md`).
- **Campos de texto de al menos 16 px**: con menos, Safari en iOS hace zoom al enfocar.
- **Nada sólo con `hover`.** Lo que aparece o se activa al pasar el mouse necesita una alternativa
  táctil (tocar, foco o un botón). Los efectos de `hover` propios van dentro de
  `@media (hover: hover)` (la variante `hover:` de Tailwind ya lo hace).
- **Alturas con `svh`/`dvh`**, no con `vh`: en móvil `100vh` queda debajo de la barra del navegador.
  Respeta `safe-area-inset-*` en lo que toca los bordes (la barra fija de la portada ya lo hace).
- **Nada pesado precargado en móvil**: videos e imágenes grandes sin `preload` ni `priority`
  salvo el contenido principal de la primera pantalla.

## TypeScript 6

- `strict` activado; no uses `any` (usa `unknown` y estrecha el tipo).
- Prefiere `type`/`interface` explícitos en `lib/types.ts` y deja que el resto se infiera.
- Usa `import type` para imports que sólo son tipos.
- No uses opciones deprecadas en TS 6 (`baseUrl`, `moduleResolution: node`/`node10`, `target: ES5`).

## Textos de la interfaz (copys)

- Los textos de la interfaz de una feature (títulos, botones, `aria-label`, mensajes) viven en
  `lib/<feature>-copy.ts` (`LANDING_COPY`). Los componentes no
  escriben literales: importan el copy de su feature o reciben el texto por props.
- **Un dato se escribe una sola vez.** Horarios (`EVENT_SCHEDULE`), fecha (`EVENT_INFO.startsAt`),
  sede (`EVENT_VENUE`) y organización (`siteConfig.organization`) tienen un solo dueño. Un texto que
  los cita es una función que recibe el dato (`LANDING_COPY.intro.lead(division)`) o lo
  compone con su dueño; nunca vuelve a escribir "12:00" o el nombre de la división.
- Los datos cruzan features por parámetros desde las pages, no por imports que agreguen aristas al grafo.
- El contenido que podría venir de una base de datos (programa, juegos, dinámicas) no es copy: sigue
  en sus archivos de datos y llega a los componentes por props.

## Estilo de código

- **Nada de emojis.** Prohibidos en código, UI, comentarios, logs, documentación, issues,
  PRs y mensajes de commit.
- Sin `export default`, excepto en los archivos de ruta de `src/app/`.
- **El código se lee de arriba abajo.** La función exportada va primero y cada función que llama queda
  debajo, en el orden en que la llama; decláralas con `function` para que el hoisting las haga seguras.
  Oxlint lo revisa (`readable-code/stepdown-order`) junto con funciones de hasta 40 líneas, 3 niveles de
  anidación, 3 parámetros y JSX de hasta 6 niveles.
- Estilos con componentes de HeroUI y clases de Tailwind con los tokens del tema; soporta modo oscuro (`dark:`).
- Accesibilidad: HTML semántico, `alt` en imágenes, enlaces externos con `rel="noopener noreferrer"`.
- Sin dependencias nuevas sin justificarlo en el PR.
- **Formato con Prettier** (`prettier.config.mjs`: 120 columnas, comillas dobles, punto y coma y comas
  finales). Activa "format on save" en el editor o corre `npm run format` antes del PR; el CI rechaza
  el código sin formato (`npm run format:check`). No formatees a mano ni discutas espacios.
- `prettier-plugin-tailwindcss` ordena las clases dentro de cada cadena, también en `cn(...)`, pero no
  mueve clases entre argumentos. Con tailwind-merge el orden de los argumentos importa: el tamaño del
  texto (`text-*`) va en un argumento anterior al interlineado (`leading-*`), por ejemplo `cn("text-sm", "leading-6")`.
- No se formatean los artefactos generados, `public/` ni el Markdown (ver `.prettierignore`). Si un
  commit sólo cambia el formato, agrega su hash a `.git-blame-ignore-revs`.

## Flujo de trabajo (git flow)

- `main`: producción. `develop`: integración.
- Trabajo nuevo en `feature/<issue>-<description>` (en inglés) (o `fix/…`) desde `develop`, y PR hacia `develop`.
- `release/<version>` y `hotfix/<version>` se integran en `main` y `develop`.
- Commits con Conventional Commits en español, con la feature como scope:
  `feat(landing): agregar sección de patrocinadores`.
- Nunca hagas push directo a `main` ni a `develop`, ni reescribas historia compartida.
- Sigue `CONTRIBUTING.md` y las plantillas de `.github/`.
