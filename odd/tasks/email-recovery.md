# Recuperación del pasaporte por correo (M11: RF-68 y RF-71)

Estado: implementado en `feature/email-recovery`, pendiente de revisión.

## Alcance

- Página pública `/passport/recover` ("Recuperar mi pasaporte"): el visitante escribe su correo y recibe un enlace de un
  solo uso que vence a los 30 minutos (RF-68). `/passport` sin pasaporte manda a `/register`, y `/register` enlaza a esta
  página ("¿Ya tienes pasaporte en otro teléfono? Recupéralo por correo").
- La respuesta es siempre la misma ("Si el correo está registrado, te enviamos un enlace...") exista o no el correo, y
  también al pasar el límite. La Server Action solo valida el formato del correo; el límite, la búsqueda, el token y el
  correo corren en `after()`, después de responder, así que el tiempo de respuesta tampoco depende del correo.
- Límite: 3 solicitudes por correo por hora con `consumeAttempt` (`recovery-email:<correo>`), contadas exista o no.
- El correo (RF-71) solo lleva el enlace `/passport/claim/<token>`: sin PIN, gamertag ni nombre.
- Tabla nueva `recovery_tokens` (modelo `RecoveryToken` del ER): guarda el SHA-256 del token, el canal, el agente
  opcional, `expiresAt` y `usedAt`. La migración `*_email_recovery_tokens` agrega los CHECK del ER: `channel IN ('email',
  'help_desk')` y `issuedById` obligatorio si el canal es `help_desk`.
- `/passport/claim/<token>` (el mismo flujo de la mesa de atención) reconoce los dos enlaces: el token de dispositivo de
  la mesa sigue igual; un token de correo vigente lleva a `/passport/recover/confirm#<token>` sin gastarse, y el visitante
  lo gasta al tocar "Abrir mi pasaporte". Ese paso usa el token una sola vez (`updateMany` condicionado a `usedAt` nulo y
  sin vencer), emite un dispositivo nuevo con `createVisitorDevice` (el anterior pierde el acceso, RF-70) y registra
  `passport_recovered` con `detail.channel = "email"` y `actorId` nulo en la misma transacción. La solicitud que sí emite
  un enlace queda como `passport_recovery_requested`.
- Un enlace vencido, usado, reemplazado o inventado lleva a `/passport/recover/expired` ("Este enlace ya no sirve"), con el
  mismo formulario para pedir otro.

| ID | Pieza | Estado |
| --- | --- | --- |
| T1 | Modelo `RecoveryToken` y migración con CHECKs | hecho |
| T2 | `lib/server/email-recovery.ts`: solicitar, revisar y usar el enlace | hecho |
| T3 | Server Actions `requestRecoveryEmail` (con `after()`) y `claimRecoveryLink` | hecho |
| T4 | `/passport/claim/<token>` reconoce el enlace de correo | hecho |
| T5 | Páginas `/passport/recover`, `/expired` y `/confirm`; enlace desde `/register` | hecho |
| T6 | Pruebas unitarias UT-VI-09 a 12, 14, 15 y 19 | hecho |
| T7 | E2E-03 en `e2e/email-recovery.e2e.mjs` (`npm run test:e2e:email-recovery`) | hecho |

## Decisiones sobre la SRS

- **Confirmar antes de gastar el enlace.** Los filtros de correo (por ejemplo, Safe Links de Outlook) abren los enlaces
  para revisarlos; si el GET gastara el token, el visitante recibiría un enlace ya usado. Por eso el GET solo revisa y el
  uso es un POST (Server Action) tras tocar el botón. El token viaja en el fragmento (`#`), que no llega al servidor ni a
  los registros.
- **La mesa de atención no cambia.** Su enlace sigue siendo el token del dispositivo (ver `recovery-notices.md`); no se
  movió a `recovery_tokens`. La tabla ya acepta el canal `help_desk` con su agente para cuando se haga.
- Un enlace inválido ya no manda a `/register` sino a `/passport/recover/expired`, que explica qué pasó.
- No hay límite por IP: en la sede todos los teléfonos pueden salir por la misma IP del Wi-Fi.
- `recordAudit` acepta `actorId: null` (la recuperación por correo no la hace una cuenta del staff).

## Pruebas manuales

1. `npm run db:deploy && npm run db:seed && npm run db:seed:stands` (abre el registro).
2. Registra un pasaporte en `/register` con un correo. En otra ventana de incógnito abre `/passport`, sigue el enlace
   "Recupéralo por correo" y escribe el mismo correo.
3. Sin `SMTP_HOST`, el correo queda en `email_outbox` (asunto "Recupera tu pasaporte"); abre su enlace en la ventana de
   incógnito y toca "Abrir mi pasaporte". La primera ventana, al recargar, vuelve a `/register`.

Automatizado: `npm run test:e2e:email-recovery` (puerto `E2E_PORT`, 3541 por defecto).
