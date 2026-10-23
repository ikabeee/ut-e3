# Especificación de Requisitos de Software (SRS) v2

## UT Game Showcase: PWA del evento de videojuegos del edificio E3

| Campo | Valor |
| --- | --- |
| Versión del documento | 2.1 |
| Reemplaza a | `odd/requirements/srs.md` (v1, basada en `archive/develop-v1`) |
| Fuente | Lista de módulos del equipo e iteración de huecos con el equipo (22 y 23 de octubre de 2026) |
| Documentos relacionados | `odd/requirements/unit-test-cases.md`, `odd/requirements/e2e-flows.md`, artifacts de arquitectura y modelo ER |

Los requisitos se numeran de nuevo en esta versión; no coinciden con los de la v1. Lo marcado como
**Supuesto** fue propuesto en la iteración y aceptado por el equipo. Un requisito eliminado conserva su número con la
marca **(eliminado)** para no romper la trazabilidad.

### Cambios de la versión 2.1

- Se eliminó el PIN del visitante: el QR fijo identifica al visitante (riesgo aceptado).
- Infraestructura: Next.js autoalojado en un VPS con SQLite; sin Vercel, Supabase ni WhatsApp.
- Horario del evento, umbrales de alertas y cierre del bracket público configurables en `event_settings`.
- Anular un check-in anula el boleto que dependía de él.
- Géneros en un catálogo gestionado por el sysadmin.

---

## 1. Contexto del evento

| Aspecto | Valor |
| --- | --- |
| Fecha | 20 de noviembre de 2026 |
| Horario | De 12:00 a 19:00 (provisional y configurable) |
| Zona horaria | `America/Cancun` (UTC-5 todo el año, sin horario de verano) |
| Stands | Exactamente 18 |
| Asistencia estimada | Alrededor de 1,000 visitantes |
| Dispositivo principal | Teléfono móvil; conectividad no garantizada en la sede |
| Infraestructura | Next.js autoalojado en un VPS de OVHcloud (VPS-1: 2 vCores, 4 GB, 40 GB NVMe) con SQLite |
| Correo | Cuenta de Google Workspace con dominio propio |

### 1.1 Valores configurables (`event_settings`)

Todos viven en la BD, los edita el sysadmin y cada cambio queda en la bitácora.

| Valor | Inicial |
| --- | --- |
| Apertura y cierre del evento | Día del evento, 12:00 y 19:00 |
| Apertura del registro de visitantes | 13 de noviembre de 2026, 00:00 |
| Apertura de la inscripción previa a KOF | 13 de noviembre de 2026, 00:00 |
| Cierre del formulario del Marketplace | 10 de noviembre de 2026, 23:59 |
| Cierre de la inscripción a KOF y generación del bracket | Día del evento, 13:00 |
| Activación de los enlaces a itch.io | Día del evento, 16:30 |
| Corte de check-ins | Día del evento, 17:00 |
| Inicio de la rifa (y fin de la tolerancia de check-ins) | Día del evento, 18:00 |
| URL del formulario del Marketplace | Por definir |
| Alerta de calificaciones infladas | 12 calificaciones de 5 en 10 minutos en un stand |
| Alerta de visitantes de un solo stand | 1 check-in |
| Bracket público abierto | Sí |

---

## 2. Roles

| Rol | Lo crea | Alcance |
| --- | --- | --- |
| Sysadmin | Seed | Todo el sistema |
| Administrador de stand | Sysadmin | Un stand: datos de su juego, alta de su staff y escaneo |
| Staff de stand (2 staffs y 1 técnico) | Administrador de stand | Solo escanear en su stand |
| Administrador de rifa (animador) | Sysadmin | Tómbola, confirmar o descartar, registrar premios |
| Administrador de KOF | Sysadmin | Bracket completo, congelar y descalificar, alta del staff de KOF |
| Staff de KOF (4, uno por tablero) | Administrador de KOF | Combates de su tablero; los staffs 1 y 2 también capturan semifinales y final |
| Atención | Sysadmin | Recuperar pasaportes en la mesa de atención |
| Visitante | Autorregistro | Pasaporte, QR, inscripción a KOF |
| Público | — | Landing, catálogo, patrocinadores, ganadores, bracket y tómbola en vivo |

