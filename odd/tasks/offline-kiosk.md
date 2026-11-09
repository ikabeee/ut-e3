---
status: done
---

# Kiosko del stand sin conexión (RF-24, RF-35, RF-78, RNF-19)

Objetivo: que el kiosco de `/stand/kiosk` siga tomando visitas sin red, las mande en lotes cuando vuelva, detecte un PIN
mal tecleado sin conocer los PIN y que el pasaporte avise cuando una visita en cola se rechazó. Rama
`feature/offline-kiosk` desde `develop` (`02d473a`). Sigue a `odd/tasks/stand-kiosk.md`, que dejó fuera la cola y el
filtro. Pruebas: Jest (`npm test`) y `npm run test:e2e:offline-kiosk` (E2E-07 y E2E-18).

## Specs

- S1 (RF-35): "El kiosco funciona sin conexión: guarda las visitas en una cola local (IndexedDB) y las envía en lotes de
  máximo 50 con backoff exponencial con jitter. Muestra cuántas visitas faltan por enviar y la lista de rechazadas con su
  motivo." Cola en IndexedDB por stand (`ute3-kiosk-queue-<código>`), lotes de 50 en orden de escaneo, backoff de 1 s a
  60 s con *equal jitter*, barra "Sin conexión · N visitas por enviar" / "Enviando…" / "Todo enviado" y lista
  "No registradas" con motivo e instrucción.
- S2 (RN-04, EC-01, EC-02): una visita en cola cuenta si el PIN se tecleó antes del corte y llega antes de la rifa. La
  hora del PIN (`checkins.scanned_at`) se ajusta a la llegada si va adelantada y a la apertura si va atrasada.
- S3 (D4, EC-03): `POST /api/stand/queued-visits` responde por visita (`ok`, `duplicate`, `late`, `unknownVisitor`,
  `standWithoutGame`, `invalid`); el `id` lo genera el kiosco, así que reenviar un lote no duplica nada. El stand y el
  staff salen de la sesión, nunca del cuerpo (RF-33, RF-36).
- S4 (RF-78, RNF-19): `GET /api/stand/pin-filter` (solo sesión de stand) entrega PBKDF2-SHA-256 (1,000 rondas, sal del
  evento) de cada PIN reducido a un espacio 50 veces mayor que los PIN registrados; sin PIN en claro ni el resumen
  completo. Se cachea con `"use cache"` y la etiqueta `visitor-pins`, que el registro invalida con `updateTag`. Sin red,
  un PIN que no pasa el filtro muestra "PIN no reconocido, revísalo" y no abre la encuesta.
- S5 (RF-24): un rechazo `late` de un visitante conocido se guarda en `rejected_visits` y el pasaporte muestra "Tu visita
  a ZA-S3 no se registró" con el motivo. Un PIN que no es de nadie no identifica a nadie: solo queda en el kiosco.
- S6 (sal fija): `event_settings.pin_filter_salt`, con el valor de `INITIAL_PIN_FILTER_SALT` del seed (y el mismo default
  en la migración), para que el e2e calcule un falso positivo.

## Tareas

| ID | Specs | Qué | Estado | Commit |
| --- | --- | --- | --- | --- |
| T1 | S2, S5, S6 | Migración `20261104120100_offline_kiosk_queue` (`checkins.scanned_at`, `event_settings.pin_filter_salt` sin redefinir la tabla, `rejected_visits`) y sal en el seed | hecho | ver `git log` |
| T2 | S2, S3 | `lib/visit-timing.ts`, `lib/queued-visit-input.ts`, `lib/server/queued-visit-mutations.ts`, `api/queued-visits-route.ts` | hecho | ver `git log` |
| T3 | S4 | `lib/pin-filter.ts`, `lib/server/pin-filter-queries.ts`, `api/pin-filter-route.ts`, `updateTag` en el registro | hecho | ver `git log` |
| T4 | S1 | `lib/visit-queue.ts`, `lib/visit-queue-store.ts`, hooks `use-visit-queue`, `use-pin-filter`, `use-offline-kiosk`, `KioskQueueStatus` | hecho | ver `git log` |
| T5 | S5 | `RejectedVisitNotices` en el pasaporte | hecho | ver `git log` |
| T6 | todos | Pruebas: UT-CI-01, 04 a 15, 20 a 24, 29 a 34; e2e `e2e/offline-kiosk.e2e.mjs` | hecho | ver `git log` |

## Decisiones

- D1: con red el flujo no cambia (PIN → teléfono o "Calificar en esta pantalla"). La cola se usa cuando
  `navigator.onLine` es falso o cuando la petición al servidor falla; en ese caso la encuesta se contesta en el kiosco.
- D2: con red, un PIN que no es de nadie se rechaza en el acto (como antes). EC-16 (falso positivo que llega al servidor)
  se da con la visita tomada sin conexión.
- D3: el kiosco no muestra el PIN ni el gamertag de una visita rechazada, solo la hora y el motivo.
- D4: la migración agrega `pin_filter_salt` con `ALTER TABLE ... ADD COLUMN`: la redefinición que genera Prisma borraría
  los CHECK de `event_settings`.
- D5: `/stand/kiosk` sigue fuera del service worker; si el navegador recarga sin red, el kiosco no abre (la cola sigue en
  IndexedDB y se envía al volver).
- D6 (revisión): cada PIN de la cola que no es de nadie gasta un intento de la cuenta del kiosco, con el mismo límite de
  la pantalla del PIN (100 cada 5 minutos, `lib/server/kiosk-attempts.ts`). Sin esto, la cola respondía 3,000 PIN cada
  5 minutos y el staff podía separar los PIN reales de los candidatos del filtro (RNF-19). Al acabarse los intentos, el
  lote se responde sin las visitas restantes y el kiosco las reintenta con su backoff.
- D7 (revisión): una visita en cola de un visitante que ya tiene su visita al stand responde `duplicate` aunque llegue
  tarde, para que el pasaporte no diga "no se registró" de una visita que sí cuenta (EC-03).

## Pruebas manuales

1. `npm run db:deploy && npm run db:seed && npm run db:seed:stands`, entrar como `staff-za-s3@ejemplo.com`.
2. DevTools → Network → Offline. Teclear `10002` y contestar la encuesta: la barra dice "Sin conexión · 1 visita por enviar".
3. Volver a Online: "Todo enviado" y la visita en la BD con `scanned_at`.
