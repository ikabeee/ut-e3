# Roles dobles del staff y cuatro mesas de KOF

Estado: en implementación en `feature/staff-dual-roles` (el usuario pidió "listo arranca").
Un líder de stand con otro rol del evento usa una sola cuenta con los dos roles, y el KOF admite un staff por tablero.

## Specs

- **S1. Juntar los dos roles.** Pedido: "los admistradores de staff hay que juntar esos dos roles que chocan para que
  puedan hacer las dos funciones". Diseño elegido: "Rol secundario en la misma cuenta (recomendado)". La cuenta sigue
  siendo `stand_admin` (con su stand) y recibe un segundo rol: `help_desk`, `kof_admin`, `raffle_admin` o `sysadmin`.
  Es un solo correo y un solo login, y hay enlaces para pasar de un área a la otra.
- **S2. Sysadmin como rol secundario.** Respuesta: "Sí, sysadmin también puede ser rol secundario". El rol secundario
  `sysadmin` cuenta para la regla de "al menos un sysadmin activo".
- **S3. Staff de KOF por tablero.** Pedido: "en el torneo de kof navarrete es admin, los demas los dejas como staff
  excepto el admin que choca" y "El excel es la fuente de la verdad asi que deberiamos permitir esa cantidad de staff de
  kof". Diseño elegido: "A. 4 mesas, una por tablero". Cada staff captura su tablero. Las semifinales y la final las
  captura el `kof_admin` (Navarrete).
- **S4. Página del rol en el evento.** Pedido: "necesito una pagina para explicarles a los usuarios su rol en el
  evento".
- **S5. Alta de los usuarios e invitación al desplegar.** Pedido: "agregar a los usaurios que definimos en el artifact
  y que en cuanto despliegue se envie la invitacion al portal". La fuente es la lista de `out/pending-users.html`: las
  cuentas en "Listo" y en "Resuelto (ODD)". "Solo se envia una vez, el sysadmin debe poder reenviar esos correos".
  Los 18 stands "Aun no existen, hay que meterlos". Medina se omite: "su admin debe poder invitarlo" (el admin del
  101-5 lo invita desde `/stand/team`). La lista va en el VPS de Coolify: "ya estas conectado por mcp asi que hazlo
  tu". El despliegue es "hoy cuando acabes de implementar", con SMTP configurado en producción.
- **S6. Página de a quién acudir.** Pedido: "coloca una pagina para los usuarios para explicarles con quien acudir en
  caso de haber problemas debe ser conciso sin demasiado texto y con graficos ilustrativos para que el usuario no le de
  pereza leerlo".
- **S7. Ícono del bracket centrado.** Pedido: "este icono no esta centrado en kof" (captura: el reloj de arena sobre
  "El bracket estará disponible en la pantalla del torneo." queda alineado a la izquierda).
- **S8. Footer.** Pedido: "En el footer coloca el correo de contacto de info (en el mapa de sitio) y ademas centra el
  desarrollador y disenado por algorix insgiths".
- **S9. Reenvío de los avisos fallidos.** Pedido: "el reenvio de estos avisos". Son 6 correos en estado Fallido de
  `/admin/emails`, todos "Tipo: Sin tipo (anterior a este registro)", con "Intentos: 5" y "No se puede rehacer: se
  puso en cola antes de que se guardara su tipo." El último error de todos es: "Server terminates connection.
  response=421-4.7.0 Try again later, closing connection. (EHLO) ... - gsmtp". Asuntos (los destinatarios se omiten
  aquí porque son datos de visitantes; están en `email_outbox`):
  - "Tu pasaporte UT Game Showcase - ChirisGuererro" (en cola 18.11.2026 17:08)
  - "Tu pasaporte UT Game Showcase - Hypnos88" (16:59)
  - "Tu pasaporte UT Game Showcase - BlackTower" (16:58)
  - "Recupera tu pasaporte" (14:46)
  - "Tu pasaporte UT Game Showcase - aleeamez" (13:41)
  - "Tu pasaporte UT Game Showcase - Adrian0_0ae" (12:24)
- **S10. Panel de admin con sidebar.** Pedido: "el layout del panel de admin debe ser con sidebar (igual con
  iconos)".
- **S11. SEO.** Pedido: "Tambien agrega al gdd el arreglo del SEO, el opengraph, metadat api y el image resposnes".

## Tasks