- Toda cuenta de staff o administrador es individual, con correo y contraseña.
- Las cuentas se activan con una invitación por correo que expira a las 72 horas y se puede reenviar.
- Cada cuenta solo puede crear los roles que le corresponden según la tabla; el servidor lo valida en cada Server Action.
- Las sesiones del staff se guardan en la BD: desactivar una cuenta o cambiarle el rol cierra sus sesiones al instante.

---

## 3. Requisitos funcionales

### M1. Landing (público)

| ID | Requisito |
| --- | --- |
| RF-01 | Portada del evento con slogan (por definir; vive en el código). |
| RF-02 | Carrusel de patrocinadores en lugar del divider de los grupos. |
| RF-03 | Cronograma de actividades leído de la BD (ver M7). Sin actividades, muestra "Cronograma por anunciar". |
| RF-04 | Catálogo simple de juegos: título e imagen. |
| RF-05 | Tarjetas de actividades: Rifa, Marketplace, torneo de KOF y Mario Kart. Mario Kart y Marketplace son solo informativos. |
| RF-06 | El Marketplace (mercado local) enlaza a un formulario de Google Forms para solicitar vender, abierto en pestaña nueva con `rel="noopener noreferrer"`. Después de su cierre, muestra "Registro de vendedores cerrado". |
| RF-07 | Croquis interactivo como en la V1, con la información de cada stand y las zonas de las actividades. |
| RF-08 | Invitadas especiales: dos ingenieras que darán pláticas (contenido en el código; el horario de cada plática es una actividad del cronograma). |

### M2. Catálogo y detalle de juegos (público)

| ID | Requisito |
| --- | --- |
| RF-09 | Un juego tiene nombre, sinopsis, un género del catálogo, imágenes (máximo 5, una de portada), enlace a itch.io y stand. |
| RF-10 | El enlace a itch.io se muestra a partir de la hora configurada (16:30). Antes, la ficha indica la hora de activación sin enlace. La validación usa la hora del servidor. |
| RF-11 | El visitante ve el código corto del stand (`zA-s3`); los administradores ven el completo (`zA-s3-e5-103`). |

### M3. Registro del visitante

| ID | Requisito |
| --- | --- |
| RF-12 | El visitante se registra con nombre completo, gamertag único y correo electrónico. |
| RF-13 | El registro se abre en la fecha configurada; la Server Action también valida la fecha. |
| RF-14 | Al registrarse se genera su QR de identidad, fijo. La BD guarda solo el hash del token del QR. |
| RF-15 | Un correo que esté en la lista negra (integrantes de equipos, staff y administradores) no puede crear pasaporte. El rechazo usa un mensaje genérico ("No se pudo registrar este correo"). |
| RF-16 | Al registrarse, el visitante recibe por correo una copia de su pasaporte: QR, gamertag y un enlace a `/passport` (no el de recuperación). El pasaporte se activa sin esperar al correo. |
| RF-17 | Aviso de privacidad breve en el registro con enlace al aviso completo. |
| RF-18 | Un pasaporte tiene un solo dispositivo activo. |

### M4. Pasaporte y check-in (visitante)

| ID | Requisito |
| --- | --- |
| RF-19 | El pasaporte muestra el QR y el gamertag. |
| RF-20 | Lista de stands visitados y de los que faltan. |
| RF-21 | Barra de progreso hacia el siguiente boleto. |
| RF-22 | Al llegar a 9 visitas válidas se otorga un boleto y al llegar a 18 otro. Máximo 2 por visitante. Cada boleto es un número global autoincremental. |
| RF-23 | Un check-in por visitante y stand. |
| RF-24 | Si un check-in en cola se rechaza (fuera de horario o QR no reconocido), el pasaporte muestra "Tu visita a zA-s3 no se registró" con el motivo. |
| RF-25 | Si el visitante gana la rifa, el pasaporte muestra "Ganaste" y, cuando se registra, el premio. |

### M5. Votación en el stand

| ID | Requisito |
| --- | --- |
| RF-26 | Al escanear el QR del visitante, el escáner entra en modo encuesta (vista tipo kiosco): calificación del juego de 1 a 5 y del stand de 1 a 5. |
| RF-27 | (eliminado) Confirmación con PIN. El QR fijo identifica al visitante; el riesgo de un QR copiado está aceptado (sección 7). |
| RF-28 | El check-in y el voto se crean juntos en una sola transacción: sin encuesta no hay check-in. |
| RF-29 | El staff nunca ve las calificaciones. Tras enviar, la pantalla muestra "Gracias" y vuelve sola al escáner. |
| RF-30 | Un voto por visitante y stand; no se modifica. |

