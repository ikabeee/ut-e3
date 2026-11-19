Consola completa del sysadmin: correos, visitantes, cuentas, logs, KOF y rifa, y recuperación de servicios.
Cada módulo va en su rama y su PR hacia develop; al terminar cada rama: PR, merge y limpieza de la rama y el worktree.
Riesgo: items 1 (datos) y 2 (permisos, datos personales) en casi todos los módulos; cada uno pasa por una verificación independiente.

## Specs

- S1: "Necesito que en sysadmin pueda controlar el reenvio de correos (en caso que falle el backoff)"
- S2: "y que pueda ver la lista de los registros con la posibilidad de reenviar el codigo de verificacion desde el panel"
- S3: "TODO LO QUE ME PERMITA ADMINISTRAR TODO EL SISTEMA" — alcance elegido (L2): Correos, Visitantes, Cuentas del staff, Logs; además "TODO LO DE LA BD, REINITENTOS, O ALGO QUE ME PERMITA RECUPERAR ALGUN SERVICIO CAIDO".
- S4: "Tambien necesito un lugar dentro del panel del sysadmin donde pueda visualizar los logs" — los logs del servidor se guardan en la base (L2): sobreviven a reinicios, se filtran por fecha y se purgan solos a los 30 días.
- S5: KOF y rifa (L2): "Operar todo": el sysadmin hace lo mismo que el administrador de KOF y el animador de la rifa.
- S6 Correos: lista completa con filtros, ver el texto, reenviar uno o todos los fallidos, rehacer los abandonados.
- S7 Visitantes: lista con búsqueda y páginas, reenviar el correo del pasaporte con su PIN, enviar enlace de recuperación, corregir el correo, quitar la exclusión, exportar CSV.
- S9: "El usuario desde la aplicacion debe poder hacer su registro al torneo de KOF, no puedo hacerlo como invitado sigue pidiendome registrarme via administracion"
- S8 Cuentas del staff: todos los roles: desactivar y reactivar, restablecer contraseña por correo, cerrar sesiones, reenviar invitación, limpiar el 2FA pendiente.

## Tasks

- [ ] T1 S1 S6 — correos `/admin/emails`. logic-worker. rama `feature/sysadmin-emails`
- [ ] T2 S2 S7 — visitantes `/admin/visitors`. logic-worker. rama `feature/sysadmin-visitors`
- [ ] T3 S8 — cuentas `/admin/accounts`. logic-worker. rama `feature/sysadmin-accounts`
- [ ] T4 S4 — logs `/admin/logs` (bitácora y logs del servidor guardados). logic-worker. rama `feature/sysadmin-logs`
- [ ] T5 S5 — sysadmin opera KOF y rifa. logic-worker. rama `feature/sysadmin-kof-raffle`
- [ ] T6 S3 — recuperación de servicios `/admin/recovery`. logic-worker. rama `feature/sysadmin-recovery`
- [ ] T7 S9 — el visitante se inscribe al KOF desde la app. logic-worker. rama `feature/kof-self-entry`

## Log

- L1 (usuario): "Necesito que en sysadmin pueda controlar el reenvio de correos (en caso que falle el backoff) y que pueda ver la lista de los registros con la posibilidad de reenviar el codigo de verificacion desde el panel. TODO LO QUE ME PERMITA ADMINISTRAR TODO EL SISTEMA" / "Tambien necesito un lugar dentro del panel del sysadmin donde pueda visualizar los logs"
- L2 (respuestas): módulos -> Correos, Visitantes, Cuentas del staff, Logs + "TODO LO DE LA BD, REINITENTOS, O ALGO QUE ME PERMITA RECUPERAR ALGUN SERVICIO CAIDO"; KOF y rifa -> "Operar todo"; logs del servidor -> "Guardados en la base".
- L3 (exploración): el outbox borra el texto al abandonar un correo (email-outbox.ts:142-168), así que "Reenviar" no lo recupera. El PIN se puede descifrar (pin-cipher.ts decryptPin). requireKofAccount y requireRaffleAdmin rechazan al sysadmin (current-account.ts:29-40, 89-104). El sysadmin solo invita kof_admin, raffle_admin y help_desk (invitation-rules.ts:10). AuditLog no tiene pantalla.
- L4 (usuario): "El usuario desde la aplicacion debe poder hacer su registro al torneo de KOF, no puedo hacerlo como invitado sigue pidiendome registrarme via administracion"
