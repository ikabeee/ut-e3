---
status: done
---

# Rifa (M9) y "Ganaste" en el pasaporte

Estado: implementado en `feature/raffle` (desde `develop` en `02d473a`), pendiente de revisión. Sin push.

## Alcance

- Tómbola `/raffle/live`: pantalla completa (botón "Pantalla completa"), solo visualización, polling cada 2 s a
  `GET /api/raffle/live` como el bracket. Gira ~3 s al llegar un boleto nuevo y muestra número, gamertag y estado
  (RF-49). Respeta `prefers-reduced-motion` (sin dígitos rodando).
- Panel `/admin/raffle` para `raffle_admin` (entra por `/login`, `getHomePath`): "Girar" con `requestId` por pulsación
  (RNF-05, EC-08), "Otro animador está girando" (RF-50), modal "Ganador"/"Descartado" que no se puede cerrar y bloquea el
  siguiente giro (RF-51), lista de ganadores con "Registrar premio" (RF-55) y "Cerrar la rifa" (RF-54).
- Sorteo con `crypto.randomInt` en una transacción: boleto `active` al azar, `raffle_draws` en `pending` y todos los
  boletos del visitante a `drawn` (RF-52, RN-05). Índice único parcial sobre `pending` como respaldo de concurrencia.
- "Ganador": correo por `email_outbox` (gamertag, boleto y hora) con `after()`; "Descartado": nada (RF-53).
- Sección pública `/raffle` con gamertag, premio y hora (RF-56); "Ganaste" y el premio en `/passport` (RF-25).
- Bitácora: `raffle_drawn` (con candidatos e índice), `raffle_winner_confirmed`, `raffle_ticket_discarded`,
  `raffle_prize_registered` y `raffle_closed`.
- Seed de desarrollo `npm run db:seed:raffle` y e2e `npm run test:e2e:raffle` (E2E-09).

## Fuera de alcance

- Exclusión de visitantes (RF-46): no existe en el modelo, así que UT-RA-12 queda pendiente.
- SSE (RNF-07): se usa polling como en el bracket público.
- El panel del sysadmin no muestra la rifa (RF-38).

## Decisiones

- D1: `raffle_tickets.status` gana `drawn` (ER) con una migración que redefine la tabla; los números se conservan.
- D2: cualquier `raffle_admin` puede decidir un boleto pendiente de otro ("Decidir este boleto"), para no bloquear la rifa
  si se cae el equipo del que giró. El que giró ve el modal al instante; los demás ven el aviso.
- D3: no se puede cerrar la rifa con un boleto pendiente ni antes de la hora de inicio.
- D4: el premio se registra una sola vez (trigger) y guarda quién lo registró (`prize_by_id`).
- D5: `/raffle` y `/raffle/live` no se guardan en la PWA (datos en vivo).

## Tareas

| ID | Requisitos | Estado | Commit |
| --- | --- | --- | --- |
| T1 | Migración `20261104120200_raffle_draws`, esquema y ER | hecho | `d435872` |
| T2 | Sorteo, decisión, cierre y premio (RF-49 a RF-55) con bitácora y correo | hecho | `d435872` |
| T3 | Guarda `requireRaffleAdmin`, `/login` a `/admin/raffle` | hecho | `d435872` |
| T4 | Tómbola, panel, ganadores públicos y "Ganaste" (RF-25, RF-49, RF-56) | hecho | `d435872` |
| T5 | Seed `db:seed:raffle` | hecho | `d435872` |
| T6 | E2E-09 (`e2e/raffle.e2e.mjs`), corrección del modal que reaparecía y de la tómbola al cerrar | hecho | siguiente commit |
| T7 | Documentación (`docs/raffle.md`, `AGENTS.md`, `CHANGELOG.md`) | hecho | siguiente commit |

## Pruebas manuales

1. `npm run db:deploy && npm run db:seed && npm run db:seed:raffle`.
2. Abre `/raffle/live` en una ventana. Entra como `rifa-1@ejemplo.com` (contraseña de ejemplo del seed) en otra:
   llegas a `/admin/raffle`.
3. "Girar": la tómbola gira y muestra el boleto; el panel abre el modal. Con `rifa-2@ejemplo.com` en una tercera
   ventana se ve "Otro animador está girando".
4. "Ganador" deja el correo en `email_outbox`; el ganador aparece en `/raffle`. Registra el premio desde el otro panel.

## Bitácora

- L1 (2026-11-04): RED/GREEN por capas: tabla y triggers, mutaciones (UT-RA-01 a UT-RA-11), consultas y Route Handlers,
  Server Actions, componentes. 76 pruebas nuevas de la rifa; la suite completa pasa.
- L2 (2026-11-04): el e2e encontró dos fallas que las pruebas unitarias no veían: (a) tras "Descartado" el modal volvía,
  porque el efecto del botón "Girar" se volvía a ejecutar con la respuesta vieja cada vez que el polling cambiaba la
  revisión; ahora cada respuesta se atiende una sola vez (prueba de regresión en `raffle-dashboard.test.tsx`, falla sin
  el arreglo). (b) Con la rifa cerrada la tómbola seguía mostrando el último boleto; ahora dice "La rifa terminó".
- L3 (2026-11-04): Turbopack no resuelve `node_modules` cuando es un enlace simbólico fuera del worktree; para correr el
  e2e se usó una copia con enlaces duros (`cp -al`). No afecta al repositorio.