### M6. Panel del stand (administrador y staff)

| ID | Requisito |
| --- | --- |
| RF-31 | El administrador de stand activa su cuenta por invitación y registra los datos de su juego. No puede cambiar el código del stand. |
| RF-32 | El administrador de stand da de alta, desactiva y reemplaza las 3 cuentas de escaneo de su stand (máximo 3 activas). |
| RF-33 | El staff y el técnico solo escanean, y solo en su stand. |
| RF-34 | Un stand solo puede escanear si ya tiene su juego registrado; si no, muestra "Registra tu juego para empezar a escanear". |
| RF-35 | El escáner funciona sin conexión: guarda los escaneos en una cola local (IndexedDB) y los envía en lotes de máximo 50 con backoff exponencial con jitter. Muestra cuántas visitas faltan por enviar y la lista de rechazadas con su motivo. |
| RF-36 | Cada check-in guarda quién escaneó (`scannedById`). |

### M7. Panel del sysadmin

| ID | Requisito |
| --- | --- |
| RF-37 | La cuenta del sysadmin se crea con un seed. |
| RF-38 | Ve el estado completo del sistema: stands, cuentas, visitantes, check-ins, votos, boletos, rifa y torneo. |
| RF-39 | Crea el stand (zona, número, estudio y grupo) y la cuenta de su administrador en un solo paso. |
| RF-40 | Registra administradores de rifa, de KOF y de atención: nombre, correo, grupo, estudio y rol. |
| RF-41 | Registra patrocinadores: nombre, logo, sitio web, teléfono de contacto y servicios. |
| RF-42 | Gestiona el cronograma: título, descripción breve, inicio, fin y zona opcional del croquis. |
| RF-43 | Edita los valores de `event_settings` (sección 1.1). |
| RF-44 | Gestiona la lista negra de correos de los integrantes de cada equipo. |
| RF-45 | Recibe alertas de posible fraude con umbrales configurables: un stand con muchas calificaciones de 5 en poco tiempo, o visitantes que solo visitaron un stand. |
| RF-46 | Puede anular un check-in (y su voto) o excluir a un visitante, con motivo; nada se borra. Anular un check-in que deja al visitante debajo de un hito anula ese boleto; si vuelve a llegar al hito, el mismo boleto se reactiva. Con la rifa iniciada, los boletos no cambian. |
| RF-72 | Gestiona el catálogo de géneros. Un género con juegos asignados no se puede borrar. |
| RF-73 | Ve el estado del servidor como texto: memoria, CPU, conexiones al bracket en vivo y bandeja de salida (enviados, pendientes y fallidos, con "Reenviar"). |
| RF-74 | Puede cerrar y reabrir el bracket público ("Cerrar al público"). El sistema lo cierra solo si la CPU o la memoria superan el 50% durante 2 minutos. La operación del torneo conserva el acceso. |

### M8. Patrocinadores (público)

| ID | Requisito |
| --- | --- |
| RF-47 | Página con tarjetas de los patrocinadores: logo, nombre, servicios, sitio web y teléfono. |
| RF-48 | El teléfono es un enlace `tel:` mostrado con formato legible; el sitio abre en pestaña nueva con `rel="noopener noreferrer"`. |

### M9. Rifa (administradores de rifa)

| ID | Requisito |
| --- | --- |
| RF-49 | Tómbola digital en `/raffle/live`, pantalla completa y solo de visualización, proyectada en el escenario principal. Muestra el giro, el número de boleto y el gamertag en tiempo real. |
| RF-50 | Un solo administrador gira a la vez; si otro lo intenta, ve "Otro animador está girando". |
| RF-51 | Al salir un boleto, el administrador ve un modal con "Ganador" o "Descartado". Mientras no decida, no se puede volver a girar. |
| RF-52 | Al salir un boleto se desactivan todos los boletos de ese visitante, gane o no. |
| RF-53 | Si se confirma "Ganador", se envía un correo al visitante con su gamertag, su número de boleto y la hora. Si se descarta, no se envía nada. |
| RF-54 | El número de premios no se conoce de antemano: la rifa termina cuando el administrador la cierra. |
| RF-55 | Panel de ganadores (solo administradores de rifa): al entregar el premio se registra su nombre. |
| RF-56 | Sección pública de ganadores confirmados con gamertag, premio y hora. |

