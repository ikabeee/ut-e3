# Administración de stands, cuentas de stand y juegos por stand (M6 y M7)

Estado: implementado en `feature/stand-admin` (desde `develop`), pendiente de revisión.

## Alcance

- **Sysadmin en `/admin`** (RF-39): crea un stand (zona, número, estudio y grupo) y la invitación de su administrador
  en una sola transacción; edita esos datos; reenvía y desactiva al administrador; si el stand se queda sin
  administrador activo, invita a otro. El código completo (`ZA-S1-E6-101`, RF-11) se arma con esos datos y no se teclea.
- **Administrador de stand**:
  - `/stand/game` (RF-31): registra y edita el juego de su stand (nombre, sinopsis, género, enlace a itch.io). El stand
    sale de la sesión (`requireStandAdmin()`), nunca del formulario: no hay campo ni identificador de juego.
  - `/stand/team` (RF-32): invita, reenvía y desactiva las cuentas `stand_staff` de su stand (máximo 3 invitadas o
    activas). El técnico y las dos personas de staff usan el mismo rol `stand_staff`.
  - También abre el kiosko (`/stand/kiosk`), como dice la matriz de roles de la SRS.
- **Staff**: solo el kiosko (RF-33). Si abre `/stand/game` o `/stand/team` vuelve a su kiosko.
- **Bitácora** (`recordAudit`, en la transacción del cambio): `stand.create`, `stand.update`, `account.invite`,
  `account.disable`, `account.resend_invitation`, `game.create` y `game.update`. El detalle no lleva correos ni tokens.
- **Desactivar no borra**: la cuenta pasa a `disabled`, sus sesiones se borran en la misma transacción y el login solo
  acepta cuentas `active`. Las visitas y los votos conservan su `scannedById`.
- **Contraseña inicial**: invitación por correo (outbox, `deliverQueuedEmail`) con un enlace de 72 horas
  (`/activate/<token>`), como en el resto de cuentas. La contraseña nunca se muestra ni se guarda en claro.

## Límites que también hace cumplir la base de datos

Migración `20261102120000_stand_accounts` (triggers, como la mesa de KOF; el esquema de Prisma no cambia):

- un administrador activo (invitado o activo) por stand;
- 3 cuentas `stand_staff` invitadas o activas por stand;
- 18 stands (ya existía `stands_limit_check`).

## Decisiones sobre la SRS

- **Quién crea las cuentas.** El encargo ponía al sysadmin creando las cuentas de staff. RF-32 se las da al
  administrador del stand y RF-39 al sysadmin solo la del administrador. Se siguió la SRS: el sysadmin no crea ni
  desactiva staff (puede ver el estado en la lista del stand, RF-38).
- **Un administrador por stand.** El roster mencionaba 2 `stand_admin` por stand y un técnico sin cuenta. La SRS asume uno
  solo (sección 2 y RF-39) y tres cuentas de staff ("2 staffs y 1 técnico"); se modeló 1 administrador + hasta 3 staff.
- **El administrador no cuenta dentro de las 3.** RF-32 limita las cuentas de staff.
- **Desactivar stands.** La SRS no lo menciona y la tabla no tiene estado: no se implementó. Solo se desactivan cuentas.
- **Reemplazar al administrador.** La SRS no dice cómo. Se resolvió con lo que ya existe: el sysadmin lo desactiva y,
  con el stand sin administrador activo, invita a otro desde la fila del stand.
- **Nombre del stand.** RF-39 pide zona, número, estudio y grupo; el modelo no tiene nombre (el nombre sale del juego).
  No se agregó columna.
- **Imágenes del juego (RF-09).** La SRS lista las imágenes como dato del juego, pero ningún RF dice quién las carga y no
  hay almacenamiento ni subida (RNF-13 pide un volumen y conversión a WebP). El administrador no las edita: un juego
  nuevo recibe la portada genérica `public/games/generic-cover.jpg` para no romper el catálogo, y su texto alternativo
  sigue al nombre mientras la portada sea esa. La carga queda para otra rama.
- **Zonas y números.** Se aceptan los bloques A a D (3 stands cada uno) y T (6), que suman los 18 de RN-01.
- **Sin cambio de código de stand por el administrador** (RF-31): `/stand/game` no tiene campos del stand.

## Pruebas manuales

1. `npm run db:deploy && npm run db:seed && npm run db:seed:stands` (el sysadmin sale de `SYSADMIN_EMAIL` y
   `SYSADMIN_PASSWORD`).
2. Entrar como el sysadmin → `/admin`, sección "Stands". Los 18 stands de muestra ya ocupan todos los lugares (estudio 0
   y grupo 000): edita sus datos reales con "Editar el stand" e invita a su administrador con "Invitar administrador".
   Para probar el alta de un stand nuevo hay que liberar un lugar con SQL (borra el juego y el stand de muestra, como
   hace `e2e/stand-admin.e2e.mjs`), porque los stands no se borran desde la aplicación.
3. Administrador de prueba: `stand-admin@ejemplo.com` (contraseña `stand-dev-password`, o `STAND_DEV_PASSWORD`),
   administrador de ZA-S1. Entra a `/stand/kiosk` y desde ahí a `/stand/game` y `/stand/team`.
4. Staff de prueba: `staff-za-s1@ejemplo.com` (misma contraseña): al abrir `/stand/game` vuelve al kiosko.
5. Los correos de invitación quedan en la tabla `email_outbox` si no hay SMTP real; el enlace `/activate/<token>` está
   en el texto.

Automatizado: `npm run test:e2e:stand-admin` (además de `test:e2e:kiosk` y `test:e2e:support`).