| ID | Specs | Qué | Ruta | Riesgo | Commit |
|---|---|---|---|---|---|
| T1 | S1, S2 | Migración: columna `secondary_role` en `accounts`. Un CHECK que la permita solo con `role = 'stand_admin'` y con los valores `help_desk`, `kof_admin`, `raffle_admin` y `sysadmin`. Los triggers `accounts_keep_one_active_sysadmin_*` cuentan también el `secondary_role = 'sysadmin'`. Agregar el campo al schema de Prisma. | Escritor A | item 1 (migración), item 2 (permisos) | hecho (d5963ea) |
| T2 | S1, S2 | Sesión con `roles` (principal + secundario). Las guardas de `current-account.ts` revisan si el rol está entre los de la cuenta. Cada área usa su rol efectivo: KOF (`requireKofAccount`, sin mesa), rifa, recuperación y panel del sysadmin, además de `csv-download.ts`. `getHomePath` usa el rol principal. Pruebas de la matriz. | Escritor A | item 2 | hecho (d5963ea) |
| T3 | S1 | Navegación entre áreas: enlace al área del rol secundario en los encabezados del kiosko, `/stand/team`, `/stand/game`, `/support/recovery`, `/admin/kof`, `/admin/raffle` y `/admin`. | Escritor A | ninguno | hecho (d5963ea) |
| T4 | S1, S2 | Dar y quitar el rol secundario desde `/admin/accounts` (solo el sysadmin), con entrada en la bitácora (`account.secondary_role`). Docs: tabla de cuentas de `AGENTS.md`, `docs/deploy.md` (Cuentas) y `CHANGELOG.md`. | Escritor A | item 2 | hecho (d5963ea) |
| T6 | S4 | Página privada `/my-role` (feature `accounts`, protegida por sesión y agregada al `matcher` de `src/proxy.ts`). Muestra solo los roles de la cuenta (uno o dos). Para cada rol explica: qué hace durante el evento, en pasos cortos; a qué pantallas entra, con enlaces; su stand (código y juego), su mesa de KOF (y tablero) o su área; el horario del evento (de `EVENT_SCHEDULE`, sin repetir horas en el copy); y a quién acudir (el staff de stand a su admin; los demás, al sysadmin). Se llega por tres vías: un enlace en el correo de invitación con una línea sobre su rol; la primera vez que entra tras activar la cuenta, va a `/my-role` antes de su pantalla de trabajo (se sabe porque no tiene un `account.login_verified` previo en la bitácora, así que no hace falta columna nueva); y un enlace fijo "Mi rol" en el encabezado de sus pantallas. Solo cubre los roles de la app. Textos en `accounts-copy.ts`. Pruebas por rol y por rol doble. | Inline, después de T2 y T3 | ninguno | hecho (70f866f) |
| T7 | S5 | Script de alta masiva (`npm run db:invite:staff`). Lee la lista de usuarios desde un archivo fuera de git (correo, nombre, rol, rol secundario, stand y mesa de KOF) y crea cada cuenta como invitación con el flujo existente (`invitations.ts`: enlace de 72 horas y correo en `email_outbox`), con su entrada en la bitácora. Es idempotente: si el correo ya existe, no lo toca y lo reporta. Valida toda la lista antes de escribir y omite a quien no tiene correo. Precarga el rol secundario de los 10 líderes y la mesa (1-4) de los 4 `kof_staff` (L14). Antes de las cuentas crea los 18 stands que faltan con `INITIAL_STANDS` de `games-seed.ts`, que ya tiene la zona, el número, el estudio y el grupo de cada uno (ver L13); si el stand ya existe, no lo toca. El CSV nombra el stand por grupo y estudio (101-1), y el script lo busca en `INITIAL_STANDS`. Depende de T1-T5. Pruebas con una lista de ejemplo. | Inline | item 1 (escribe datos), item 2 (cuentas y permisos) | hecho (ba8e8a8) |
| T8 | S5 | Ejecutarlo al desplegar: `docker/entrypoint.sh` corre el script después de `prisma migrate deploy` solo si existe el archivo de la lista. El agente coloca el CSV en el volumen de la app en el VPS por el MCP de Coolify, y después del despliegue revisa en `email_outbox` y en la bitácora que las invitaciones salieron; como es idempotente, un reinicio no reenvía nada. Docs en `docs/deploy.md` (dónde va el archivo, cómo revisar el resultado y cómo reenviar) y `CHANGELOG.md`. | Inline | item 5 (despliegue) | hecho (ba8e8a8) |
| T9 | S5 | Envío único y reenvío del sysadmin. El alta masiva corre una sola vez: al terminar deja una marca en la base (entrada `staff.bulk_invite` en la bitácora) y los arranques siguientes no hacen nada, aunque la lista cambie. Para reenviar, el sysadmin usa lo que ya existe: "Reenviar invitación" en `/admin/accounts` (enlace nuevo de 72 horas) y la bandeja `/admin/emails`. Se revisa que ese reenvío funcione con las cuentas creadas por el script (con rol secundario y mesa 1-4). Pruebas: un segundo arranque no reenvía nada y el reenvío del sysadmin genera un enlace nuevo. | Inline | item 1, item 2 | hecho (ba8e8a8) |
| T10 | S6 | Página pública "¿A quién acudo?" para los visitantes, sin sesión. Es solo troubleshooting del visitante; no lleva roles ni procesos internos del staff. Cada problema va con un ícono o ilustración y una línea de solución, del tipo "perdí o cambié mi teléfono" o "no me llegó el correo del pasaporte": recuperar el pasaporte en el centro de atención o en `/passport/recover`. La lista de problemas sale de lo que la app ya resuelve: el pasaporte y su recuperación, la visita no registrada en un stand (avisar al staff del stand), los boletos de la rifa, la inscripción al KOF (la mesa del torneo) y el uso sin conexión. Primero se diseñan direcciones en `design/help-contacts/` con gentle-design y el usuario elige una. Después se implementa: móvil primero, accesible, textos en el copy de la feature, `Metadata` con `alternates.canonical`, enlaces desde la barra o el footer y desde el pasaporte, y alta en la lista de páginas públicas del service worker para que funcione sin conexión. | gentle-design y luego inline | ninguno | hecho (4d21a46) |
| T11 | S7 | `ClosedBracket` en `src/features/tournament/components/public-bracket-view.tsx:61`: el contenedor usa `justify-items-start`; centrar el ícono (y el texto con él, para que no queden desalineados). Prueba visual a 360 y 1440 px. | Inline | ninguno | hecho (419a0a0) |
| T12 | S8 | `SiteFooter` (`src/features/landing/components/site-footer.tsx`): agregar el correo de contacto como enlace `mailto:` en el mapa del sitio, `info@algorixinsights.com` (L18), con el dato en un solo dueño (`siteConfig`) y el texto en `landing-copy.ts`; centrar la línea "Desarrollado y diseñado por Algorix Insights". Prueba del componente y línea en `CHANGELOG.md`. | Inline | ninguno | hecho (419a0a0) |
| T13 | S9 | Causa del fallo: Gmail responde `421-4.7.0 Try again later` en el EHLO, que es un límite temporal de Gmail (demasiadas conexiones o mensajes seguidos desde la misma cuenta o IP). Revisar en `createSmtpSender()` y en el trabajador de correo: reutilizar una sola conexión (pool), limitar el ritmo de envío, tratar el 421 como temporal con una espera más larga en lugar de gastar los 5 intentos en minutos, y revisar el nombre que se anuncia en el EHLO. Es requisito de T7, que manda unas 70 invitaciones de golpe y las haría fallar igual. Pruebas del reintento. | Inline (con diagnóstico primero) | item 5 (entrega en producción) | hecho (c80acb0) |
| T14 | S9 | Reenviar los 6 correos sin tipo. Una migración de datos o un script de una sola vez les asigna `kind` y `reference_id` a las filas viejas de `email_outbox`: el asunto "Tu pasaporte UT Game Showcase - <gamertag>" es el correo del pasaporte y "Recupera tu pasaporte" es el de recuperación, y el visitante se encuentra por el destinatario. Solo toca filas sin tipo, deja las que no se puedan identificar y queda en la bitácora. Después el sysadmin usa "Rehacer" en `/admin/emails`, que genera un enlace o PIN nuevo (los viejos ya pudieron vencer). Se corre después de T13. | Inline | item 1 (escribe datos guardados) | hecho (c80acb0) |
| T15 | S10 | Layout del panel `/admin` con sidebar e íconos: `admin-section-shell.tsx` y `admin/components/admin-nav.tsx` pasan a una barra lateral con ícono y texto por sección. En móvil se pliega en un menú (sin scroll horizontal a 360 px, áreas táctiles de 44 px, sin depender de hover). Aplica también a `/admin/kof` y `/admin/raffle` cuando entra el sysadmin. Se revisa a 360, 390 y 1440 px. | Inline (si hay dudas visuales, una propuesta con gentle-design primero) | ninguno | hecho (3e631dc) |
| T16 | S11 | Arreglo del SEO. Primero una auditoría de todas las rutas públicas: `Metadata` o `generateMetadata` con título, descripción y `alternates.canonical`; Open Graph y Twitter con `buildOpenGraph()`; `robots` y `noindex` en las rutas privadas (`/admin`, `/stand`, `/support`, `/login`, `/passport`); `sitemap` y `robots` de la Metadata API. Después las imágenes de Open Graph con `ImageResponse` (`opengraph-image.tsx` de `next/og`) para la portada y las fichas de juego. Se corrige lo que falle. Las guías de Next 16 en `node_modules/next/dist/docs/` se leen antes. | Inline o writer, después de la auditoría | item 3 si cambian URLs canónicas | hecho (d42a5fe) |
| T5 | S3 | Cuatro mesas de KOF: migración del CHECK `kof_desk` de 1-2 a 1-4. `getMatchDesk`: `board_n` va a la mesa n y las semifinales y la final no tienen mesa (solo `kof_admin`). Selector de mesa 1-4 al invitar. Pruebas y actualización de `docs/tournament.md` y `CHANGELOG.md`. | Escritor B (independiente de T1-T4) | item 1 (migración), item 3 (contrato de mesas) | hecho (7d20ab5) |