### M10. Torneo de KOF

| ID | Requisito |
| --- | --- |
| RF-57 | 64 jugadores, eliminación directa: 63 combates. Tableros 1 a 4 con un cuarto del bracket cada uno (16 jugadores, 15 combates); semifinales y final en un tablero aparte. |
| RF-58 | Inscripción con pasaporte: previa desde el pasaporte o el día del evento escaneando el QR. Una por visitante; cupo de 64 ("Torneo lleno"). |
| RF-59 | La inscripción se cierra a la hora configurada (13:00) y el bracket se genera una sola vez, con barajeo Fisher-Yates y `crypto.randomInt`; el resultado queda en la bitácora. |
| RF-60 | Con menos de 64 inscritos, los lugares vacíos son byes, repartidos parejo entre los 4 tableros; un bye nunca se enfrenta a otro. |
| RF-61 | Cada staff ve en tiempo real su cuarto del bracket, marca al perdedor y activa el siguiente combate. |
| RF-62 | Permisos de captura: tablero N lo captura el staff N; semifinal 1 el staff 1; semifinal 2 el staff 2; final el staff 1. El administrador de KOF puede capturar cualquier combate. |
| RF-63 | El staff puede marcar "No se presentó" a uno o los dos jugadores, con el mismo efecto que una descalificación. El administrador puede revertirlo mientras el siguiente combate no haya empezado. |
| RF-64 | El administrador de KOF ve el bracket completo en tiempo real y puede congelar un combate para descalificar a uno o a los dos jugadores. |
| RF-65 | Si se descalifica a los dos, el siguiente combate es bye. En una semifinal, el otro finalista es campeón sin jugar; en la final, el torneo queda sin campeón. |
| RF-66 | Estados del combate: `pending` → `ready` → `active` → `finished`; `frozen` solo lo pone el administrador. |
| RF-67 | Consulta pública del bracket y los resultados en tiempo real. Con el bracket público cerrado (RF-74) o el cupo de conexiones lleno, el público ve "El bracket está disponible en la pantalla del torneo". |

### M11. Recuperación del pasaporte

| ID | Requisito |
| --- | --- |
| RF-68 | Autoservicio por correo: el visitante escribe su correo y recibe un enlace de un solo uso que expira en 30 minutos. La respuesta es siempre la misma, exista o no el correo. Máximo 3 solicitudes por correo por hora. |
| RF-69 | Mesa de atención: el agente busca al visitante y confirma su identidad con su nombre completo y su gamertag, y genera un enlace de recuperación nuevo. |
| RF-70 | Al recuperar, el dispositivo anterior pierde el acceso. Toda recuperación queda en la bitácora. |
| RF-71 | El correo de recuperación solo lleva el enlace de un solo uso. |

---

## 4. Reglas de negocio

| ID | Regla |
| --- | --- |
| RN-01 | El evento tiene exactamente 18 stands; los boletos se otorgan a las 9 y a las 18 visitas válidas. |
| RN-02 | Un integrante de un equipo (o cualquier staff o administrador) no puede tener pasaporte. |
| RN-03 | Un check-in cuenta solo con su voto y mientras no esté anulado. |
| RN-04 | Un check-in cuenta si se escaneó antes del corte (17:00) y llega antes del inicio de la rifa (18:00). Un escaneo con hora anterior a la apertura del evento se ajusta a la apertura. Al empezar la rifa, los boletos se congelan. |
| RN-05 | Un visitante con un boleto sorteado queda fuera del resto de la rifa, gane o no. |
| RN-06 | Votos, check-ins y boletos no se editan ni se borran: se anulan o se excluyen con motivo y registro en la bitácora. |
| RN-07 | El código del stand lo asigna el sysadmin y no se repite. |
| RN-08 | Los datos personales se anonimizan al cerrar el cuatrimestre; se conservan estadísticas anónimas. |

---

## 5. Requisitos no funcionales

