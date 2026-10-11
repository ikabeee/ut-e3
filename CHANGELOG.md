# Changelog

Cambios notables del proyecto. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y [versionado semántico](https://semver.org/lang/es/). El proceso de release está en
[`docs/versioning.md`](./docs/versioning.md).

## [Sin publicar]

### Agregado

- Sitio sin conexión (PWA): service worker que guarda la portada, el catálogo, cada juego y el
  croquis en la primera visita; aviso "Sin conexión", página `/offline` y aviso "Hay una versión
  nueva" para actualizar. Ver `docs/pwa.md`.
- Documentación del modelo de datos (`docs/data-model.md`): diagrama ER en Mermaid para juegos,
  equipos, stands, check-ins de visitantes sin login, boletos de rifa y afluencia por stand.

## [0.2.0] - 2026-10-10

### Agregado

- Portada (`/`): reel con pausa y código de tiempo, carrusel de destacados con avance
  automático, presentación del evento, torneos y sorteos, exhibidor 3D de juegos, programa
  enlazado al croquis, ubicación con "Copiar dirección" y cierre.
- Catálogo (`/games`): carrusel de géneros, buscador, contador, estado vacío y género en la URL.
- Detalle de cada juego (`/games/[slug]`): galería, etiquetas, acerca del juego, dónde jugarlo,
  panel lateral y más juegos.
- Croquis interactivo (`/floor-plan`): zoom, arrastre, teclado, filtros, directorio, tooltip y
  enlaces por stand (`#A1`).
- API `/api/games` y estado de servidor con TanStack Query prellenado en el servidor.
- Tema UTG sobre HeroUI v3, tipografías con `next/font`, navegación y pie de página.
- SEO: metadata por página, Open Graph, datos estructurados (Event y VideoGame), sitemap,
  robots, manifest e icono UTG.
- Documentación en `docs/` (dónde modificar, arquitectura, datos, sistema de diseño y versiones).
- Calidad: reglas de SonarQube y TanStack Query en ESLint, Jest + Testing Library y CI.
- Páginas de error en español (`error.tsx` y `global-error.tsx`) con el estilo del 404 y las
  acciones "Reintentar" e "Ir al inicio".

### Cambiado

- Móvil: buscador del catálogo a 16 px, áreas táctiles de 44x44 px (flechas, zoom, filtros y
  directorio del croquis, navegación y enlaces del detalle), `safe-area-inset-*` en la barra fija,
  el pie y los márgenes, efectos de `hover` sólo con mouse y el carrusel de destacados ya no se
  queda en pausa después de tocarlo.
- Dependencias: Prisma 8 (`prisma` rc.22, `@prisma/orm-postgres` rc.17, `@prisma/cli-engine`
  0.7.0) y `dotenv` 18.0.7. TypeScript se mantiene en 6.x y ESLint en 9.x.
- Anclas de la portada en inglés: `#featured`, `#event`, `#games`, `#schedule`, `#floor-plan` y
  `#venue` (antes `#destacados`, `#evento`, `#juegos`, `#programa`, `#mapa` y `#ubicacion`). La zona
  "Premios" del croquis ahora es `/floor-plan#raffles` (antes `#sorteos`).

## [0.1.0]

### Agregado

- Scaffold con screaming architecture, TypeScript 6, Prisma 8, TanStack Query y HeroUI v3.