Commits separados: T1+T2 (riesgo, para revisión aparte), T3+T4, T5, T6, T7 y T8. Orden: T7 va después de T1-T5
porque usa el rol secundario y las 4 mesas. Rama `feature/<issue>-staff-dual-roles` desde
`develop`. Sin push ni PR.

## Log

- **L1** (pedido original, verbatim): "los admistradores de staff hay que juntar esos dos roles que chocan para que
  puedan hacer las dos funciones"
- **L2** (decisiones del usuario, verbatim):
  - Diseño: "Rol secundario en la misma cuenta (recomendado)"
  - Sysadmin: "Sí, sysadmin también puede ser rol secundario"
  - Staff de KOF: "A. 4 mesas, una por tablero"
  - Implementación: "Todavía no, solo planificá"
- **L3** (contexto previo, verbatim): "en el torneo de kof navarrete es admin, los demas los dejas como staff excepto el
  admin que choca"; "El excel es la fuente de la verdad asi que deberiamos permitir esa cantidad de staff de kof";
  sobre Pedraza: "Ese dejalo pendiente, dejalo ahi que choca por ahora".
- **L4** (evidencia, mapa del explorador):
  - Rol y email único: `prisma/schema.prisma:43-77`.
  - CHECKs: `prisma/migrations/20261028160000_kof_desk/migration.sql:18-33` (el de stand en :22 ata `stand_id` al rol
    principal).
  - Triggers de rol: `20261028220000_account_invitations`, `20261102120000_stand_accounts` y
    `20261120120000_accounts_admin`.
  - Guardas: `src/features/accounts/lib/server/current-account.ts`, con unas 85 llamadas.
  - `getHomePath`: `accounts-links.ts:28-36`.
  - Mesa de cada combate: `src/features/tournament/lib/tournament-rules.ts:64`.
  - El proxy solo revisa la cookie, así que el acceso lo deciden las guardas.