| ID | Requisito |
| --- | --- |
| RNF-01 | Toda fecha se guarda como instante UTC en ISO 8601 (SQLite no tiene `timestamptz`), se compara en el servidor y se muestra con `Intl.DateTimeFormat` y `timeZone: "America/Cancun"`. |
| RNF-02 | Los horarios, el cronograma, el catálogo y el bracket se leen con `"use cache"` + `cacheTag` y se invalidan con `updateTag` al editarlos. |
| RNF-03 | Correo por `smtp.gmail.com` (Google Workspace, 2,000 mensajes por usuario al día) con una bandeja de salida en la BD: envío inmediato con `after()`, reintentos con un intervalo iniciado en `instrumentation.ts`, backoff exponencial con jitter (máximo 5) y el error `4.7.28` tratado como temporal. |
| RNF-04 | El dominio del correo tiene SPF, DKIM y DMARC configurados. |
| RNF-05 | Operaciones idempotentes: check-in (por el `id` que genera el escáner), giro de la tómbola (por ID de solicitud) y generación del bracket. |
| RNF-06 | Concurrencia: en SQLite las escrituras van en fila, así que las transacciones de la rifa, el cupo de KOF y los boletos se excluyen entre sí; los combates usan optimistic locking (`version`). |
| RNF-07 | Tiempo real con SSE propio servido por Next.js y un bus de eventos en memoria (una sola instancia): heartbeat cada 20 s, `retry` con jitter y tope de unas 1,500 conexiones; la operación del torneo siempre entra. El evento es una señal y el cliente vuelve a pedir el estado cacheado. |
| RNF-08 | Datos en SQLite con Prisma 7 y `@prisma/adapter-better-sqlite3`, en modo WAL y con `busy_timeout`. Los estados se validan con `CHECK` en la migración. Las tablas y columnas se mapean a `snake_case` en plural. |
| RNF-09 | Tokens (invitación, sesión, recuperación, QR, dispositivo) guardados solo como hash SHA-256 y contraseñas con `scrypt`. En Prisma la propiedad se llama `token` y se mapea a una columna `*_sha256` con un comentario `///`; solo `shared/lib/server` escribe y compara esas columnas. |
| RNF-10 | Límite de solicitudes guardado en SQLite: login, registro y recuperación por correo (3 por hora). |
| RNF-11 | Bitácora de auditoría en la BD, solo inserción (triggers que impiden `UPDATE` y `DELETE`): horarios, cronograma, cuentas, stands, rifa, torneo, recuperaciones, anulaciones, exclusiones y cierre del bracket público. |
| RNF-12 | Móvil primero y accesibilidad según `AGENTS.md`. |
| RNF-13 | Imágenes de juegos y logos en un volumen del VPS, convertidas a WebP (ancho máximo de 1200 px) al subirlas y servidas por Caddy con caché `immutable` y nombres con hash. |
| RNF-14 | El contenido público funciona sin conexión gracias a la PWA (precarga del catálogo y del croquis). |
| RNF-15 | Despliegue con Docker Compose (Next.js `standalone` y Caddy con TLS automático). La imagen se construye en GitHub Actions; el VPS no compila. Apagado ordenado de 30 s. |
| RNF-16 | Respaldos: el diario de OVHcloud y `VACUUM INTO` de SQLite cada hora el día del evento, copiado fuera del VPS. |
| RNF-17 | Monitoreo mínimo en el panel del sysadmin (RF-73) y reinicio automático del contenedor; sin chequeo externo. |
| RNF-18 | Desarrollo local con Docker Compose limitado a los recursos del VPS; prueba de carga en el VPS antes del 13 de noviembre. |

---

## 6. Casos límite (edge cases)

