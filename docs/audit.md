# Auditoría técnica del repositorio

Fecha: 11 de octubre de 2026 · Versión auditada: `0.2.0` (`main`, commit `852966b`).

Objetivo: saber si la base actual sirve para construir el resto del proyecto con estas metas:

1. Atender **al menos 2000 usuarios simultáneos** durante el evento.
2. Mantener la **calidad y la mantenibilidad** con contribuciones de estudiantes de toda la generación.
3. Funcionar como **aplicación web progresiva (PWA)**, porque el internet de la sede se cae.

Como referencia se usan las prácticas que se pueden verificar en los repositorios públicos de
[goncy](https://github.com/goncy) (Gonzalo Pozzo, DX de Next.js en Vercel) y
[midudev](https://github.com/midudev) (Miguel Ángel Durán). Cada recomendación cita el
repositorio de donde sale.

## Resumen

**El código no es espagueti.** Hoy está ordenado, tipado en modo estricto, probado, documentado
y con fronteras entre features que ESLint hace cumplir. Esa base vale la pena conservarla.

El riesgo de que termine siendo espagueti viene de otro lado:

- **Complejidad accidental.** Para mostrar 18 juegos que no cambian en el navegador hay nueve
  piezas (repositorio, mock, consultas, prefetch, deshidratación propia, boundary, provider,
  `queryOptions` y Route Handler). Quien llegue nuevo copiará esa ceremonia sin entenderla o la
  esquivará con atajos. En ambos casos el código se enreda.
- **Stack en versiones muy nuevas.** Next.js 16.4, React 19.3, TypeScript 6 y Prisma 8 en
  *release candidate*. Casi no hay tutoriales de estas versiones, y los asistentes de IA
  responden con APIs viejas (el propio `AGENTS.md` lo advierte).
- **Faltan las piezas que piden las metas.** No hay service worker. La portada descarga 2 MB por
  visitante, 1.3 MB de ellos de video. Con un solo servidor y sin CDN, la capacidad se queda
  corta en los picos.

| Área | Estado | En una línea |
| --- | --- | --- |
| Arquitectura y convenciones | Bien | Features con fronteras validadas por ESLint, sin barriles, imports explícitos. |
| Calidad automatizada | Bien | Lint con SonarJS, `strict`, 111 pruebas (≈70 % de cobertura), CI en cada PR. |
| Documentación | Muy bien | `docs/where-to-edit.md` es justo lo que necesita quien llega nuevo. |
| Simplicidad para estudiantes | Riesgo alto | Demasiadas capas y herramientas para lo que hoy hace el sitio. |
| Capacidad (2000 usuarios) | Depende del despliegue | Todo se prerenderiza (bien); falta poner un CDN delante y aligerar la portada. |
| Offline / PWA | Falta | Sólo existe el manifest. Sin conexión, recargar o abrir el sitio falla. |
| Robustez | Regular | Un enlace con `#` mal codificado tumba el croquis; no hay `error.tsx`. |
| Seguridad | Regular | Sin cabeceras de seguridad (CSP, `nosniff`, `Referrer-Policy`). Riesgo bajo: no hay sesiones ni datos personales. |

## Cómo se hizo

- Lectura completa de `src/`, la configuración, la documentación y las plantillas de `.github/`.
- `npm ci`, `npm run lint`, `npm run typecheck`, `npm test -- --coverage` y `npm run build`.
  Todo pasa.
- `next start` (un proceso de Node) y prueba de carga con
  [autocannon](https://github.com/mcollina/autocannon) en un contenedor de 4 vCPU. El generador
  de carga corría en la misma máquina, así que **las cifras son un piso, no un techo**.
- Chromium (Playwright) a 390 px y 1440 px para medir peso, peticiones y comportamiento sin
  conexión.
- Revisión de los repositorios de referencia:
  - [goncy/store](https://github.com/goncy/store): Next 16 con `cacheComponents`, el más parecido a este proyecto.
  - [goncy/nextjs-course](https://github.com/goncy/nextjs-course).
  - [goncy/create-appncy](https://github.com/goncy/create-appncy).
  - [goncy/remote-cache-fallback](https://github.com/goncy/remote-cache-fallback).
  - [midudev/la-velada-web-oficial](https://github.com/midudev/la-velada-web-oficial): sitio de un evento con picos de tráfico enormes.
  - [midudev/kings-league-project](https://github.com/midudev/kings-league-project).
  - [midudev/javascript-100-proyectos](https://github.com/midudev/javascript-100-proyectos), proyecto `68-offline-notes`.

### Mediciones

| Métrica | `/` | `/games` | `/games/ruta-9` | `/floor-plan` |
| --- | --- | --- | --- | --- |
| HTML sin comprimir / gzip | 203 KB / 23 KB | 87 KB / 11 KB | 58 KB / 9 KB | 97 KB / 13 KB |
| JavaScript (gzip) | 244 KB | 243 KB | 230 KB | 244 KB |
| CSS (gzip / sin comprimir) | 50 KB / 474 KB | igual | igual | igual |

Primera visita a la portada en Chromium: **≈2.0 MB transferidos en 36 a 38 peticiones**, igual en
móvil que en escritorio. 1.3 MB son el video `reel.webm`, que tiene `preload="auto"`. Se hacen
5 *prefetch* de rutas.

Prueba de carga contra un solo `next start`:

| Ruta | Conexiones simultáneas | Peticiones/s (promedio) | Latencia p50 | Timeouts |
| --- | --- | --- | --- | --- |
| `/` | 500 | 299 | 1.6 s | 0 |
| `/` | 2000 | 250 | 5.2 s | 332 |
| `/games/ruta-9` | 500 | 478 | 265 ms | 343 |
| `/games/ruta-9` | 2000 | 521 | 258 ms | ≈2000 |
| `/api/games` | 500 | 1025 | 102 ms | 363 |

Lectura de los números:

- **El rendimiento baja conforme crece el HTML.** La portada pesa 3.5 veces más que un detalle y
  rinde ≈40 % menos. Quitar gzip no cambió nada (≈300 req/s); el costo está en servir HTML grande.
- **2000 usuarios simultáneos no son 2000 peticiones por segundo.** Si cada persona activa abre
  una página cada 20 o 30 s, hay entre 70 y 100 páginas/s más sus recursos. Un solo proceso
  aguanta eso en promedio. **No aguanta los picos**, como cuando todos escanean el QR en la
  apertura, ni servir a la vez imágenes, fuentes y video.
- **El cuello de botella real en la sede es el ancho de banda.** 2000 visitas × 2 MB = 4 GB, y
  2.6 GB de eso es el video. Con un enlace de 100 Mbps son más de 5 minutos de red saturada sólo
  para las primeras visitas.

## Lo que ya está bien (conservar)

1. **Todo se prerenderiza.** Todas las rutas salen como `○ (Static)`; las consultas usan
   `"use cache"` + `cacheLife` + `cacheTag`. Es el mismo patrón de `goncy/store` (`list()` con
   `"use cache"; cacheLife("max"); cacheTag("products")` y `generateStaticParams`). Las páginas
   responden `Cache-Control: s-maxage=3600, stale-while-revalidate=82800`, así que ya están
   listas para un CDN.
2. **Las reglas de arquitectura las hace cumplir el linter.** Prohibir `../`, los barriles, el
   código de servidor en componentes y las features dentro de `shared` desde
   `eslint.config.mjs` es lo más valioso del repositorio para un equipo de estudiantes: el
   linter enseña en vez de depender de la revisión humana.
3. **Pruebas cerca del código y sobre funciones puras.** Además hay pruebas de integridad de
   datos: slugs y stands únicos, y cada stand existe en el croquis.
4. **Documentación pensada para quien llega.** `docs/where-to-edit.md` responde "¿dónde cambio
   X?" sin leer código.
5. **Accesibilidad cuidada.** `prefers-reduced-motion`, teclado en el croquis y el exhibidor,
   `aria-live` y textos alternativos.
6. **Plantillas de issues y PR, Conventional Commits, CHANGELOG** y CI en cada PR.
7. **Tipografías con `next/font` e imágenes AVIF/WebP** con `sizes` por cuadrícula.

## Hallazgos

Severidad: **Crítico** (bloquea una meta), **Alto**, **Medio**, **Bajo**.

### A. Offline y PWA

**A1. Crítico. No hay service worker.**
Verificado en Chromium:

- Con la red cortada, recargar da `net::ERR_INTERNET_DISCONNECTED`.
- Navegar dentro de la misma pestaña a una ruta ya precargada (`/games`) sí funciona, gracias
  a `partialPrefetching`. Ese caché vive en memoria y se pierde al cerrar o recargar.

Hoy el sitio no es una PWA, sólo "instalable" a medias.

**A2. Alto. El manifest está incompleto.**

- Sólo declara `icon.svg`. Faltan los íconos PNG de 192 y 512 px, un ícono `maskable` y
  `apple-touch-icon` para iOS.
- También faltan `id` y `scope`.

Ver `src/app/manifest.ts` y la guía `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`.

**A3. Alto. Nada le avisa a la persona que está sin conexión.** Next 16.4 trae
`experimental.useOffline` y el hook `useOffline()` de `next/offline`. Con ellos, una navegación
o Server Action que falla por la red queda pendiente y se reintenta cuando vuelve la conexión.
Además permiten mostrar un aviso. Ver `node_modules/next/dist/docs/01-app/02-guides/offline-support.md`.

**A4. Lo que una PWA puede y no puede resolver en el evento.** Un service worker sólo ayuda a
quien ya abrió el sitio con conexión al menos una vez. Si alguien llega a la sede sin haberlo
visitado y no hay internet, ningún service worker lo salva. Por eso la estrategia tiene tres
partes (ver "Diseño propuesto de la PWA"):

1. Precargar en la primera visita todo lo necesario para el día.
2. Lograr que la gente visite o instale el sitio **antes** del evento.
3. Tener un plan B en la red local de la sede.

### B. Capacidad para 2000 usuarios

**B1. Alto. Con un solo `next start` y sin CDN, los picos saturan el servidor** (ver
mediciones). Opciones, de la más simple a la más laboriosa:

- **Plataforma con CDN** (Vercel, Netlify, Cloudflare). Las páginas estáticas se sirven desde el
  borde y el servidor casi no recibe tráfico. Revisa los términos del plan gratuito antes de
  elegir.
- **Servidor propio de la universidad.** Pon nginx (o Cloudflare) delante con caché que respete
  `s-maxage`, como pide la guía `self-hosting.md` ("Reverse Proxy"). Si usas más de una
  instancia, revisa "Multi-Server Deployments" (clave de cifrado, `deploymentId` y caché
  compartida).

En `la-velada-web-oficial`, midudev prerenderiza 12 de 13 páginas y sólo deja en el servidor las
rutas por usuario. Este proyecto ya tiene esa forma; falta el CDN.

**B2. Alto. El video de la portada se descarga completo en cada visita.**

- `src/features/event/components/event-reel.tsx:35` tiene `preload="auto"`, y el reel se baja
  también en móvil: 1.3 MB de 2.0 MB.
- **Propuesta:**
  - Usar `preload="none"` (o `"metadata"`) y reproducir sólo en pantallas anchas.
  - Respetar `navigator.connection.saveData` y `prefers-reduced-motion`.
  - Mostrar sólo el póster en móvil.
  - Publicar una versión ligera del video (720p, ≤500 KB).
- **Referencia:** midudev sube el multimedia de `la-velada` a un CDN de objetos (Cloudflare R2)
  en el `prebuild`, en lugar de servirlo desde el mismo servidor.

**B3. Medio. La portada genera demasiado HTML (203 KB).**

- El exhibidor 3D duplica cada portada para el reflejo
  (`src/features/games/components/game-coverflow.tsx:107`).
- El carrusel pinta las 18 diapositivas y sus miniaturas, y hay 42 `<canvas>`.
- Las clases de Tailwind con valores arbitrarios son ≈30 % del HTML.
- **Propuesta:**
  - Hacer el reflejo con CSS en lugar de duplicar nodos.
  - Pintar sólo las cajas cercanas a la actual.
  - Llevar las cadenas de clases repetidas a clases con nombre en `components.css`.

**B4. Medio. Se carga la hoja de estilos completa de HeroUI** (474 KB sin comprimir) y sólo se
usan 8 componentes: `Button`, `Card`, `Chip`, `EmptyState`, `SearchField`, `Skeleton`,
`ToggleButton` y `Toolbar`. `@heroui/styles` publica la hoja de cada componente en
`dist/components/*.css`. Mide si importar sólo esas reduce el CSS sin romper el tema.

Algo parecido pasa con las tipografías: son cuatro familias (Syncopate, Archivo, JetBrains Mono y
Martian Mono) y suman ≈190 KB en la primera visita. Valoren si dos de ellas pueden compartir
papel.

**B5. Bajo. `next/image` optimiza en tiempo de ejecución.** Cada combinación de imagen, ancho y
formato se genera en el servidor la primera vez que alguien la pide (`X-Nextjs-Cache: MISS`).
Eso cuesta CPU justo en el pico y multiplica las URLs que el service worker tendría que guardar.

- Con pocas imágenes: impórtalas de forma estática (URL con hash y caché `immutable`) o limita
  `images.deviceSizes` e `images.imageSizes` en `next.config.ts`.
- "Calienta" la caché antes del evento visitando todas las páginas.

**B6. Bajo. Un slug inexistente (`/games/no-existe`) responde HTTP 200**, con
`<meta name="robots" content="noindex">` y `Cache-Control: private, no-store`. Es el
comportamiento documentado de Next con streaming (`streaming.md`, "The HTTP contract"), y el
`noindex` evita el daño en SEO. Ten en cuenta que cada URL inventada se renderiza en el servidor;
el proxy inverso o el CDN debe limitar la tasa de peticiones.

### C. Mantenibilidad para estudiantes

**C1. Alto. Demasiadas capas para datos estáticos.** Así llega la lista de juegos a un
componente del navegador:

```
mock-games -> GameRepository -> games-queries ("use cache") -> games-prefetch
  -> dehydrateForPrerender (reimplementa dehydrate de TanStack) -> QueryHydrationBoundary
  -> QueryProvider -> useGames() / useSuspenseQuery(gamesQueryOptions) -> fetchGames -> /api/games
```

`gamesQueryOptions` usa `staleTime: "static"`, así que el navegador nunca vuelve a pedir los
datos. Además no hay polling ni mutaciones. TanStack Query sólo transporta datos que un Server
Component podría pasar como props. El costo:

- Nueve conceptos para entender un listado.
- `src/shared/lib/query/dehydrate-for-prerender.ts` copia detalles internos de TanStack, así que
  puede romperse en cualquier actualización.
- Dependencias extra (`@tanstack/react-query`, devtools y el plugin de ESLint).
- Un endpoint público (`/api/games`) que nadie más usa.

`goncy/store` resuelve lo mismo (catálogo estático con `cacheComponents`) con un solo `api.ts`
por dominio y sin librería de estado. Su curso (`nextjs-course`) indica pedir datos en el
cliente sólo para interacción del usuario o polling.

**Propuesta:**

- Que las pages llamen a `listGames()` y pasen `games` como prop a los componentes cliente
  (`<GamesCatalog games={games} />`).
- Retirar TanStack Query, `dehydrate-for-prerender`, `query-hydration-boundary`,
  `query-provider` y `/api/games`. Volver a agregarlos el día que exista un caso real, como
  marcadores de torneo en vivo.
- En el mismo cambio, `useCopyToClipboard`
  (`src/features/event/hooks/use-copy-to-clipboard.ts:15`) ya no necesitaría `useMutation`: un
  `useState` basta.
- Se pueden mantener la interfaz `GameRepository` y el mock: sirven para que cualquiera trabaje
  sin base de datos, como `USE_MOCKS` en `goncy/store`.

> **Decisión del 11 de octubre:** Prisma se queda. Ya empezó el trabajo del diagrama
> entidad-relación para conectar la base de datos, así que la fase 1 ya no retira Prisma. En su
> lugar, la conexión se hace con `prisma-game-repository.ts` detrás de `GameRepository` (ver
> #21). El análisis de abajo se conserva como contexto y para cuidar lo que agregue la base de
> datos: costo, puntos de falla y conexiones con 2000 usuarios. Las consultas deben seguir
> cacheadas con `"use cache"` para que las páginas sigan siendo estáticas.

**C2. Alto. Prisma 8 RC está instalado pero no se usa.**

- `contract.prisma` no tiene modelos y nada importa `@shared/lib/prisma/db`, pero
  `prisma contract emit` corre en cada `npm run build` (`prebuild`).
- Son dos paquetes en *release candidate* fijados a mano, una CLI y una sección larga de
  `AGENTS.md` que todo contribuidor lee.

Antes de seguir, decidan si el evento **necesita** una base de datos. Para 18 a 40 juegos que se
registran con el issue "Registro de videojuego", lo más simple y robusto es **contenido como
datos**: un archivo tipado (`games.ts` o JSON) que se edita por PR.

- Así trabaja midudev en `la-velada-web-oficial` (constantes tipadas en `src/consts/*.ts`).
- `goncy/store` lee una hoja de Google publicada y, si la carga falla, el build falla y
  producción sigue sirviendo la última versión buena.
- Una base de datos agrega costo de hospedaje, un punto de falla el día del evento y límites
  de conexiones con 2000 usuarios.

Si la necesitan (por ejemplo, para inscripciones a torneos), agréguenla cuando llegue esa
feature, no antes.

**C3. Medio. Stack demasiado nuevo para un equipo que está aprendiendo.**

- Next 16.4 con `cacheComponents` y `partialPrefetching`, TypeScript 6, React 19.3, HeroUI 3 y
  Prisma 8 RC. ESLint 9 ya aparece como "no longer supported" al instalar.
- No es un error usar lo último, pero cada versión nueva cuesta horas de estudiante.
- **Propuesta:**
  - Congelar versiones hasta después del evento.
  - Activar Renovate o Dependabot con agrupación mensual.
  - Mantener la regla de leer `node_modules/next/dist/docs/` antes de escribir código.

**C4. Medio. Estilos difíciles de modificar de forma consistente.**

- Hay 478 valores arbitrarios de Tailwind (`[--cw:clamp(...)]`, `text-[clamp(...)]`) y colores
  fijos en componentes (`#d6d6d6`, `#0b0b0d`, degradados en constantes), aunque `AGENTS.md` pide
  usar los tokens del tema.
- **Propuesta:**
  - Pasar los valores que se repiten a tokens en `theme.css` y a clases con nombre en
    `components.css`.
  - Agregar `prettier-plugin-tailwindcss` para que el orden de las clases no dependa de cada
    persona.

**C5. Medio. No hay formateador ni hooks de pre-commit.** Sin Prettier (o Biome), cada editor
formatea distinto y los PR se llenan de cambios de espacios.

- En `kings-league-project`, midudev usa husky: formato y `lint:fix` en el pre-commit, pruebas
  en el pre-push.
- **Propuesta:**
  - Prettier con un script `format:check` en CI.
  - `lint-staged` con husky (opcional, pero ayuda mucho).
  - `.nvmrc` con `22`.

**C6. Medio. La feature `example`, que se debe copiar, está rota.**

- `ExampleCard` es `return` sin nada (`src/features/example/components/example-card.tsx`).
- `ExamplePage` renderiza un `<main>` vacío.
- `getExampleMessage` no se usa.

Mientras tanto, `AGENTS.md` muestra un ejemplo completo con datos. Quien la copie no aprende el
patrón. Arréglenla o bórrenla y señalen `games` como referencia.

**C7. Medio. Faltan pruebas de punta a punta.** Las 111 pruebas cubren funciones y componentes
aislados, pero nada abre el sitio en un navegador. `goncy/store` corre Playwright en escritorio
y en móvil en su CI. Basta con 4 o 5 recorridos: portada, buscar un juego, abrir el detalle, ir
al croquis desde "Ver en el croquis" y, cuando exista, la prueba sin conexión.

**C8. Bajo. Tipos de contenido muy abiertos.**

- `genre: string` y `stand: string` (`src/features/games/lib/types.ts:29` y `:34`).
- El formulario del issue "Registro de videojuego" ofrece géneros que no coinciden con los
  datos ("Puzzle" contra "Puzle", "Deportes / Carreras" contra "Carreras"; faltan "Roguelike",
  "Sigilo", "Metroidvania"...).
- **Propuesta:** una constante `GAME_GENRES` con su tipo unión en `lib/` y la misma lista en el
  formulario.

**C9. Bajo. Contenido escrito dentro de funciones.**

- `describeGame` repite horarios del programa ("antes de las 12:00", "a las 17:00").
- `getGameFeatures` dice "Un jugador" para todos los juegos
  (`src/features/games/lib/game-details.ts:10` y `:20`).

Si cambia el programa, el detalle queda desactualizado. Esos datos deben salir de
`event-program.ts` o del propio juego.

**C10. Bajo. Carpetas obligatorias con `.gitkeep`.** Exigir `lib/`, `hooks/`, `components/` y
`pages/` aunque estén vacías es ceremonia. `goncy/store` crea una carpeta sólo cuando hace
falta. Conserven las reglas de ESLint, que sí aportan, y permitan omitir carpetas vacías.

### D. Robustez y seguridad

**D1. Alto. Un hash mal codificado tumba el croquis.**

- `src/shared/hooks/use-url-hash.ts:5` llama a `decodeURIComponent` sin protección.
- Al abrir `/floor-plan#%E0%A4%A` (por ejemplo, un QR mal generado) aparece `URIError: URI
  malformed` y la página completa muestra "This page couldn't load". Verificado en Chromium.
- **Corrección:** envolver la decodificación en `try/catch` y devolver `""`, con una prueba.

**D2. Medio. No hay `error.tsx` ni `global-error.tsx`.** Cualquier error en el cliente muestra
la pantalla genérica de Next en inglés, sin forma de volver al sitio. Agreguen una en español
con "Reintentar" e "Ir al inicio".

**D3. Medio. Sin cabeceras de seguridad.** No se envían `Content-Security-Policy`,
`X-Content-Type-Options`, `Referrer-Policy` ni `Permissions-Policy`. El riesgo es bajo porque no
hay sesiones, pero es una buena práctica barata (`next.config.ts` → `headers()`). midudev las
define en `vercel.json` de `la-velada-web-oficial`. Guía:
`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`.

**D4. Bajo. La URL pública cae en silencio a `localhost`.**

- `src/shared/lib/site-config.ts:11` usa `http://localhost:3000` si falta `NEXT_PUBLIC_SITE_URL`.
- Un despliegue mal configurado publicaría canonical, Open Graph y sitemap apuntando a
  `localhost`.
- **Corrección:** que el build falle en producción si la variable no existe.

### E. Proceso de colaboración

- **Un cambio por PR.** La plantilla de `la-velada-web-oficial` lo pide explícitamente e incluye
  una lista de verificación en móvil (< 768 px) y escritorio (≥ 1024 px), y una sección de
  dependencias agregadas. Vale la pena copiar esas tres ideas a `.github/PULL_REQUEST_TEMPLATE.md`.
- **Deploy de vista previa por PR** (Vercel, Netlify o Cloudflare Pages). Quien revisa puede abrir
  el cambio en su teléfono sin clonar. Es lo que más acelera las revisiones entre estudiantes.
- **`CODEOWNERS` por feature** (`src/features/floor-plan/ @quien-lo-mantiene`), para que cada PR
  llegue a quien conoce esa parte.
- **Etiquetas `good first issue`** con issues pequeños y bien descritos. Muchos hallazgos de esta
  auditoría sirven como primeros issues.
- **Git flow** es pesado para un sitio con un solo despliegue. Si no es requisito de la materia,
  GitHub Flow (`main` + ramas cortas + preview) reduce los merges de `release/*`. Si es
  requisito, consérvenlo.

### F. Requisitos transversales

**F1. Móvil primero.** La mayoría de visitantes abrirá el sitio en su teléfono, dentro de la sede
y con mala señal. Todo PR que cambie la interfaz se revisa con estos criterios:

- Sin scroll horizontal a 360 px y 390 px de ancho, en vertical y en horizontal.
- Áreas táctiles de al menos 44 × 44 px y separadas entre sí. Ninguna acción depende sólo de
  `hover`.
- Campos de texto con `font-size` de 16 px o más. Con menos, Safari en iOS hace zoom al enfocar
  (hoy el buscador del catálogo usa 14 px).
- Respetar `safe-area-inset-*` y usar `svh`/`dvh` en lugar de `vh`.
- Nada pesado precargado en móvil (ver B2).
- Probado en DevTools con un perfil de Android de gama media (CPU 4x más lenta y red "Fast 4G")
  y, cuando se pueda, en un teléfono real.

**F2. Naming en inglés.** Todo nombre va en inglés: archivos, carpetas, código, ids de HTML,
anclas de URL, claves, ramas y etiquetas. Sólo el texto visible para el usuario (y la
documentación) va en español. Quedan nombres en español que hay que renombrar:

- Ids de sección: `destacados`, `evento`, `juegos`, `programa`, `mapa` y `ubicacion`.
- La zona `sorteos` del croquis (`ZoneId`, `plan-places.ts` y `plan-layouts.ts`).

## Relación con los issues abiertos

Antes de esta auditoría ya existían los issues #16 a #27 (seguimiento en #27), enfocados en la
arquitectura. Coinciden con varios hallazgos de aquí:

| Hallazgo | Issue existente |
| --- | --- |
| C4 (estilos y colores fijos) | #25 |
| C6 y C10 (`example` rota, carpetas vacías) | #22 |
| C9 (contenido escrito en funciones) | #19 |
| C2 y D4 (Prisma, variables de entorno) | #21 |
| C8 (tipos abiertos) | #24 (para `zoneId`) |

**Hay una tensión que debe decidir el equipo.** #16 propone formalizar la capa API: carpeta
`api/` por feature, DTOs y validación de la respuesta de `/api/games`. C1 propone lo contrario:
quitar `/api/games` y TanStack Query mientras no haya un caso de uso en el navegador. Las dos
cosas no pueden hacerse a la vez. Con Prisma, los datos siguen leyéndose en el servidor, así que
C1 sigue aplicando: si mañana hace falta una API (por ejemplo, para una app de torneos en vivo),
se diseña con #16 como guía.

## Diseño propuesto de la PWA

### Piezas

1. **Manifest completo** (`src/app/manifest.ts`):
   - Íconos PNG de 192 y 512 px y uno `maskable`.
   - `apple-touch-icon` para iOS.
   - `id: "/"` y `scope: "/"`.
   - Opcional: `shortcuts` a `/games` y `/floor-plan`.
2. **Service worker.** Hay dos caminos:
   - **[Serwist](https://github.com/serwist/serwist).** Es la opción que enlaza la guía de PWA
     de Next (`progressive-web-apps.md`). Tiene un ejemplo con Turbopack (`next-turbo-basic`).
     Genera la lista de archivos con hash que hay que precargar, cosa difícil de mantener a
     mano porque cambia en cada build. Es una dependencia nueva, así que justifíquenla en el PR.
   - **Service worker escrito a mano**, como `68-offline-notes` de midudev:
     - Caché versionada.
     - Limpieza de cachés viejas en `activate`.
     - Sólo peticiones GET del mismo origen.

     Es más didáctico para la materia, pero tendrán que resolver ustedes la lista de archivos
     con hash.
3. **`experimental.useOffline` + aviso** en el layout con `useOffline()` ("Sin conexión: lo que ya
   cargaste sigue disponible"). No se fíen sólo de `navigator.onLine`: sólo indica si hay red, no
   si hay internet. Lo advierten tanto la guía de Next como el código de midudev.
4. **Página `/offline`** prerenderizada como respaldo para rutas que no estén en caché.

### Estrategias de caché

| Recurso | Estrategia | Por qué |
| --- | --- | --- |
| `/_next/static/*` (JS, CSS, fuentes) | Cache first | Llevan hash en el nombre: nunca cambian. |
| Páginas: `/`, `/games`, `/games/*`, `/floor-plan` | Precarga al instalar + network first con tiempo límite corto (≈3 s) y respaldo en caché | El contenido cambia poco y en la sede la red es lenta o no existe. |
| Peticiones RSC de Next (`?_rsc=`) | Network first con respaldo en caché, o dejarlas a `useOffline` | Son las navegaciones internas. Si no tienen respaldo, Next debe caer a navegación completa, que sí está en caché. |
| Imágenes (`/_next/image`, `/mock/*`) | Stale-while-revalidate con límite de entradas | Varían por ancho y formato; no conviene precargarlas todas. |
| Video del reel | Sólo red, nunca en caché | 1.3 MB; sin conexión basta el póster. |

Con Serwist, verifica qué reglas predefinidas trae su `defaultCache` en la versión que instalen
antes de escribir reglas propias.

Este sitio es un caso ideal para trabajar sin conexión: todo es estático, el catálogo cabe en
unos cuantos cientos de KB y el croquis es un SVG generado en el navegador. Sin imágenes, los
juegos ya tienen arte generado en `<canvas>`, que puede servir de respaldo sin red.

### Para el día del evento

- **Antes:** publicar el enlace o QR días antes (redes de la universidad, carteles) y pedir
  "agrégalo a tu pantalla de inicio". Con una visita con internet, el service worker ya guarda
  todo el sitio.
- **En la entrada:** colocar el QR donde sí haya señal (o en la red de la sede), no dentro del
  edificio sin cobertura.
- **Plan B en la red local.** El sitio es 100 % estático. Una laptop conectada al router de la
  sede puede servir una copia (`next build` + `next start`, o una exportación estática) aunque
  no haya internet. Un segundo QR apunta a esa IP. Sin HTTPS el service worker no se registra,
  pero en la red local no hace falta.
- **Probar sin conexión antes del evento.** En DevTools → Application → Service Workers, marcar
  "Offline" y recorrer las 4 rutas. Repetir en un teléfono real en modo avión.

## Plan de acción

El orden importa: **simplificar antes de construir**. Si se agrega la PWA sobre las capas
actuales, el service worker tendría que entender también `/api/games` y la caché de TanStack.

### Fase 0: correcciones rápidas (1 semana, buenos primeros issues)

| Issue sugerido | Rama | Hallazgo |
| --- | --- | --- |
| Evitar que un hash mal codificado rompa el croquis | `fix/<n>-safe-url-hash` | D1 |
| Agregar `error.tsx` y `global-error.tsx` en español | `feature/<n>-error-pages` | D2 |
| No precargar el reel en móvil ni con ahorro de datos | `fix/<n>-reel-preload` | B2 |
| Hacer fallar el build sin `NEXT_PUBLIC_SITE_URL` en producción | `fix/<n>-require-site-url` | D4 |
| Arreglar la feature `example` y quitar la regla de carpetas vacías | `fix/<n>-example-scaffold` | C6, C10 (#22) |
| Renombrar ids y anclas en español | `fix/<n>-english-naming` | F2 |
| Revisión móvil: buscador a 16 px, áreas táctiles y desbordes | `fix/<n>-mobile-pass` | F1 |

### Entre fases: formato

| Issue sugerido | Rama | Hallazgo |
| --- | --- | --- |
| Agregar Prettier, `format:check` en CI y `.nvmrc` | `feature/<n>-formatting` | C5 |

Este PR reformatea archivos de todo el repositorio. Se lanza cuando no haya PRs abiertos, para
no provocar conflictos en todos los demás.

### Fase 1: simplificar (2 semanas)

| Issue sugerido | Hallazgo |
| --- | --- |
| Pasar los juegos como props y retirar TanStack Query y `/api/games` (decidir antes frente a #16) | C1 |
| Conectar Prisma detrás de `GameRepository` (lo lleva el trabajo del diagrama ER) | C2 (#21) |
| Tipar los géneros y alinear el formulario de registro | C8 |
| Sacar textos y horarios de `game-details.ts` a los datos | C9 |
| Actualizar `AGENTS.md`, `docs/architecture.md` y `docs/data-sources.md` con el flujo nuevo | C1, C2 |

### Fase 2: PWA (2 a 3 semanas)

| Issue sugerido | Hallazgo |
| --- | --- |
| Manifest completo con íconos PNG, `maskable` y `apple-touch-icon` | A2 |
| Service worker con las estrategias de la tabla | A1 |
| `experimental.useOffline`, aviso de conexión y página `/offline` | A3 |
| Prueba de Playwright sin conexión en CI | A1, C7 |

### Fase 3: capacidad (antes del evento)

| Issue sugerido | Hallazgo |
| --- | --- |
| Desplegar detrás de un CDN (o nginx con caché) y documentar el despliegue | B1 |
| Aligerar el HTML de la portada (reflejo con CSS, menos nodos) | B3 |
| Medir la importación por componentes de HeroUI | B4 |
| Imágenes reales optimizadas antes del build y `deviceSizes` acotado | B5 |
| Cabeceras de seguridad | D3 |
| Prueba de carga contra el entorno real con `npx autocannon` documentada en `docs/` | B1 |

### Criterios para dar por lista la versión del evento

- Portada en móvil con **menos de 800 KB transferidos** en la primera visita (hoy ≈2 MB).
- Con el sitio visitado una vez, **las 4 rutas abren en modo avión**.
- Prueba de carga contra el entorno real: **p95 < 500 ms con 2000 conexiones** en la portada (con
  CDN, el origen casi no debería recibir tráfico).
- `npm run lint`, `typecheck`, `test`, Playwright y `build` en verde en cada PR.
- Cada PR con deploy de vista previa revisado en móvil y escritorio.

## Principios que se adoptan

Tomados de los repositorios de referencia y adaptados a este proyecto:

1. **Estático primero.** Todo lo que se conoce antes del evento se prerenderiza; el servidor
   queda sólo para lo que depende de la persona (`goncy/store`, `la-velada-web-oficial`).
2. **El navegador pide datos sólo si la interacción lo exige.** Si no, props desde un Server
   Component (`goncy/nextjs-course`).
3. **Dependencias mínimas.** Cada librería nueva se justifica en el PR y se agrega cuando hay un
   caso real (`goncy/create-appncy`).
4. **Contenido como datos.** Juegos, programa y zonas son archivos tipados que cualquier
   estudiante puede editar por PR (`la-velada-web-oficial`).
5. **Fallar en el build, no en producción.** Si los datos no cargan o falta configuración, el
   build se detiene y producción sigue con la última versión buena (`goncy/store`).
6. **Multimedia pesada fuera del servidor de la app** y nunca precargada en móvil
   (`la-velada-web-oficial`).
7. **El linter y el CI enseñan.** Cada regla del equipo que se pueda automatizar vive en ESLint,
   Prettier o una prueba, no sólo en un documento (`kings-league-project`).
8. **Un cambio por PR**, revisado en móvil y escritorio (`la-velada-web-oficial`).