- **L6** (decisión del usuario, verbatim): "pedraz igual toma doble rol". Pedraza Keb Diego Román queda como
  `stand_admin` (103-1) + `kof_admin` secundario. Reemplaza la nota de L3 sobre dejarlo pendiente.
- **L7** (decisiones del usuario, verbatim): "en el stand 101-5 si es .com, en el stand 101-6 se queda gibran como
  staff, Jimena y ahui entran como raffle admin, el correo de abarhamg418@gmail.com esta correcto". Gibran (sysadmin)
  queda como `stand_staff` del 101-6 con `sysadmin` como rol secundario, así que S1 y T1 se amplían a `stand_staff`.
- **L8** (corrección del usuario, verbatim): "gibran solo sera staff". Gibran queda solo como `stand_staff` del 101-6
  y deja de ser sysadmin. Se revierte la ampliación de L7: el rol secundario vuelve a ser solo para `stand_admin`.
- **L5** (para confirmar al empezar a implementar):
  - T7 y T8 (S5):
    - La ruta exacta del volumen en Coolify. Propuesta: `/data/staff-invitations.csv`, fuera de git porque son correos
      de alumnos. Se confirma con el MCP al desplegar.
    - Córdova no tiene correo y queda fuera del alta. Como es admin del 103-3, ese stand se crea sin admin hasta tener
      su correo, y después el sysadmin lo invita desde `/admin`.