| # | Caso | Comportamiento esperado |
| --- | --- | --- |
| EC-01 | El escáner con reloj atrasado registra a las 17:30 un escaneo con hora 16:58 | Se acepta (riesgo aceptado); queda registrado quién escaneó. Un `scannedAt` futuro se ajusta a la hora de recepción y uno anterior a la apertura, a la apertura. |
| EC-02 | Un check-in en cola llega después del inicio de la rifa | Se rechaza y el pasaporte avisa al visitante. |
| EC-03 | El staff escanea dos veces al mismo visitante | El segundo intento devuelve el check-in existente. |
| EC-04 | Un staff registra una visita con la captura del QR de otra persona | Se acepta (riesgo aceptado). El visitante la ve en su pasaporte, la reporta en Atención y el sysadmin la anula. |
| EC-05 | Dos personas se inscriben a la vez en el lugar 64 de KOF | Solo entra una; la otra ve "Torneo lleno". |
| EC-06 | Dos personas generan el bracket a la vez | Solo se genera una vez; la otra ve "El bracket ya se generó". |
| EC-07 | El staff y el administrador de KOF modifican el mismo combate a la vez | Gana el primero; el otro ve "El combate cambió, recarga". |
| EC-08 | Doble toque o reintento de red en "Girar" | Sale un solo boleto. |
| EC-09 | Un visitante se registra y después su correo se agrega a la lista negra | Se excluye su pasaporte con el flujo de moderación. |
| EC-10 | Se pide recuperar con un correo que no existe | Misma respuesta que con uno existente. |
| EC-11 | El sysadmin cambia la hora de la rifa | La tolerancia de los check-ins se mueve con ella. |
| EC-12 | Se agota la cuota diaria de correo | El correo queda en la bandeja de salida y se reintenta. |
| EC-13 | Se anula el check-in que le dio a un visitante su boleto del hito 9 | El boleto se anula; si vuelve a llegar a 9, el mismo boleto se reactiva. |
| EC-14 | La CPU o la memoria superan el 50% durante 2 minutos | Se cierra el bracket público; la operación del torneo sigue conectada. |

---

## 7. Riesgos aceptados

| Riesgo | Mitigación |
| --- | --- |
| Un integrante se registra con un correo que no está en la lista negra | Escaneo presencial, promedio bayesiano, alertas de fraude, anulación y exclusión por el sysadmin. |
| QR fijo copiado: un staff registra una visita y un voto con la captura del QR de otra persona | Un voto por stand, alertas de fraude y anulación de la visita cuando el visitante la reporta. |
| Escáner sin conexión con el reloj atrasado | La mayoría de los escaneos llegan en línea; queda registrado quién escaneó. |
| Recuperación en la mesa de atención con nombre y gamertag de otra persona | Queda en la bitácora con el agente que la hizo. |
| El visitante puede sentirse presionado al votar frente al staff | Vista tipo kiosco y calificaciones ocultas al staff. |
| Un solo servidor: si el VPS se cae, se caen la web y la BD | Reinicio automático y respaldos. |
| Sin chequeo externo: una caída fuera del horario se descubre tarde | Revisión manual del sitio mañana y noche del 13 al 19 de noviembre. |
| `better-sqlite3` bloquea el hilo de Node mientras consulta | Índices en todas las búsquedas calientes y prueba de carga. |

---

## 8. Decisiones descartadas

| Tema | Descartado | Motivo |
| --- | --- | --- |
| Votación | En el teléfono del visitante (con QR inverso del stand) | Dos escaneos, estado pendiente y dependencia de la señal del visitante. |
| PIN del visitante | Confirmación con PIN, prevalidación parcial o PIN dentro del QR | Un PIN de 4 dígitos no se puede validar sin conexión sin exponerlo; el equipo prefirió quitarlo. |
| QR dinámico | Código que cambia cada 60 s | Se aceptó el QR fijo. |
| Mensajería | WhatsApp (WUZAPI, WAHA, Twilio) y SMS (Supabase/Twilio) | Riesgo de baneo, resolución de LID sin confirmar o costo por mensaje. |
| Correo | Tres cuentas de Gmail personales | Riesgo de bloqueo por Google y entrega en spam. |
| Hosting | Vercel Hobby | Cuota de requests, cron una vez al día y uso no comercial. |
| Datos | Supabase (BD, Storage y Realtime) y PostgreSQL en el VPS | SQLite basta para una instancia en un servidor; Realtime gratis limita a unos 80 espectadores. |
| ORM | Prisma 8 | Release candidate y SQLite solo como prueba de concepto. |
| Tiempo real | Polling y respaldo con polling | El equipo eligió solo eventos (SSE). |
| Boletos | Umbral calculado sobre un total congelado | El evento siempre tiene 18 stands. |
| Monitoreo | Chequeo externo de disponibilidad | El equipo aceptó el monitoreo mínimo. |

---

## 9. Temas abiertos

- Slogan del evento.
- URL del formulario del Marketplace.
- Contenido de las invitadas (fotos, nombres y cargos) y texto del aviso de privacidad.
- Horario definitivo del evento (de 12:00 a 19:00 por ahora).
