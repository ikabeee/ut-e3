# Recuperación del pasaporte (M11) y avisos

Estado: implementado en `feature/recovery-notices`, pendiente de revisión. Los avisos (RF-24) quedaron fuera; ver
"Decisiones sobre la SRS".

## Alcance

- Mesa de recuperación en `/support/recovery` para `help_desk` y `sysadmin` (RF-69). Ningún rol de stand, KOF o rifa
  entra: `requireRecoveryAgent()` los manda a su propio inicio, y sin sesión al login.
- `help_desk` entra directo a la mesa (`getHomePath`). El matcher de `src/proxy.ts` cubre `/support` y `/support/:path*`.
- El agente escribe nombre completo y gamertag exactos (sin listado ni búsqueda parcial). El nombre se compara sin
  distinguir mayúsculas ni espacios repetidos; el gamertag ya es insensible a mayúsculas en la BD. Si coinciden, se emite
  un dispositivo nuevo con `createVisitorDevice` (reemplaza al anterior, RF-18 y RF-70) y la pantalla muestra nombre,
  gamertag, fecha de registro y el enlace `/passport/claim/<token>`. Nunca se muestra el PIN, el token guardado ni su hash.
- `/passport/claim/<token>` (feature `visitors`, ruta pública) deja la cookie de dispositivo en el teléfono y lleva al
  pasaporte; un token reemplazado o inventado lleva a `/register`.
- Límites con `consumeAttempt`: 30 recuperaciones por agente cada 10 minutos y 3 por pasaporte cada hora.
- Bitácora (`recordAudit`, en la misma transacción del cambio): `passport_recovered`, `passport_recovery_limited` y
  `passport_recovery_failed` (identidad que no coincide; el mensaje al agente es el mismo exista o no el gamertag).

## Decisiones sobre la SRS

- **RF-24 no son avisos generales.** Es el mensaje "Tu visita a ZA-S3 no se registró" cuando un check-in en cola se
  rechaza, y depende de la cola sin conexión del kiosko (RF-35), que aún no existe. No se creó el modelo `Notice`, ni
  su pantalla en el panel, ni su lectura en el pasaporte: la SRS no los pide. RF-25 sigue fuera (no hay rifa).
- **No existe el rol `pwa_support`.** La SRS asigna la mesa de atención al rol Atención (`help_desk`, ya existente) y al
  sysadmin. No se agregó el rol ni su migración.
- RF-68 y RF-71 (autoservicio por correo) quedan fuera: esta tarea es solo la mesa de atención.
- El enlace de recuperación es el propio token del dispositivo: abrirlo más de una vez en el mismo teléfono funciona
  y se invalida cuando otra recuperación lo reemplaza. No hay una tabla de enlaces de un solo uso.
- QR (rama `feature/recovery-qr`): la pantalla de resultado muestra el enlace también como código QR, dibujado en la página con la
  librería `uqr` (sin dependencias), y un botón "Copiar enlace"; el campo de solo lectura queda como respaldo.

## Pruebas manuales

1. `npm run db:deploy && npm run db:seed && npm run db:seed:stands && npm run db:seed:support`.
2. Entrar como `help-desk@ejemplo.com` (contraseña `support-dev-password`, o `SUPPORT_DEV_PASSWORD`) → `/support/recovery`.
3. Recuperar al visitante de prueba: nombre `Visitante de prueba 10001`, gamertag `Visitante10001`.
4. Abrir el enlace en otra ventana de incógnito: lleva a `/passport` con el PIN 10001.
5. Entrar con `staff-za-s1@ejemplo.com` (contraseña `stand-dev-password`) e ir a `/support/recovery`: redirige a `/stand/kiosk`.

Automatizado: `npm run test:e2e:support`.
