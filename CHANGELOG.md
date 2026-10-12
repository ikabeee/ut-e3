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
- Base de datos: contrato de Prisma 8 con el modelo aprobado (11 tablas, `CHECK`, índices
  parciales y `onDelete`), primera migración y seeds idempotentes con los 18 juegos de ejemplo.
- Docker: `Dockerfile` multi-stage (Next.js `standalone`) y `docker-compose.yml` con
  PostgreSQL 16, migraciones y seeds (`npm run docker:up`).
- CI con PostgreSQL: aplica las migraciones, carga los seeds y verifica el esquema.
- El sitio puede leer los juegos de la base de datos (`DATA_SOURCE=prisma`, repositorio de
  Prisma): catálogo, detalle, portada, croquis, API y sitemap. Sólo se muestran los juegos con
  portada; los equipos sin stand aparecen "Por asignar" y no se dibujan en el croquis. El
  detalle muestra las plataformas, el enlace a itch.io y la galería de fotos del juego.
- CRUDs del catálogo para el panel de administración (equipos, integrantes, juegos, fotos,
  géneros y plataformas) con Server Actions protegidas por `ADMIN_USER` / `ADMIN_PASSWORD`,
  validación con mensajes en español y llaves de escáner por equipo.
- `IMAGE_REMOTE_HOSTS`: dominios permitidos para las fotos de los juegos por URL.
- Pasaporte (`/passport`): registro sin login con gamertag, QR personal, avance de juegos
  probados y formulario del boleto del sorteo al completar todos los stands. Abrir el QR
  (`/v/<token>`) recupera el pasaporte en un navegador nuevo. Enlace "Mi QR" en la navegación y
  acceso directo en la app instalada.
- Endpoint del escáner de los stands (`/api/check-ins`): lotes idempotentes de escaneos con la
  llave del equipo.
- Afluencia en vivo de cada stand en el croquis (se refresca cada 30 segundos).
- Server Actions de administración para el sorteo (sortear, listar y avisar a ganadores) y para
  generar un QR nuevo a un visitante.
- Panel de administración (`/admin`), protegido con usuario y contraseña (`ADMIN_USER` /
  `ADMIN_PASSWORD`): equipos con su stand, integrantes y llave del escáner; juegos con sus
  géneros, plataformas y fotos (incluida la portada que los hace visibles); géneros y
  plataformas; sorteo de ganadores, aviso a cada ganador y QR nuevo para quien perdió el suyo.
  El service worker y `robots.txt` lo dejan fuera.
- El sitio se puede instalar como app: manifest con íconos PNG de 192 y 512 px, ícono
  `maskable`, `apple-touch-icon` para iOS y accesos directos a "Juegos" y "Croquis"
  (`npm run pwa:icons` regenera los íconos desde `src/app/icon.svg`).

### Cambiado

- La fecha, los horarios de torneos y sorteos, la sede y la organización se escriben una sola vez y
  los textos los componen: las tarjetas de la portada, el aviso de torneo del detalle, la Arena y
  Premios del croquis, el enlace de Google Calendar y los datos estructurados ya no pueden quedar
  desactualizados. La dirección que se copia se arma con la misma dirección que se muestra.
- "Características" del detalle muestra los jugadores de cada juego (`players`) y "Acerca del juego"
  usa el texto del juego cuando lo tiene (`about`).
- Sistema de diseño: las flechas del exhibidor 3D y de la galería, el zoom del croquis, los géneros,
  los filtros del croquis y la pausa del reel usan variantes con nombre de `components.css` en lugar
  de cadenas largas de utilidades. Los colores del exhibidor y los degradados sobre imágenes salen
  de tokens del tema, y los títulos del detalle usan `type-section`. Sin cambios visuales.
- Móvil: los stands y zonas del croquis (en la portada y en `/floor-plan`) se pueden tocar con un
  área de 44 px o más desde pantallas de 360 px. Info, WC, Comida y Descanso medían 37 a 41 px.
  El área extra es invisible, sólo existe con dedo y no invade las zonas vecinas.
- Pruebas: viven en la carpeta `__tests__/` de cada feature (y de `src/shared/` y `src/app/`) en lugar
  de junto a cada archivo. El helper `renderWithGames` reemplaza el `QueryClient` repetido en las
  pruebas de componentes que leen el catálogo.

### Eliminado

- El arte generado de los juegos sin imagen y el campo de torneo por juego (`hasTournament`),
  que ya no existen en el modelo de datos. Los 14 juegos del mock sin imagen usan una portada de
  relleno. La galería del detalle muestra las fotos reales del juego (sin flechas si sólo tiene
  la portada).

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