- **L10** (pedido del usuario, verbatim): "Ademas de agregar a los usaurios que definimos en el artifact y que en cuanto
  despliegue se envie la invitacion al portal, agregalo al odd". Se agregaron S5, T7 y T8.
- **L11** (decisión del usuario, verbatim): "Solo se envia una vez, el sysadmin debe poder reenviar esos correos". Se
  agregó T9: el script corre una sola vez y el sysadmin reenvía con las herramientas que ya existen.
- **L12** (respuestas del usuario, verbatim):
  - Dónde va la lista: "En el vps (coolify), ya estas conectado por mcp asi que hazlo tu".
  - Stands: "Aun no existen, hay que meterlos".
  - Despliegue: "hoy cuando acabes de implementar".
  - SMTP: "si".
  - Medina: "si, se omite su admin debe poder invitarlo".

  Con esto se ajustaron S5, T7 y T8. El despliegue y la escritura en el VPS siguen siendo acciones que se confirman en
  el momento.
- **L23** (decisión del usuario, verbatim): "es miguel el admin de stand". Córdova Sánchez Miguel Ángel es el
  `stand_admin` del 103-3, sin rol secundario (no opera la rifa: "solo dará premios"). Falta su correo: sin él, el
  alta masiva lo omite y el sysadmin lo invita desde `/admin` cuando lo tenga.
- **L22** (decisión del usuario, verbatim): "Mete a kristal y coronel como sysadmins". Palma Góngora Wendy Kristal
  (101-3) y Coronel Palma Christian (101-2) quedan como `stand_admin` con `sysadmin` como rol secundario. El CSV pasa a
  tener 11 roles dobles y 6 sysadmins en total.
- **L21** (evidencia de implementación):
  - Verificación independiente (gentle-ai-verify) de T1, T2, T4, T5, T7-T9, T13 y T14: PASS en los 5 puntos.
    - Las migraciones conservan los datos y el esquema salvo los cambios buscados.
    - No hay escalada de privilegios.
    - Cada mesa captura solo su tablero.
    - Un CSV inválido no escribe nada y el alta corre una sola vez.
    - El 421 detiene la pasada.
  - Sin verificar: la ejecución dentro de la imagen Docker real y la entrega real por Gmail.
  - CSV del alta: `out/staff-invitations.csv` (ignorado por git). Tiene 80 filas, sin Córdova, Kevin ni Medina.
    Probado en una base nueva: 80 invitaciones en cola y 18 stands creados.
  - T10 se implementó con una sola dirección de diseño, sin ronda de gentle-design, porque el usuario delegó todo
    ("te encargarás de todo").
- **L20** (feedback del equipo sobre la lista de usuarios, verbatim): "por que verga miguel es adnimador" / "No lo
  agregues" / "Miguel solo dará premios" / "No necesita usar la PWA" / "Kevin no, ahui y dalia si" / "Y eso de nadie
  registrado como líder...".
  - Córdova Sánchez Miguel Ángel no lleva cuenta. El stand 103-3 queda sin `stand_admin` hasta saber quién lo
    administra, y la rifa queda con López Alvarado Gustavo, Morales Ríos Ahuizotl y Chim Uc Dalia Jimena.
  - Chuc Góngora Kevin Alejandro no lleva cuenta.
  - El CSV de T7 los excluye. Ahora son 9 líderes con rol doble.
- **L19** (pedido del usuario, verbatim): "Tambien agrega al gdd el arreglo del SEO, el opengraph, metadat api y el
  image resposnes". Se interpreta "gdd" como este documento ODD e "image resposnes" como `ImageResponse` de
  `next/og`. Se agregaron S11 y T16.
