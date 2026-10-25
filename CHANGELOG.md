# Changelog

Cambios notables del proyecto. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y [versionado semántico](https://semver.org/lang/es/). El proceso de release está en
[`docs/versioning.md`](./docs/versioning.md).

## [Sin publicar]

### Agregado

- Portada de la versión 2 (`/`) con el diseño UTG y los requisitos de la SRS v2: loop animado en el hero,
  carrusel de patrocinadores (aparece cuando haya patrocinadores), tarjetas de Rifa, Marketplace, torneo de KOF y Mario Kart,
  invitadas especiales, catálogo en coverflow, cronograma, croquis interactivo con códigos de stand
  `zA-s3`, ubicación y cierre. El evento es el 20 de noviembre de 2026 de 12:00 a 19:00 (hora de Cancún).

### Eliminado

- La portada estática (hero, grupos, introducción, videojuegos, dinámicas y programa con cuenta
  regresiva) se reemplaza por una portada provisional mientras se construye la versión 2. La versión
  anterior se conserva en la rama `archive/landing-v1`.
- El sitio queda sólo con la portada estática (`/`). Se quitan el catálogo y el detalle de juegos, el
  croquis, el pasaporte con QR, el panel de administración, el portal de equipos, el registro y el
  inicio de sesión, el modo sin conexión, la base de datos (Prisma y PostgreSQL) y TanStack Query. La
  versión anterior se conserva en la rama `archive/develop-v1`. En la portada, "Ver juegos" y la
  navegación llevan a las secciones de la misma página, y la tarjeta de la rifa ya no enlaza al pasaporte.

### Agregado

- Nueva portada estática en tema claro, fiel al diseño "Nueva propuesta": hero, grupos, introducción,
  videojuegos, torneos y dinámicas, y programa con cuenta regresiva. Reemplaza la feature `home`, no
  consulta la base de datos y usa la tipografía LINE Seed JP. La cabecera de la portada pasa a la
  variante clara. La fecha del evento pasa al 20 de noviembre de 2026.
- Registro y alta de videojuegos por parte de los líderes de equipo desde su propio portal (`/team`):
  formulario para dar de alta el juego del equipo con nombre, descripción, enlace a itch.io y cantidad
  de jugadores.
- Visualización y botón para copiar al portapapeles la llave de escáner del stand (`scannerKey`) en el
  resumen del portal de equipos (`/team`).
- Control de acceso basado en roles (RBAC) estricto en el proxy de autenticación: los administradores
  (`role === 'admin'`) están restringidos al panel `/admin` (se redirigen a `/admin` si intentan `/team`),
  mientras que los equipos (`role === 'team'`) están restringidos a `/team` (se redirigen a `/team` si intentan
  `/admin`).
- Envío automático de boletos del sorteo por correo a los visitantes en cuanto completan la prueba
  de todos los videojuegos requeridos en la exhibición, y copia de su código QR personal al registrarse.
- Alta de equipos con usuario líder inicial opcional en el panel de administración: el líder se crea
  sin contraseña inicial y recibe un correo con enlace seguro para establecer su contraseña y
  activar su cuenta (`/confirm-email?token=...`). Se mantiene la bandera `isConfirmed` para detectar
  si el usuario ya confirmó o no su registro, impidiendo el inicio de sesión hasta su activación.

- Configuración centralizada de Node Mailer (`@shared/lib/server/mailer`) para el envío de correos
  salientes (confirmaciones de cuenta de líderes de equipo), con soporte para variables de entorno
  SMTP validadas, vista previa en consola para desarrollo local sin servidor de correo, pruebas
  unitarias y script `npm run email:test` para comprobaciones rápidas.
- Componente compartido `EmptyState` (`@shared/components/empty-state`) para centrar los estados
  vacíos de todo el proyecto (catálogo de juegos, pasaporte de visitantes, panel de administración
  y portal de equipos) con iconos SVG oficiales de Gravity UI (`@gravity-ui/icons`), variantes de
  tamaño y estética acorde al tema UTG.
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

- Panel de administración: se retiró el formulario de alta manual de videojuegos (`/admin/games`),
  trasladando la responsabilidad del registro inicial y mantenimiento de la información del juego
  directamente a los líderes de cada equipo desde su portal (`/team`). El administrador ahora se
  enfoca en la asignación de stands, catálogo global, fotografías y sorteo.
- Limpieza de código y anti-patrones detectados por `anti-ai-slop` (`npm run lint:oxlint`): erradicación
  de monkey-patching y mocks de módulos (`jest.mock`) a favor de inyección de dependencias en
  componentes y servicios, justificación formal de aserciones de tipos con comentarios `SAFETY:`,
  eliminación de aserciones encadenadas (`as unknown as`), normalización de espaciado estructural legible
  y sustitución de comprobaciones de `typeof` en runtime por guardas de tipo canónicas.
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
- Docker: `docker-compose.yml` se simplifica para mantener exclusivamente el servicio de base
  de datos PostgreSQL (`db`), retirando los servicios de `app` y `migrate`.
- Pruebas: viven en la carpeta `__tests__/` de cada feature (y de `src/shared/` y `src/app/`) en lugar
  de junto a cada archivo. El helper `renderWithGames` reemplaza el `QueryClient` repetido en las
  pruebas de componentes que leen el catálogo.

### Eliminado

- La portada estática (hero, grupos, introducción, videojuegos, dinámicas y programa con cuenta
  regresiva) se reemplaza por una portada provisional mientras se construye la versión 2. La versión
  anterior se conserva en la rama `archive/landing-v1`.
- Mocks de la aplicación: se eliminaron los datos mock en memoria (`src/features/games/lib/mock/`),
  la selección de fuentes de datos (`DATA_SOURCE`) y la carpeta `public/mock/`, conectando la
  aplicación de forma 100% dinámica a PostgreSQL mediante Prisma 8. Las imágenes de portada se
  trasladaron a `public/games/`.
- El arte generado de los juegos sin imagen y el campo de torneo por juego (`hasTournament`),
  que ya no existen en el modelo de datos. Los 14 juegos del mock sin imagen usan una portada de
  relleno. La galería del detalle muestra las fotos reales del juego (sin flechas si sólo tiene
  la portada).

### Corregido

- La portada ya no falla con el catálogo vacío (`DATA_SOURCE=prisma` antes de publicar juegos):
  el carrusel de destacados y el exhibidor 3D no se muestran hasta que haya juegos.
- Pedir el boleto sin stands asignados responde "El sorteo se abre cuando los equipos tengan stand
  asignado" en lugar de "Te faltan 0 juegos".
- Las etiquetas animadas ya no se quedan revueltas si cambian a media animación ("Copiar" ->
  "Copiado").
- El carrusel de destacados no consume un cuadro de animación por frame mientras está en pausa
  (con movimiento reducido, toda la visita); el título destacado se reajusta una vez por cuadro al
  redimensionar; el aviso de actualización quita sus listeners del service worker al desmontarse.

### Seguridad

- El service worker ya no guarda el pasaporte (`/passport`) ni el enlace del QR (`/v/<token>`) en
  la caché del navegador: mostraban el gamertag y el token secreto del QR. Sin conexión responden
  la página `/offline`.

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
