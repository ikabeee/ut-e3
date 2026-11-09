# Rifa (M9)

La rifa final del evento (SRS v2, RF-49 a RF-56 y RF-25). Vive en la feature `src/features/raffle/`.

## Pantallas

| Ruta | Quién | Qué hace |
| --- | --- | --- |
| `/raffle/live` | Público (se proyecta en el escenario) | Tómbola de solo visualización: anuncia la hora de inicio, gira unos 3 s cuando sale un boleto y luego muestra el número, el gamertag y si está pendiente, ganó o se descartó. A la derecha, los ganadores confirmados. Botón "Pantalla completa". Se actualiza sola cada 2 s (`GET /api/raffle/live`). |
| `/raffle` | Público | Ganadores confirmados con gamertag, premio (o "Premio por entregar") y hora (RF-56). |
| `/admin/raffle` | `raffle_admin` (entra por `/login`) | Estado, "Girar", modal "Ganador" / "Descartado", ganadores con "Registrar premio" y "Cerrar la rifa". Se actualiza cada 2 s (`GET /api/raffle`, 401 sin sesión de rifa). |
| `/passport` | Visitante | "Ganaste" con su número de boleto y, cuando se registra, el premio (RF-25). |

## Reglas

- Nadie gira antes de `event_settings.raffleStartsAt` ni después de `raffleClosedAt` (RF-54). El número de premios no se
  conoce: la rifa termina cuando un animador la cierra, y no se puede cerrar con un boleto sin decidir.
- El sorteo usa `crypto.randomInt` sobre los boletos `active`: cada boleto es una oportunidad, así que un visitante con dos
  boletos tiene dos. El índice que salió y el número de candidatos quedan en la bitácora.
- Al salir un boleto, **todos** los boletos de ese visitante pasan a `drawn`, gane o no (RF-52, RN-05).
- Un solo giro `pending` a la vez: lo impide un índice único parcial de la BD (RF-51). Si otro animador intenta girar,
  ve "Otro animador está girando" (RF-50) y puede tomar la decisión con "Decidir este boleto" si el primero se quedó sin
  equipo.
- Cada "Girar" lleva un `requestId` (`crypto.randomUUID()`): repetir la solicitud devuelve el mismo boleto (RNF-05).
- "Ganador" encola un correo en `email_outbox` con el gamertag, el número de boleto y la hora, y lo envía con `after()`;
  "Descartado" no envía nada (RF-53).
- El premio lo registra cualquier animador, una sola vez, y queda quién lo registró (RF-55).
- Todo cambio (giro, decisión, premio, cierre) va a `audit_logs` en la misma transacción (RNF-11). La migración
  `*_raffle_draws` impide borrar giros y cambiar una decisión o un premio ya escritos.

## Probarlo en local

```bash
npm run db:deploy
npm run db:seed
npm run db:seed:raffle   # solo desarrollo
npm run dev
```

`db:seed:raffle` crea `rifa-1@ejemplo.com` y `rifa-2@ejemplo.com` (contraseña `RAFFLE_DEV_PASSWORD` o el valor de
ejemplo `RAFFLE_DEV_DEFAULT_PASSWORD` del seed), 30 pasaportes (PIN 20001 a 20030, gamertag `Rifa20001`...) con 40
boletos y mueve el inicio de la rifa a la hora actual (y el corte de check-ins un minuto antes). Abre `/raffle/live` en
una ventana y `/admin/raffle` en otra.

La prueba de punta a punta es `npm run test:e2e:raffle` (E2E-09); usa el puerto `E2E_PORT` y `E2E_CHROMIUM_PATH`.

## Pendiente

- Los visitantes excluidos (RF-46, UT-RA-12) todavía no existen en el modelo; cuando existan, el sorteo debe filtrarlos.
- El tiempo real es por polling cada 2 s, como el bracket; el SSE de RNF-07 no está implementado.