- **L18** (respuestas del usuario, verbatim):
  - Correo del footer: "si", es decir, `info@algorixinsights.com`.
  - Página de a quién acudir: "esa pagina es para los visitantes (SOLO INFORMACION NECESARIA PARA LOS VISITANTES
    TROUBLESHOTTING)".

  T10 pasa a ser pública y solo para visitantes, y T12 lleva ese correo. Ya no queda nada por confirmar en T10 ni en
  T12.
- **L17** (pedido del usuario, verbatim, con los destinatarios omitidos): "agrega al odd lo siguiente", seguido de los
  6 avisos de S9, cada uno con "Tipo: Sin tipo (anterior a este registro)", "Intentos: 5", el error "421-4.7.0 Try
  again later, closing connection. (EHLO)" y "No se puede rehacer: se puso en cola antes de que se guardara su
  tipo.". Luego: "el reenvio de estos avisos" y "el layout del panel de admin debe ser con sidebar (igual con
  iconos)". Se agregaron S9, S10 y T13 a T15. T13 va antes que T7: sin él, el alta masiva choca con el mismo límite
  de Gmail.
- **L16** (pedido del usuario, verbatim): "Ademas coloca una pagina para los usuarios para explicarles con quien
  acudir en caso de haber problemas debe ser conciso sin demasiado texto y con graficos ilustrativos para que el
  usuario no le de pereza leerlo / este icono no esta centrado en kof / En el footer coloca el correo de contacto de
  info (en el mapa de sitio) y ademas centra el desarrollador y disenado por algorix insgiths". Se agregaron S6 a S8
  y T10 a T12.
  - Las preguntas de T10 y T12 se respondieron en L18.
- **L15** (respuestas del usuario para T6, verbatim):
  - Para quién es: "Cada cuenta ve su rol al iniciar sesión (recomendado)".
  - Qué explica: "Qué hace durante el evento, A qué pantallas entra, Su stand, mesa o área, Horario y a quién
    acudir".
  - Cómo llegan: "Enlace en el correo de invitación, Al activar la cuenta la primera vez, Enlace fijo en el
    encabezado".
  - Áreas sin app: "No, solo los roles de la app".

  Con esto queda cerrado T6.
- **L14** (respuestas del usuario, verbatim):
  - Quién da el rol secundario: "lo da el sysadmin pero ya deben estar precargadas".
  - Si el `kof_admin` secundario invita staff de KOF: "Si, aunque esa informacion ya debe estar precargada".

  T4 da y quita el rol secundario solo desde el sysadmin. El rol secundario de los 10 líderes y los 4 `kof_staff`
  con su mesa vienen precargados en el alta masiva (T7). Un `kof_admin` secundario puede invitar staff de KOF igual
  que uno principal.
- **L13** (respuesta del usuario, verbatim): "ok, perfecto. Esta en el croquis". La zona y el número salen de
  `SEED_GAMES` / `INITIAL_STANDS` (`src/features/games/lib/server/games-seed.ts:60-124`). Los 18 son únicos:

  | Grupo-estudio | Stand | Juego |
  |---|---|---|
  | 101-1 | ZC-S2 | sombra-del-mictlan |
  | 101-2 | ZT-S6 | identity-dissolution |
  | 101-3 | ZT-S5 | carencia |
  | 101-4 | ZB-S2 | one-mind |
  | 101-5 | ZC-S3 | don-t-pet-me |
  | 101-6 | ZA-S1 | make-em-fall |
  | 102-1 | ZT-S2 | after-light |
  | 102-2 | ZD-S1 | turno-rosso |
  | 102-3 | ZT-S4 | saatan-paal |
  | 102-4 | ZT-S3 | dark-mutant |
  | 102-5 | ZA-S2 | true-hero |
  | 102-6 | ZT-S1 | echoscrap |
  | 103-1 | ZD-S3 | astrolabio |
  | 103-2 | ZB-S1 | abby-s-tower |
  | 103-3 | ZB-S3 | vaporlock |
  | 103-4 | ZA-S3 | laboratorio-4 |
  | 103-5 | ZD-S2 | reencarnacion-express |
  | 103-6 | ZC-S1 | unknown-game |

  El seed de juegos también crea estos stands (`games-seed.ts:201`). Si producción ya tiene los juegos, los stands
  podrían existir, aunque el usuario dice que no. Se verifica en la base antes de correr el alta.
- **L9** (pedido del usuario, verbatim): "Ahora agrega al odd que necesito una pagina para explicarles a los usuarios su
  rol en el evento". Se agregó S4 y T6.
