# Especificación de Requisitos de Software (SRS)

## UT Game Showcase: PWA del evento de videojuegos de la UT Cancún

| Campo | Valor |
| --- | --- |
| Documento | Especificación de Requisitos de Software (SRS) |
| Producto | UT Game Showcase (PWA del evento de videojuegos del edificio E3) |
| Versión del documento | 1.0 |
| Base del sistema | Rama `develop`, commit `4bbdb47` |
| Estructura | Basada en ISO/IEC/IEEE 29148 |
| Fuentes | Código de `develop`, `docs/requerimientos-develop.md`, `docs/PWA EVENTO DE VIDEOJUEGOS .pdf`, `docs/sponsors-plan.md` y las decisiones tomadas con el equipo |

---

## Índice

1. [Introducción](#1-introducción)
2. [Descripción general](#2-descripción-general)
3. [Requisitos de interfaces externas](#3-requisitos-de-interfaces-externas)
4. [Requisitos funcionales](#4-requisitos-funcionales)
5. [Reglas de negocio](#5-reglas-de-negocio)
6. [Requisitos no funcionales](#6-requisitos-no-funcionales)
7. [Modelo lógico de datos](#7-modelo-lógico-de-datos)
8. [Casos de uso principales](#8-casos-de-uso-principales)
9. [Decisiones, riesgos aceptados y temas abiertos](#9-decisiones-riesgos-aceptados-y-temas-abiertos)

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requisitos de la aplicación web progresiva (PWA) del evento de videojuegos
de la UT Cancún. Sirve como referencia común para los estudiantes que desarrollan la plataforma, los
responsables de cada módulo y los organizadores del evento. Describe lo que el sistema ya hace en `develop`
y lo que se decidió agregar o cambiar.

### 1.2 Alcance

La PWA es el sistema digital principal del evento. Permite:

- Consultar la información del evento, el catálogo de juegos, el croquis, los invitados y los patrocinadores sin crear una cuenta.
- Obtener un pasaporte con QR personal, registrar visitas a los stands, calificar juegos y participar en la rifa.
- Operar el evento: registrar check-ins en los stands, gestionar equipos, juegos, torneos y el sorteo, y moderar la participación.
- Funcionar con mala señal dentro de la sede.

Queda fuera del alcance: tráiler de los juegos, exportaciones de datos, botón del staff para atraer o alejar
público, cierres oficiales distintos del corte de las 18:00 y cuentas individuales de staff por stand.

### 1.3 Estado de los requisitos

Cada requisito indica su estado:

| Estado | Significado |
| --- | --- |
| **Implementado** | Existe en `develop` y se conserva. |
| **Cambia** | Existe en `develop`, pero se decidió modificarlo; el texto describe el comportamiento nuevo. |
| **Pendiente** | Decidido, todavía no implementado. |

### 1.4 Convenciones de identificación

- `RF-n`: requisito funcional principal (una capacidad). `RF-n.m`: requisito funcional secundario (cómo se cumple).
- `RNF-nn`: requisito no funcional.
- `RN-nn`: regla de negocio.
- `CU-nn`: caso de uso.

Los identificadores `RF` y `RNF` coinciden con `docs/requerimientos-develop.md` para mantener la trazabilidad.

### 1.5 Definiciones y acrónimos

| Término | Definición |
| --- | --- |
| PWA | Aplicación web progresiva: sitio instalable que funciona sin conexión. |
| Visitante | Persona que asiste al evento. Puede ser anónimo (sin pasaporte) o registrado (con pasaporte). |
| Pasaporte | Perfil del visitante registrado: QR personal, juegos visitados, boletos y votos. |
| Gamertag | Apodo público y único del visitante. No es una credencial. |
| Stand | Espacio físico de un equipo (`A1`-`B9`) donde se juega su videojuego. |
| Check-in | Registro de que un visitante probó el juego de un stand. Hay uno como máximo por visitante y juego. |
| Token de identificación | Valor opaco del QR que se escanea en los stands. No abre el pasaporte. |
| Token de recuperación | Valor opaco del enlace que abre el pasaporte en otro dispositivo. Nunca va en el QR. |
| Llave del escáner | Secreto por equipo que autoriza al dispositivo del stand a registrar check-ins. |
| Boleto | Participación en la rifa que se obtiene al alcanzar un hito de visitas. |
| Hito | Número de stands visitados que otorga un boleto (la mitad y el total). |
| People's Choice | Ranking del público a partir de los votos de los visitantes. |
| Promedio bayesiano | Promedio que acerca a la media general los juegos con pocos votos. |
| Afluencia | Nivel bajo, medio o alto de un stand según sus check-ins recientes. |
| Asistencia | Número de visitantes con al menos un check-in, sin contar a los excluidos. |
| Exclusión | Acción del admin que saca a un visitante de la asistencia, anula sus votos y retira sus boletos del sorteo. |
| Bitácora | Registro de auditoría en la base de datos que no se puede modificar desde la aplicación. |
| BD | Base de datos PostgreSQL. |

### 1.6 Referencias

- `AGENTS.md`: arquitectura, convenciones y stack del proyecto.
- `docs/requerimientos-develop.md`: inventario de módulos y requisitos por rama.
- `docs/sponsors-plan.md`: diseño detallado del módulo de patrocinadores.
- `docs/PWA EVENTO DE VIDEOJUEGOS .pdf`: documento original de la PWA del evento.
- `docs/architecture.md`, `docs/data-model.md`, `docs/data-sources.md`, `docs/pwa.md`: documentación técnica.

---

## 2. Descripción general

### 2.1 Perspectiva del producto

Aplicación Next.js 16 (App Router, Server Components y Cache Components) con PostgreSQL mediante Prisma 8,
TanStack Query en el cliente y HeroUI v3 para la interfaz. Se organiza con screaming architecture: una
feature por dominio en `src/features/` (`event`, `games`, `floor-plan`, `home`, `visitors`, `teams`, `auth`,
`admin`, `offline`, `site` y, como pendientes, `sponsors`, votaciones, recorrido, torneos y moderación).

### 2.2 Funciones del producto

| Módulo | Función principal | Estado |
| --- | --- | --- |
| Portada | Información del evento, destacados, programa, ubicación, invitados y asistencia. | Implementado, con partes pendientes |
| Catálogo de juegos | Listado con filtros por género y búsqueda. | Implementado |
| Detalle de juego | Ficha con galería, información, stand e itch.io. | Implementado, itch.io cambia |
| Croquis | Plano interactivo de stands y zonas con afluencia en vivo. | Implementado, con zonas pendientes |
| Pasaporte | Registro sin contraseña, QR, avance y boletos. | Implementado, con cambios |
| Check-ins | API del escáner del stand con soporte sin conexión. | Implementado, con cortes pendientes |
| Autenticación | Login de admin, líderes y encargados de torneos. | Implementado, torneos pendiente |
| Portal del equipo | Gestión del equipo, del juego y escáner. | Implementado |
| Administración | Equipos, juegos, catálogo, sorteo y reemisión de QR. | Implementado, sorteo cambia |
| PWA sin conexión | Precarga, avisos e instalación. | Implementado |
| Marco del sitio | Navegación, pie y páginas de error. | Implementado |
| Patrocinadores | Página y franja de destacados en la portada. | Pendiente |
| Votaciones y People's Choice | Calificación obligatoria (Al final de la actividad) y ranking en vivo. | Pendiente |
| Torneos | Registro, brackets y resultados. (Eliminacion directa). El admin en cada bracket debe colocar quien gano para que pase al siguiente| Pendiente |
| Operación y moderación | Exclusión, anulación, total de stands y asistencia. | Pendiente |

### 2.3 Usuarios y roles

| Rol | Descripción | Identificación | Acceso |
| --- | --- | --- | --- |
| Visitante anónimo | Cualquier persona en el sitio. | Ninguna. | Portada, catálogo, detalle, croquis, patrocinadores, torneos y People's Choice. |
| Visitante registrado | Asistente con pasaporte. | Cookie `httpOnly` `utg_visitor` (60 días), un solo dispositivo activo. | `/passport`, enlace de recuperación `/v/<token>`. |
| Líder de equipo | Estudiante líder (grupos `IDYGS101`-`IDYGS103`). | Sesión `utg_session` firmada, `role: "team"` (7 días). | `/login`, `/team`, `/confirm-email`. |
| Escáner del stand | Dispositivo del stand del equipo. | Encabezado `x-scanner-key` o sesión del líder. | `POST /api/check-ins`, escáner de `/team`. |
| Encargado de torneos (pendiente) | Responsable de los torneos (103 - Estudio 5). | Cuenta propia en tabla aparte, creada por el admin. | Panel propio de torneos. |
| Administrador | Organizador del evento. | Sesión `role: "admin"` (`admin_user`) o Basic Auth `ADMIN_USER` / `ADMIN_PASSWORD`. | `/admin/*`. |
| Sistema | Service worker, caché de Next y correo SMTP. | Interno. | `/sw.js`, `/offline`, Nodemailer. |

### 2.4 Entorno operativo

| Aspecto | Valor |
| --- | --- |
| Fecha del evento | 20 de noviembre de 2026. |
| Horario del evento | De 12:00 a 19:00. |
| Corte de check-ins y votos | 18:00, con tolerancia hasta las 19:00 para lo hecho antes sin señal. |
| Sorteo | Uno solo, a las 18:00, con varios premios. |
| Activación de itch.io | 17:00. |
| Stands | Hasta 18 (`A1`-`A9`, `B1`-`B9`), más los stands informativos `C1`-`C4`. |
| Asistencia estimada | Alrededor de 1,000 visitantes, con picos de concurrencia. |
| Dispositivo principal | Teléfono móvil moderno. |
| Conectividad | Estable para el staff; no garantizada para los visitantes. |

### 2.5 Restricciones

- Stack fijado en `AGENTS.md`: Node `>= 22.18`, Next.js 16.4, React 19.3, TypeScript 6 (`strict`), Prisma 8 (versiones fijadas por ser release candidates), PostgreSQL `>= 15`, Tailwind 4, HeroUI 3, TanStack Query 5.
- Interfaz, documentación y commits en español; nombres de código, archivos y rutas en inglés.
- Sin dependencias nuevas sin justificarlas en el PR.
- Sin `export default` fuera de `src/app/`, sin barriles y sin imports `../`.
- Git flow: trabajo en `feature/*` desde `develop`, sin push directo a `main` ni `develop`.

### 2.6 Suposiciones y dependencias

- Los datos del evento que hoy tiene el código (fecha 27.11.2026, horario de 10:00 a 20:00, horarios de sorteos y textos del croquis) son de ejemplo. Los reales (20 de noviembre de 2026, de 12:00 a 19:00) se corrigen en el código (`EVENT_INFO` y `plan-places.ts`).
- El correo depende de un servidor SMTP configurado.
- El escáner con cámara depende de que el navegador soporte `BarcodeDetector`; si no, se usa la captura manual.
- Los enlaces de itch.io y las fotos remotas dependen de servicios externos.

---

## 3. Requisitos de interfaces externas

### 3.1 Interfaz de usuario

- Móvil primero, tema oscuro único (UTG) sobre HeroUI v3 con los tokens del tema.
- Navegación global con Juegos, Croquis, Mi QR y, como pendientes, Patrocinadores, Torneos y People's Choice.
- Accesible con teclado, HTML semántico y respeto a `prefers-reduced-motion` (ver sección 6.5).

### 3.2 Interfaces de hardware

- Cámara del dispositivo del stand para leer QR (`BarcodeDetector`), con captura manual como respaldo.
- Portapapeles del navegador para "Copiar dirección".

### 3.3 Interfaces de software

| Sistema | Uso |
| --- | --- |
| PostgreSQL (Prisma 8) | Fuente de verdad de equipos, juegos, visitantes, check-ins, boletos y, como pendientes, votos, torneos y bitácora. |
| Servidor SMTP (Nodemailer) | Activación de cuentas de líderes, envío del QR, del enlace de recuperación y de los boletos. |
| itch.io | Enlace externo a cada juego. |
| Google Calendar y Google Maps | Enlaces para agendar el evento y ubicar la sede. |
| Formulario externo | Invitación a patrocinar (URL por definir). |

### 3.4 Interfaces de comunicación (API HTTP)

| Endpoint | Método | Uso | Estado |
| --- | --- | --- | --- |
| `/api/games` | GET | Listado de juegos para TanStack Query. | Implementado |
| `/api/check-ins` | GET | Valida la llave del escáner y devuelve juego y stand. | Implementado |
| `/api/check-ins` | POST | Registra lotes de escaneos (hasta 200). | Implementado, cortes pendientes |
| `/api/stand-traffic` | GET | Afluencia por stand. | Implementado |
| `/v/<token>` | GET | Enlace de recuperación del pasaporte. | Cambia |
| `/api/sponsors` | GET | Listado de patrocinadores. | Pendiente |

---

## 4. Requisitos funcionales

### 4.1 Portada (`home` + `event`), ruta `/`

**Actores:** visitante anónimo y registrado.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-1** | **Reel de video del evento.** | Implementado |
| RF-1.1 | Tiene pausa y código de tiempo. | Implementado |
| RF-1.2 | Se reproduce solo desde cierto ancho (`REEL_AUTOPLAY_MEDIA_QUERY`). | Implementado |
| RF-1.3 | Respeta movimiento reducido. | Implementado |
| **RF-2** | **Carrusel de juegos destacados.** | Implementado |
| RF-2.1 | Avanza solo y muestra una barra de progreso. | Implementado |
| RF-2.2 | Se oculta si no hay juegos publicados. | Implementado |
| RF-2.3 | No consume frames mientras está en pausa. | Implementado |
| **RF-3** | **Información del evento.** | Implementado |
| RF-3.1 | Presentación con fecha, sede y organización (`EVENT_INFO`, `EVENT_VENUE`); cada dato se escribe una sola vez. | Implementado |
| RF-3.2 | Tarjetas de torneos y sorteos con horarios de `EVENT_SCHEDULE`. | Implementado |
| RF-3.3 | Programa del evento enlazado a las zonas del croquis. | Implementado |
| RF-3.4 | Banner de cierre con llamada a la acción. | Implementado |
| RF-3.5 | Sección de invitados con tarjetas: foto, nombre, cargo o estudio y horario de su actividad. | Pendiente |
| RF-3.6 | Contador público de asistencia (RF-64). | Pendiente |
| **RF-4** | **Exhibidor 3D (coverflow) de juegos.** | Implementado |
| RF-4.1 | Se navega con flechas, teclado y swipe. | Implementado |
| RF-4.2 | Se oculta con el catálogo vacío. | Implementado |
| **RF-5** | **Ubicación de la sede.** | Implementado |
| RF-5.1 | Mapa de la sede. | Implementado |
| RF-5.2 | Botón "Copiar dirección" con el portapapeles. | Implementado |
| RF-5.3 | Enlace para agregar el evento a Google Calendar. | Implementado |

### 4.2 Catálogo de juegos (`games`), ruta `/games`

**Actores:** visitante anónimo y registrado.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-6** | **Listado de juegos publicados.** | Implementado |
| RF-6.1 | Muestra solo los juegos con portada (`isGameVisible`). | Implementado |
| RF-6.2 | Contador de resultados, por ejemplo "4 de 18 juegos · Puzle". | Implementado |
| RF-6.3 | Estado vacío con `EmptyState`. | Implementado |
| **RF-7** | **Filtro por género.** | Implementado |
| RF-7.1 | Carrusel de géneros como filtro. | Implementado |
| RF-7.2 | Tocar el género activo lo quita. | Implementado |
| RF-7.3 | El género queda en la URL (`useSearchParamState`) para compartir el enlace. | Implementado |
| **RF-8** | **Buscador de juegos.** | Implementado |
| RF-8.1 | Busca por nombre, equipo, género, stand y descripción. | Implementado |
| RF-8.2 | No distingue acentos ni mayúsculas. | Implementado |

### 4.3 Detalle de juego (`games`), ruta `/games/[slug]`

**Actores:** visitante.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-9** | **Ficha del juego por slug.** | Implementado |
| RF-9.1 | Cada ficha se prerenderiza con `generateStaticParams`. | Implementado |
| RF-9.2 | Responde 404 si el slug no existe. | Implementado |
| **RF-10** | **Galería de fotos.** | Implementado |
| RF-10.1 | Hasta 5 fotos reales del juego; una es la portada. | Implementado |
| RF-10.2 | Sin flechas si solo hay portada. | Implementado |
| **RF-11** | **Información del juego.** | Implementado |
| RF-11.1 | "Características": género, géneros extra, plataformas y jugadores (1 a 16). | Implementado |
| RF-11.2 | "Acerca del juego" usa `about` o, si falta, `description`. | Implementado |
| RF-11.3 | El enlace a itch.io se activa a las 17:00 del día del evento; antes, la ficha muestra "Disponible en itch.io a las 17:00" sin enlace. Solo aparece si el juego tiene enlace. | Cambia |
| RF-11.4 | Aviso de torneo con el horario del programa. | Implementado |
| **RF-12** | **Dónde jugarlo.** | Implementado |
| RF-12.1 | Muestra el stand con enlace a `/floor-plan#<stand>`. | Implementado |
| RF-12.2 | Si el equipo no tiene stand, muestra "Por asignar". | Implementado |
| **RF-13** | **Contenido complementario.** | Implementado |
| RF-13.1 | Juegos relacionados. | Implementado |
| RF-13.2 | Panel lateral. | Implementado |

### 4.4 Croquis interactivo (`floor-plan`), ruta `/floor-plan`

**Actores:** visitante. Zonas: escenario, arena, premios, comida, información, baños, descanso, entrada y, como pendiente, Marketplace.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-14** | **Navegación por el plano.** | Implementado |
| RF-14.1 | Zoom, arrastre y teclado (`usePlanViewport`, `usePlanGestures`). | Implementado |
| RF-14.2 | Variantes `wide` y `tall`. | Implementado |
| RF-14.3 | Áreas táctiles de al menos 44 px desde 360 px de ancho. | Implementado |
| **RF-15** | **Exploración de stands y zonas.** | Implementado |
| RF-15.1 | Filtros por categoría: equipos, información, actividades y servicios. | Implementado |
| RF-15.2 | Directorio y leyenda. | Implementado |
| RF-15.3 | Tooltip al pasar el cursor o enfocar; en pantallas táctiles, al tocar. | Implementado |
| RF-15.4 | Enlace directo a un stand (`#A1`) con resaltado. | Implementado |
| RF-15.5 | Los equipos sin stand no se dibujan. | Implementado |
| RF-15.6 | Zona Marketplace con título y descripción. | Pendiente |
| RF-15.7 | La zona de premios indica un solo sorteo a las 18:00 (hoy dice 13:00, 16:00 y 19:00). | Cambia |
| **RF-16** | **Afluencia en vivo por stand (`StandTrafficBadge`).** | Implementado |
| RF-16.1 | Cuenta los check-ins de los últimos 15 minutos: bajo (0-4), medio (5-9), alto (10 o más). | Implementado |
| RF-16.2 | Se refresca cada 30 s desde `GET /api/stand-traffic`. | Implementado |

### 4.5 Pasaporte del visitante (`visitors`), rutas `/passport` y `/v/<token>`

**Actores:** visitante; de forma indirecta, el escáner del stand y el administrador.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-17** | **Registro del visitante (sin contraseña).** | Implementado |
| RF-17.1 | Pide nombre completo y gamertag opcional. El correo es opcional y solo sirve como copia de seguridad del QR. | Cambia |
| RF-17.2 | Si falta el gamertag, se deriva del nombre (o del correo, si lo dejó). | Implementado |
| RF-17.3 | El gamertag cumple `^[a-z0-9_.-]{3,24}$` y es único. | Implementado |
| RF-17.4 | Muestra un aviso breve de privacidad con enlace al aviso completo (RF-59). | Pendiente |
| **RF-18** | **Identidad del visitante por token.** | Implementado |
| RF-18.1 | Se crea un token aleatorio; la BD guarda solo su hash. | Implementado |
| RF-18.2 | El token de sesión va en la cookie `utg_visitor`. | Implementado |
| RF-18.3 | Dos tokens separados: identificación (va en el QR) y recuperación (abre el pasaporte). La BD guarda solo el hash de cada uno. | Pendiente |
| **RF-19** | **QR personal.** | Implementado |
| RF-19.1 | Se genera con `qrcode-generator` y contiene solo el token de identificación; no abre el pasaporte. | Cambia |
| RF-19.2 | Si el visitante dejó correo, se le envían el QR y el enlace de recuperación (`sendVisitorQrEmail`). | Cambia |
| **RF-20** | **Recuperación del pasaporte.** | Implementado |
| RF-20.1 | El enlace de recuperación (`/v/<token de recuperación>`) abre el pasaporte en otro navegador. Solo llega por correo o lo entrega administración; nunca va en el QR. | Cambia |
| RF-20.2 | Responde con redirección `303`, `Referrer-Policy: no-referrer` y `no-store`. | Implementado |
| RF-20.3 | Un enlace desconocido manda a una vista de error del pasaporte. | Implementado |
| RF-20.4 | Un solo dispositivo activo: al abrir el enlace en otro dispositivo, el anterior pierde el acceso. | Pendiente |
| RF-20.5 | Sin correo, administración entrega un enlace nuevo después de que el visitante diga su nombre completo y su gamertag. Queda en la bitácora. | Pendiente |
| **RF-21** | **Avance del visitante:** juegos probados contra el total de stands. | Implementado |
| **RF-22** | **Boletos del sorteo por hitos.** | Cambia |
| RF-22.1 | Al visitar la mitad de los stands (redondeando hacia arriba) se crea un boleto automáticamente. El total es el que congela el admin (RF-63). | Pendiente |
| RF-22.2 | Al visitar todos los stands de ese total se crea un segundo boleto. | Pendiente |
| RF-22.3 | Cada hito da su boleto una sola vez por visitante, aunque se reenvíen check-ins. | Pendiente |
| RF-22.4 | Número de boleto autoincremental. | Implementado |
| RF-22.5 | No pide teléfono ni otros datos. | Cambia |
| RF-22.6 | El pasaporte muestra cuántos boletos tiene; si dejó correo, también se le envían. | Pendiente |
| RF-22.7 | Sin stands asignados responde "El sorteo se abre cuando los equipos tengan stand asignado". | Implementado |
| RF-22.8 | Solo cuentan los check-ins hechos antes de las 18:00 (RF-25.6). | Pendiente |
| **RF-23** | **Acceso al pasaporte.** | Implementado |
| RF-23.1 | Enlace "Mi QR" en la navegación. | Implementado |
| RF-23.2 | Acceso directo en la app instalada. | Implementado |

### 4.6 Check-ins del escáner (`visitors/api`), ruta `/api/check-ins`

**Actores:** escáner del stand.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-24** | **Validación de la llave del escáner.** | Implementado |
| RF-24.1 | `GET` valida la llave en `x-scanner-key` y devuelve el juego y su stand. | Implementado |
| RF-24.2 | La llave nunca va en la URL. | Implementado |
| RF-24.3 | Responde `401` si la llave no es válida o el equipo no tiene juego. | Implementado |
| **RF-25** | **Registro de escaneos por lotes.** | Implementado |
| RF-25.1 | `POST` recibe lotes de hasta 200 escaneos (`CHECK_IN_BATCH_LIMIT`). | Implementado |
| RF-25.2 | Idempotente: cada escaneo trae su `id` y hay un único check-in por `(visitor, game)`. | Implementado |
| RF-25.3 | La hora del dispositivo se ajusta (`clampScannedAt`): nunca antes del inicio ni después de la recepción. | Implementado |
| RF-25.4 | Un token mal leído no invalida el lote; se responde `unknown`. | Implementado |
| RF-25.5 | Un `id` o una fecha inválidos devuelven `400`. | Implementado |
| RF-25.6 | Corte a las 18:00: se aceptan los escaneos hechos antes que lleguen antes de las 19:00; los demás se rechazan. | Pendiente |
| RF-25.7 | Tras reemitir un QR, los escaneos con el QR viejo hechos antes de la reemisión se aceptan durante 24 horas. | Pendiente |

### 4.7 Autenticación (`auth`), rutas `/login`, `/confirm-email` y `/register`

**Actores:** administrador, líder de equipo y encargado de torneos.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-26** | **Inicio de sesión.** | Implementado |
| RF-26.1 | Con usuario o correo y contraseña. | Implementado |
| RF-26.2 | Busca en `admin_user`, luego en `team_member` y, como pendiente, en las cuentas de torneos. | Cambia |
| RF-26.3 | Contraseñas con `scrypt` (sal de 16 bytes) y comparación con `timingSafeEqual`. | Implementado |
| RF-26.4 | Un líder con `isConfirmed = false` no puede iniciar sesión. | Implementado |
| **RF-27** | **Sesión de usuario.** | Implementado |
| RF-27.1 | Cookie `httpOnly` `utg_session`, firmada y válida 7 días. | Implementado |
| RF-27.2 | Cada rol va a su panel: admin a `/admin`, equipo a `/team`, encargado de torneos a su panel propio. Respeta `?redirect=`. | Cambia |
| RF-27.3 | Logout borra la cookie. | Implementado |
| **RF-28** | **Activación de cuenta por correo.** | Implementado |
| RF-28.1 | `/confirm-email?token=...` valida el token (hash y expiración). | Implementado |
| RF-28.2 | El líder define su contraseña y la cuenta queda activa. | Implementado |
| **RF-29** | **Alta de equipos.** | Implementado |
| RF-29.1 | El auto-registro existe (`registerTeamAction`), pero `/register` redirige a `/login`. | Implementado |
| RF-29.2 | El alta real la hace el admin. | Implementado |

### 4.8 Portal del equipo (`teams`), ruta `/team`

**Actores:** líder de equipo.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-30** | **Gestión del equipo.** | Implementado |
| RF-30.1 | Muestra el equipo, su stand y sus integrantes. | Implementado |
| RF-30.2 | El líder agrega integrantes (nombre y grupo) y los elimina. | Implementado |
| **RF-31** | **Gestión del juego:** el líder edita la descripción y el enlace de itch.io. | Implementado |
| **RF-32** | **Escáner integrado.** | Implementado |
| RF-32.1 | Usa la cámara con `BarcodeDetector`. | Implementado |
| RF-32.2 | Captura manual como respaldo. | Implementado |
| RF-32.3 | Registra el check-in con `scanVisitorQrAction`, que toma el `teamId` de la sesión. | Implementado |

### 4.9 Panel de administración (`admin`), rutas `/admin/*`

**Actores:** administrador. Secciones: Inicio (`/admin`), Equipos (`/admin/teams`), Juegos (`/admin/games`),
Catálogo (`/admin/catalog`) y Sorteo (`/admin/raffle`).

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-33** | **Resumen del evento** (`getAdminSummary`): equipos, juegos, visitantes y, como pendiente, asistencia (RF-64). | Cambia |
| **RF-34** | **Gestión de equipos.** | Implementado |
| RF-34.1 | CRUD de equipos con stand `^[AB][1-9]$` único. | Implementado |
| RF-34.2 | Alta con líder inicial opcional, sin contraseña, que recibe un correo de activación. | Implementado |
| RF-34.3 | CRUD de integrantes, con un solo líder por equipo. | Implementado |
| **RF-35** | **Llave del escáner.** | Implementado |
| RF-35.1 | Se muestra una sola vez. | Implementado |
| RF-35.2 | Se puede rotar; la anterior deja de servir. | Implementado |
| **RF-36** | **Gestión de juegos:** CRUD (uno por equipo) con slug, nombre, descripción (300), acerca de (3000), jugadores, itch.io, géneros y plataformas. | Implementado |
| **RF-37** | **Fotos de los juegos.** | Implementado |
| RF-37.1 | Hasta 5 por juego, con una sola portada. | Implementado |
| RF-37.2 | Cada foto tiene encuadre y `alt`. | Implementado |
| RF-37.3 | Las URL externas solo se aceptan de `IMAGE_REMOTE_HOSTS`. | Implementado |
| RF-37.4 | Un juego sin portada no se publica. | Implementado |
| **RF-38** | **Catálogo de géneros y plataformas.** | Implementado |
| RF-38.1 | CRUD de géneros y plataformas. | Implementado |
| RF-38.2 | Slug y nombre únicos. | Implementado |
| **RF-39** | **Sorteo.** | Cambia |
| RF-39.1 | Un solo sorteo a las 18:00 con varios premios: el admin elige un premio y saca un ganador, premio por premio. | Cambia |
| RF-39.2 | Usa Fisher-Yates con `crypto.randomInt`. | Implementado |
| RF-39.3 | Lista de ganadores y marca de "avisado" (`notifiedAt`). | Implementado |
| RF-39.4 | Una persona gana como máximo un premio; al ganar, sus demás boletos quedan fuera. | Pendiente |
| RF-39.5 | El ganador se anuncia en el main stage y su pasaporte muestra "Ganaste"; recoge el premio con su QR. | Pendiente |
| RF-39.6 | Los boletos de visitantes excluidos (RF-61) no participan. | Pendiente |
| **RF-40** | **Reemisión del QR.** | Implementado |
| RF-40.1 | Reemite el QR de un visitante que lo perdió. | Implementado |
| RF-40.2 | El QR anterior se invalida, salvo para escaneos hechos antes de la reemisión durante 24 horas (RF-25.7). | Cambia |
| RF-40.3 | Entrega un enlace de recuperación nuevo (RF-20.5); queda en la bitácora. | Pendiente |

### 4.10 Sitio sin conexión / PWA (`offline`), rutas `/sw.js` y `/offline`

**Actores:** sistema.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-41** | **Precarga del contenido público.** | Implementado |
| RF-41.1 | En la primera visita precarga la portada, el catálogo, cada juego y el croquis. | Implementado |
| RF-41.2 | Excluye `/admin`, `/passport` y `/v/<token>` de la caché. | Implementado |
| **RF-42** | **Avisos de conexión.** | Implementado |
| RF-42.1 | Aviso "Sin conexión" (`useIsOffline`). | Implementado |
| RF-42.2 | Página `/offline` como respaldo. | Implementado |
| RF-42.3 | Aviso "Hay una versión nueva" para actualizar el service worker. | Implementado |
| **RF-43** | **App instalable.** | Implementado |
| RF-43.1 | Manifest con iconos de 192 y 512 px, `maskable` y `apple-touch-icon`. | Implementado |
| RF-43.2 | Accesos directos a "Juegos" y "Croquis". | Implementado |

### 4.11 Marco del sitio (`site`)

**Actores:** todos.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-44** | **Navegación global.** | Implementado |
| RF-44.1 | Enlaces de sección (`SECTION_LINKS`) con "Mi QR". | Implementado |
| RF-44.2 | Pie de página. | Implementado |
| **RF-45** | **Páginas de error.** | Implementado |
| RF-45.1 | `not-found`, `error` y `global-error`. | Implementado |
| RF-45.2 | `/errors/[type]` (`404`, `500`). | Implementado |

### 4.12 API pública de juegos, ruta `GET /api/games`

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-46** | **Devuelve el listado de juegos** que usa TanStack Query en el navegador. | Implementado |

### 4.13 Patrocinadores (`sponsors`), ruta `/sponsors` y sección de la portada

**Actores:** visitante anónimo y registrado. Los datos empiezan como mock detrás de `SponsorRepository` (ver `docs/sponsors-plan.md`).

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-47** | **Datos de los patrocinadores.** | Pendiente |
| RF-47.1 | Nombre, logo para fondo oscuro, sitio web, descripción, aporte opcional, redes sociales, orden manual (`position`) y destacado (`featured`). | Pendiente |
| RF-47.2 | Orden por `position` ascendente; un empate se resuelve por nombre. | Pendiente |
| RF-47.3 | `GET /api/sponsors` para TanStack Query, prellenado en el servidor con la etiqueta `sponsors`. | Pendiente |
| **RF-48** | **Página `/sponsors`.** | Pendiente |
| RF-48.1 | Todos en tarjetas: logo, descripción, aporte, sitio y redes. Sin página por patrocinador. | Pendiente |
| RF-48.2 | Sin logo, se muestra el nombre en texto. | Pendiente |
| RF-48.3 | El aporte solo aparece si existe. | Pendiente |
| RF-48.4 | El sitio y las redes abren en pestaña nueva con `rel="noopener noreferrer"` y nombre accesible. | Pendiente |
| RF-48.5 | Metadata con canonical y Open Graph; aparece en `sitemap.ts`; sin JSON-LD. | Pendiente |
| **RF-49** | **Destacados en la portada.** | Pendiente |
| RF-49.1 | Sección `#sponsors` entre la ubicación y el cierre: franja de logos destacados en movimiento continuo y enlace "Ver patrocinadores". | Pendiente |
| RF-49.2 | La franja se pausa al pasar el cursor, al enfocar un logo y con un botón de pausa. | Pendiente |
| RF-49.3 | Con movimiento reducido, la franja se queda quieta. | Pendiente |
| RF-49.4 | Sin destacados, se omite la franja y se conservan el enlace y la invitación. | Pendiente |
| **RF-50** | **Invitación a patrocinar.** | Pendiente |
| RF-50.1 | "¿Quieres patrocinar el evento?" con enlace a un formulario externo, en `/sponsors` y en la portada. | Pendiente |
| RF-50.2 | Sin patrocinadores, la portada y `/sponsors` muestran un estado vacío con la invitación. | Pendiente |
| **RF-51** | **Accesos al módulo.** | Pendiente |
| RF-51.1 | Enlace "Patrocinadores" en la navegación y en el pie. | Pendiente |
| RF-51.2 | El panel del stand informativo C4 enlaza a `/sponsors`. | Pendiente |

### 4.14 Votaciones y People's Choice, ruta `/peoples-choice`

**Actores:** visitante registrado (vota), cualquier visitante (consulta) y administrador (modera).

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-52** | **Votación de un juego.** | Pendiente |
| RF-52.1 | Es opcional: la visita y los boletos no dependen de votar. | Pendiente |
| RF-52.2 | Solo vota un visitante con check-in confirmado en ese juego. | Pendiente |
| RF-52.3 | De 1 a 5 estrellas en diversión, arte y originalidad. Sin comentarios. | Pendiente |
| RF-52.4 | Un voto por visitante y juego, impuesto también en la BD. | Pendiente |
| RF-52.5 | El voto no se puede modificar después de enviarse. | Pendiente |
| RF-52.6 | El voto se asocia al identificador interno del visitante, no al gamertag. | Pendiente |
| RF-52.7 | Sin señal, el voto queda en una cola local y se envía al volver la conexión. | Pendiente |
| RF-52.8 | Se aceptan los votos hechos antes de las 18:00 que lleguen antes de las 19:00. | Pendiente |
| RF-52.9 | El admin puede anular un voto: se marca como anulado con motivo, sin borrarlo, y queda en la bitácora. | Pendiente |
| **RF-53** | **Ranking People's Choice.** | Pendiente |
| RF-53.1 | Se publica en vivo en `/peoples-choice`, en la navegación y en el sitemap. | Pendiente |
| RF-53.2 | Un ranking por categoría y uno general, con promedio bayesiano. | Pendiente |
| RF-53.3 | Un empate lo gana el juego con más votos; si también empatan en votos, comparten el lugar. | Pendiente |
| RF-53.4 | Los votos anulados y los de visitantes excluidos no cuentan. | Pendiente |

### 4.15 Recorrido recomendado

**Actores:** visitante registrado.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-54** | **Siguiente stand recomendado.** | Pendiente |
| RF-54.1 | Se muestra en el pasaporte. | Pendiente |
| RF-54.2 | Elige entre los stands no visitados con afluencia baja (RF-16). | Pendiente |
| RF-54.3 | Prioriza los géneros que el visitante no ha probado. | Pendiente |
| RF-54.4 | No hay botón del staff para atraer o alejar público. | Pendiente |

### 4.16 Torneos, ruta `/tournaments`

**Actores:** encargado de torneos (gestiona) y visitante (consulta).

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-55** | **Rol de encargado de torneos.** | Pendiente |
| RF-55.1 | El admin crea las cuentas de este rol. | Pendiente |
| RF-55.2 | Una cuenta gestiona todos los torneos del evento. | Pendiente |
| RF-55.3 | Cuentas en tabla aparte; inicia sesión en `/login` y va a su panel propio, protegido por `src/proxy.ts`. | Pendiente |
| **RF-56** | **Gestión de torneos.** | Pendiente |
| RF-56.1 | Crea y edita torneos: juego, horario, cupo y estaciones. | Pendiente |
| RF-56.2 | Registro presencial de participantes: con pasaporte (escaneando su QR; el bracket muestra su gamertag) o con nombre libre. | Pendiente |
| **RF-57** | **Brackets.** | Pendiente |
| RF-57.1 | Eliminación simple. | Pendiente |
| RF-57.2 | El bracket se genera a partir de los participantes registrados. | Pendiente |
| RF-57.3 | Asigna las partidas a las estaciones. | Pendiente |
| RF-57.4 | El encargado captura el resultado de cada partida y el ganador avanza. | Pendiente |
| **RF-58** | **Consulta pública** en `/tournaments` (navegación y sitemap): torneos, horarios, brackets y resultados. | Pendiente |

### 4.17 Privacidad y ciclo de vida de los datos

**Actores:** visitante y sistema.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-59** | **Aviso de privacidad.** | Pendiente |
| RF-59.1 | Aviso breve en el registro del pasaporte, con enlace al aviso completo. | Pendiente |
| RF-59.2 | Solo se recopilan nombre completo, gamertag y correo opcional. | Pendiente |
| **RF-60** | **Anonimización.** | Pendiente |
| RF-60.1 | Los datos se conservan después del evento. | Pendiente |
| RF-60.2 | Al cerrar el cuatrimestre se anonimizan el nombre, el correo y el gamertag, y se conservan estadísticas anonimizadas. | Pendiente |

### 4.18 Operación y moderación del evento (`admin`)

**Actores:** administrador.

| ID | Requisito | Estado |
| --- | --- | --- |
| **RF-61** | **Exclusión de visitantes.** | Pendiente |
| RF-61.1 | El admin excluye a un visitante sospechoso con una sola acción. | Pendiente |
| RF-61.2 | La exclusión lo saca de la asistencia, anula todos sus votos y deja sus boletos fuera del sorteo. | Pendiente |
| RF-61.3 | No borra datos: marca al visitante como excluido con motivo y queda en la bitácora. | Pendiente |
| **RF-62** | **Anulación de votos individuales** (RF-52.9). | Pendiente |
| **RF-63** | **Total de stands congelado.** | Pendiente |
| RF-63.1 | El admin fija el total de stands al iniciar el evento. | Pendiente |
| RF-63.2 | Los hitos de boletos usan ese total aunque cambien las asignaciones. | Pendiente |
| **RF-64** | **Asistencia.** | Pendiente |
| RF-64.1 | Cuenta a los visitantes con al menos un check-in, sin contar a los excluidos. | Pendiente |
| RF-64.2 | Se muestra en el resumen de `/admin` y como contador público en la portada. | Pendiente |

---

## 5. Reglas de negocio

| ID | Regla | Requisitos |
| --- | --- | --- |
| RN-01 | La información pública se consulta sin registrarse. El registro solo es necesario para el pasaporte. | RF-17 |
| RN-02 | El gamertag es único, público y no sirve como credencial. | RF-17.3, RF-52.6 |
| RN-03 | El QR del stand solo identifica; solo el enlace de recuperación abre el pasaporte. | RF-18.3, RF-19.1, RF-20.1 |
| RN-04 | Un pasaporte tiene un solo dispositivo activo. | RF-20.4 |
| RN-05 | Un visitante tiene como máximo un check-in por juego; las visitas repetidas no suman. | RF-25.2 |
| RN-06 | Los check-ins y los votos se aceptan si se hicieron antes de las 18:00 y llegan antes de las 19:00. | RF-25.6, RF-52.8 |
| RN-07 | Los boletos se otorgan al visitar la mitad (redondeando hacia arriba) y el total de los stands congelados por el admin; cada hito otorga un boleto una sola vez. | RF-22, RF-63 |
| RN-08 | Hay un solo sorteo, a las 18:00, premio por premio. Una persona gana como máximo un premio. | RF-39 |
| RN-09 | Votar es opcional y solo se permite con check-in confirmado; el voto no se modifica. | RF-52 |
| RN-10 | People's Choice usa promedio bayesiano; el empate se decide por número de votos y, si persiste, se comparte el lugar. | RF-53 |
| RN-11 | El admin no borra ni edita votos o boletos: solo los anula o excluye, con motivo y registro en la bitácora. | RF-52.9, RF-61, RNF-44 |
| RN-12 | La afluencia es baja con menos de 5 check-ins en 15 minutos, media de 5 a 9 y alta con 10 o más. | RF-16 |
| RN-13 | El enlace a itch.io se activa a las 17:00. | RF-11.3 |
| RN-14 | Un juego sin portada no se publica. | RF-6.1, RF-37.4 |
| RN-15 | Los datos personales se anonimizan al cerrar el cuatrimestre. | RF-60 |

---

## 6. Requisitos no funcionales

### 6.1 Seguridad

| ID | Requisito | Estado |
| --- | --- | --- |
| RNF-01 | Control de acceso por rol en `src/proxy.ts` para `/admin/*`, `/team/*` y el panel de torneos. | Cambia |
| RNF-02 | Contraseñas con `scrypt` y comparación en tiempo constante. | Implementado |
| RNF-03 | Cookies de sesión `httpOnly`, firmadas y con expiración. | Implementado |
| RNF-04 | Los tokens secretos (identificación, recuperación, confirmación por correo y llave del escáner) se guardan solo como hash SHA-256 hex, validado con `CHECK`. | Cambia |
| RNF-05 | La llave del escáner viaja en un encabezado, no en la URL. | Implementado |
| RNF-06 | El enlace de recuperación responde con `no-referrer` y `no-store`. | Implementado |
| RNF-07 | Server Actions de admin con `runAdminAction()`; las públicas con `runServerAction()`. | Implementado |
| RNF-08 | Validación en el servidor con mensajes en español y `CHECK` en la BD. | Implementado |
| RNF-09 | Solo se aceptan fotos remotas de `IMAGE_REMOTE_HOSTS`. | Implementado |
| RNF-10 | `/admin` queda fuera de `robots.txt` y del service worker. | Implementado |
| RNF-11 | El pasaporte y el QR no se guardan en la caché del navegador. | Implementado |

### 6.2 Integridad de datos y auditoría

| ID | Requisito | Estado |
| --- | --- | --- |
| RNF-12 | Modelo con `CHECK`, índices únicos y parciales y `onDelete: Cascade`. | Implementado |
| RNF-13 | Check-ins idempotentes (`@@unique([visitorId, gameId])` e `id` generado por el escáner). | Implementado |
| RNF-14 | Hasta dos boletos por visitante, únicos por `(visitor, hito)`. `notifiedAt` exige `wonAt`. | Cambia |
| RNF-15 | Migraciones formales (`migrations/app/`) y seeds idempotentes. | Implementado |
| RNF-43 | Bitácora de auditoría en la BD, sin pantalla: sorteo, reemisiones de QR, enlaces de recuperación entregados, exclusiones, anulaciones de votos, cambios de cuentas y permisos y resultados de torneos. No se modifica desde la aplicación. | Pendiente |
| RNF-44 | Los votos y boletos confirmados no se editan ni se borran; solo se anulan o excluyen de forma auditada. | Pendiente |
| RNF-45 | Los cortes de horario se validan en el servidor con la hora de recepción. | Pendiente |

### 6.3 Rendimiento

| ID | Requisito | Estado |
| --- | --- | --- |
| RNF-16 | Server Components por defecto; Cache Components con `"use cache"`, `cacheLife` y `cacheTag`; invalidación con `updateTag`. | Implementado |
| RNF-17 | Detalles de juego prerenderizados; TanStack Query prellenado sin `Date.now()`. | Implementado |
| RNF-18 | Afluencia cacheada 30 s en el servidor y consultada cada 30 s en el cliente. | Implementado |
| RNF-19 | Nada pesado precargado en móvil. | Implementado |

### 6.4 Disponibilidad y resiliencia

| ID | Requisito | Estado |
| --- | --- | --- |
| RNF-20 | PWA offline-first para el contenido público. | Implementado |
| RNF-21 | El escáner tolera reenvíos y relojes desfasados. | Implementado |
| RNF-22 | La portada no falla con el catálogo vacío. | Implementado |

### 6.5 Usabilidad, accesibilidad y móvil

| ID | Requisito | Estado |
| --- | --- | --- |
| RNF-23 | Móvil primero: sin scroll horizontal a 360 y 390 px, áreas táctiles de 44x44 px, campos de 16 px o más, `svh`/`dvh` y `safe-area-inset`. | Implementado |
| RNF-24 | Nada depende solo de `hover`. | Implementado |
| RNF-25 | Respeta `prefers-reduced-motion`. | Implementado |
| RNF-26 | HeroUI/React Aria con navegación por teclado y HTML semántico. | Implementado |
| RNF-27 | Tema oscuro único UTG con tokens. | Implementado |
| RNF-28 | Interfaz en español; textos centralizados en `lib/<feature>-copy.ts`. | Implementado |

### 6.6 SEO

| ID | Requisito | Estado |
| --- | --- | --- |
| RNF-29 | Metadata por página con canonical y Open Graph. | Implementado |
| RNF-30 | JSON-LD con `Event` y `VideoGame`. | Implementado |
| RNF-31 | `sitemap.ts`, `robots.ts` y `manifest.ts`. | Implementado |

### 6.7 Mantenibilidad

| ID | Requisito | Estado |
| --- | --- | --- |
| RNF-32 | Screaming architecture con capas `lib/`, `lib/server/`, `hooks/`, `components/`, `pages/` y `api/`. | Implementado |
| RNF-33 | ESLint valida fronteras entre capas y features, grafo sin ciclos, sin barriles ni `../`, y reglas SonarQube y TanStack. | Implementado |
| RNF-34 | Prettier 3 con el plugin de Tailwind; Oxlint "anti-slop" fuera del CI. | Implementado |
| RNF-35 | Inyección de dependencias en lugar de `jest.mock`; aserciones de tipo con comentario `SAFETY:`. | Implementado |
| RNF-36 | TypeScript 6 en modo `strict`. | Implementado |
| RNF-37 | Documentación en `docs/`. | Implementado |

### 6.8 Calidad

| ID | Requisito | Estado |
| --- | --- | --- |
| RNF-38 | Pruebas con Jest 30 y Testing Library en `__tests__/`, con fixtures independientes de la BD. | Implementado |
| RNF-39 | El CI corre `lint`, `format:check`, `typecheck`, `test --coverage`, `db:migrate`, `db:seed`, `db:verify` y `build` con PostgreSQL. | Implementado |

### 6.9 Despliegue y portabilidad

| ID | Requisito | Estado |
| --- | --- | --- |
| RNF-40 | Node `>= 22.18` y PostgreSQL `>= 15` (Docker con PostgreSQL 16). | Implementado |
| RNF-41 | `Dockerfile` multi-stage (Next `standalone`) y `docker-compose.yml` con `db`. | Implementado |
| RNF-42 | Correo SMTP con Nodemailer y variables validadas; vista previa en desarrollo. | Implementado |

---

## 7. Modelo lógico de datos

### 7.1 Entidades existentes

| Entidad | Contenido | Cambios decididos |
| --- | --- | --- |
| `AdminUser` | Usuario, correo y contraseña del administrador. | — |
| `Team` | Nombre, stand único y hash de la llave del escáner. | — |
| `TeamMember` | Integrantes; un solo líder por equipo; token de confirmación. | — |
| `Genre`, `Platform` | Catálogo con slug y nombre únicos. | — |
| `Game`, `GameGenre`, `GamePlatform`, `GameImage` | Juego por equipo, géneros, plataformas y hasta 5 fotos. | — |
| `Visitor` | Gamertag único, nombre, correo y hash del token del QR. | Correo opcional, hash del token de recuperación, dispositivo activo, marca de exclusión con motivo y anonimización. |
| `CheckIn` | Visita única por `(visitor, game)` con hora de escaneo. | Validación del corte de las 18:00. |
| `RaffleTicket` | Boleto con número, ganador y aviso. | Varios por visitante, únicos por `(visitor, hito)`; sin teléfono; premio asignado. |

### 7.2 Entidades nuevas (pendientes)

| Entidad | Contenido |
| --- | --- |
| `Vote` | Visitante, juego, calificación por categoría (1 a 5), fecha y estado (válido o anulado con motivo). Único por `(visitor, game)`. |
| `Prize` | Premios del sorteo y el boleto ganador de cada uno. |
| `TournamentAccount` | Cuentas del encargado de torneos. |
| `Tournament`, `TournamentParticipant`, `TournamentMatch` | Torneo, participantes (con visitante o nombre libre), partidas, estación y resultado. |
| `AuditLog` | Bitácora: actor, acción, entidad, fecha y detalle. Solo inserción. |
| `EventSetting` | Total de stands congelado por el admin. |
| `Sponsor` | Patrocinadores (primero como mock en código). |

---

## 8. Casos de uso principales

### CU-01. Registrarse y obtener el pasaporte

1. El visitante abre `/passport` y ve el aviso de privacidad.
2. Escribe su nombre completo y, si quiere, gamertag y correo.
3. El sistema crea el pasaporte, guarda la cookie y muestra el QR.
4. Si dejó correo, recibe el QR y el enlace de recuperación.

### CU-02. Registrar una visita en un stand

1. El visitante juega la demo y muestra su QR.
2. El escáner del stand lee el token de identificación y envía el check-in (o lo guarda si no hay señal).
3. El servidor valida la llave, el token y el corte de horario, y registra un check-in único.
4. El pasaporte actualiza el avance y, al alcanzar un hito, crea un boleto.

### CU-03. Calificar un juego

1. Desde el pasaporte, el visitante elige un juego que ya visitó.
2. Califica diversión, arte y originalidad de 1 a 5.
3. El voto se envía (o queda en cola sin señal) y ya no se puede cambiar.
4. El ranking `/peoples-choice` se actualiza en vivo.

### CU-04. Recuperar el pasaporte

1. Con correo: el visitante abre el enlace de recuperación en el nuevo dispositivo; el anterior pierde el acceso.
2. Sin correo: acude a administración, dice su nombre completo y su gamertag, y recibe un enlace nuevo. Queda en la bitácora.

### CU-05. Hacer el sorteo

1. A las 18:00 se cierran los check-ins y los votos.
2. El admin elige un premio y saca un ganador entre los boletos válidos.
3. Se excluyen los boletos de quien ya ganó y de los visitantes excluidos.
4. El ganador se anuncia en el main stage y su pasaporte muestra "Ganaste".

### CU-06. Gestionar un torneo

1. El encargado de torneos inicia sesión y crea el torneo.
2. Registra a los participantes (con QR o nombre libre).
3. El sistema genera el bracket de eliminación simple y asigna estaciones.
4. El encargado captura los resultados; el bracket se actualiza en `/tournaments`.

### CU-07. Moderar la participación

1. El admin detecta votos o visitantes sospechosos.
2. Anula un voto o excluye al visitante, con motivo.
3. El ranking, la asistencia y el sorteo dejan de contarlos; la acción queda en la bitácora.

---

## 9. Decisiones, riesgos aceptados y temas abiertos

### 9.1 Decisiones principales

| Tema | Decisión |
| --- | --- |
| Gamertag | Único y opcional; si falta, se deriva del nombre. |
| Registro | Nombre completo y gamertag; correo opcional como copia de seguridad del QR. |
| QR y recuperación | Dos tokens; el QR solo identifica. |
| Dispositivos | Uno activo por pasaporte. |
| Check-in | Llave de escáner por equipo o sesión del líder; sin cuentas individuales de staff. |
| Votación | Opcional, por categorías, inmutable, con cola local. |
| People's Choice | En vivo, con promedio bayesiano. |
| Afluencia | Sin cambios: 15 minutos, umbrales 5 y 10, solo por stand. |
| Recorrido | Por afluencia baja y géneros no probados; sin botón del staff. |
| Torneos | Completos en la PWA, eliminación simple, rol y panel propios. |
| Boletos | Dos hitos (mitad y total), automáticos, con total congelado. |
| Sorteo | Uno solo a las 18:00, premio por premio, un premio por persona. |
| Horario | De 12:00 a 19:00; corte a las 18:00. |
| Auditoría | Bitácora en la BD, sin pantalla. |
| Exportaciones | No hay. |
| Privacidad | Aviso en el registro y anonimización al cerrar el cuatrimestre. |
| Fuera del alcance | Tráiler, exportaciones, botón del staff y afluencia por bloque. |

### 9.2 Riesgos aceptados

| Riesgo | Impacto | Decisión |
| --- | --- | --- |
| Recuperación con nombre y gamertag | Quien conozca esos datos de otra persona puede pedir su enlace; por el dispositivo único, el dueño pierde el acceso. | Se acepta; la entrega queda en la bitácora. |
| Votos de visitantes falsos | Un equipo puede registrar visitantes y votarse. | Se mitiga con promedio bayesiano y con anulación o exclusión por el admin. |
| Llave de escáner compartida por equipo | No se sabe qué integrante registró cada check-in. | Se acepta. |

### 9.3 Temas abiertos

- Datos reales del evento por capturar en el código: fecha y horario (ya definidos), sede, textos del croquis e invitados.
- URL del formulario para patrocinar y redes sociales admitidas para los patrocinadores.
- Si `/sponsors`, `/tournaments` y `/peoples-choice` se precargan para uso sin conexión y si aparecen como accesos directos de la app instalada.
- Texto del aviso de privacidad.
- Número de issue y ramas para cada módulo pendiente.
