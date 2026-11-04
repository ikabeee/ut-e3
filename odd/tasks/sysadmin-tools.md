---
status: done
---

# Herramientas del sysadmin (M7)

Objetivo: completar el panel del sysadmin de `odd/requirements/srs-v2.md` (M7) con lo que faltaba: valores del evento,
lista negra de correos, alertas de fraude, moderación de visitas y visitantes, géneros, patrocinadores, estado del
servidor y el cierre automático del bracket público. Rama `feature/sysadmin-tools` (desde `develop` en `02d473a`).
Pruebas: Jest (`npm test`) y `npm run test:e2e:sysadmin-tools`.

## Alcance

El panel se divide en secciones con una navegación común (`admin/components/admin-nav.tsx`):

| Ruta | Contenido | Requisitos |
| --- | --- | --- |
| `/admin` | Cuentas, stands y cronograma (ya existía) | RF-38 a RF-40, RF-42 |
| `/admin/settings` | Formulario de la fila única de `event_settings`, con los umbrales de fraude | RF-43, RF-45 |
| `/admin/moderation` | Alertas de fraude, búsqueda por PIN, gamertag o correo, anular visita y excluir visitante | RF-45, RF-46 |
| `/admin/catalog` | Géneros, patrocinadores y lista negra de correos | RF-72, RF-41, RF-44 |
| `/admin/server` | Memoria, CPU, pantallas del bracket público, bandeja de salida con "Reenviar" y "Cerrar al público" | RF-73, RF-74 |

## Specs

- S1 (RF-43): el sysadmin edita los 13 horarios, la URL del Marketplace y los 3 umbrales. Se valida el orden de las
  ventanas (UT-ES-01, UT-ES-04) y que los umbrales sean enteros de 1 a 1000 (UT-AD-16); los `CHECK` de la tabla son la
  segunda barrera. Solo los campos que cambiaron van a la bitácora y se invalida la etiqueta `event-settings` (UT-ES-02).
- S2 (RF-46, UT-AD-03/04/13/14/15): anular un check-in guarda fecha, motivo y quién (`annulled_*`, todo o nada por
  `CHECK`); la visita y su voto se conservan pero dejan de contar en el pasaporte, los boletos y las alertas. Antes de
  la rifa, el boleto de un hito que el visitante ya no alcanza pasa a `voided` en la misma transacción; al volver a
  llegar al hito, el mismo boleto (mismo número) vuelve a `active`. Desde `raffleStartsAt` los boletos no cambian.
- S3 (RF-46, UT-AD-01/02, UT-CI-19, UT-RA-12): excluir a un visitante guarda `excluded_at` y `excluded_reason` (`CHECK`),
  el kiosco rechaza su PIN ("Este pasaporte no puede registrar visitas") y sus boletos quedan fuera de la rifa: antes de
  la rifa pasan a `voided`; después conservan su estado y la rifa filtra con `RAFFLE_ELIGIBLE_TICKET_WHERE`.
- S4 (RF-45, UT-AD-05/06): alertas con los umbrales de `event_settings`. Un stand con `fraudTopScoreCount` visitas con
  las tres calificaciones en 5 dentro de `fraudWindowMinutes` (ventana deslizante), y visitantes con 1 a
  `fraudSingleVisitMax` check-ins. Ignoran visitas anuladas y visitantes excluidos.
- S5 (RF-44): lista negra (`email_blocklist`, sin mayúsculas). Se agregan varios correos a la vez; se marca el que ya
  tiene pasaporte para excluirlo en Moderación. La bitácora guarda el hash del correo, no el correo.
- S6 (RF-72): catálogo de géneros; un género con juegos no se borra (conteo más `ON DELETE RESTRICT`).
- S7 (RF-41): alta, edición y baja de patrocinadores; logo como ruta local de `public/`, sitio https y teléfono E.164.
- S8 (RF-73): estado como texto: memoria (límite del cgroup si existe, si no la máquina), CPU, memoria del proceso,
  pantallas que consultaron `/api/tournament/public` en los últimos 10 s y solicitudes por minuto, y la bandeja de
  salida (enviados, pendientes y fallidos) con "Reenviar".
- S9 (RF-74): `instrumentation.ts` toma una muestra cada 10 s; si la CPU o la memoria pasan del 50% en todas las
  muestras de los últimos 2 minutos, cierra el bracket público (`publicBracketEnabled = false`, bitácora sin actor y
  `reason: "overload:<metrica>"`) y reinicia el historial (UT-AD-07/08/09). El sysadmin también abre y cierra desde
  `/admin/server`.

## Decisiones

- "Calificación de 5" (RF-45) se cuenta por visita con las tres calificaciones en 5; el texto del formulario lo dice.
- Una visita anulada sigue ocupando su stand: el visitante no puede volver a registrar el mismo stand (RF-23).
- "Reenviar" solo funciona con correos que aún tienen cuerpo. El endurecimiento de la bandeja borra el cuerpo al
  abandonar un correo (para no guardar el PIN ni el enlace); esos se marcan "Sin contenido" y la pantalla indica
  reenviar la invitación desde Cuentas o la recuperación desde la mesa de atención.
- El bracket público se consulta por polling, no por SSE: una "conexión" es una pantalla (hash de IP y navegador, solo
  en memoria) que pidió el bracket en los últimos 10 s. La UT-AD-10 (rechazar SSE) no aplica.
- El historial de carga y el público del bracket viven en `globalThis` del proceso de Node; con varias réplicas cada
  una vería lo suyo (el despliegue es de un solo contenedor).

## Tareas

| ID | Specs | Estado | Commit |
| --- | --- | --- | --- |
| T1 | S2, S3 (migración `checkin_annulment_and_visitor_exclusion`, boletos, kiosco, pasaporte) | hecho | ver rama |
| T2 | S4 (alertas) y página de moderación | hecho | ver rama |
| T3 | S1 (event_settings) | hecho | ver rama |
| T4 | S5 (lista negra) | hecho | ver rama |
| T5 | S8 (estado del servidor y "Reenviar") | hecho | ver rama |
| T6 | S6 (géneros) | hecho | ver rama |
| T7 | S7 (patrocinadores) | hecho | ver rama |
| T8 | S9 (cierre automático) | hecho | ver rama |
| T9 | e2e `e2e/sysadmin-tools.e2e.mjs` (E2E-14 y el resto de M7) | hecho | ver rama |

## Pendiente

- La rifa (`feature/raffle`, sin integrar en `develop`) debe girar solo boletos de `RAFFLE_ELIGIBLE_TICKET_WHERE`
  (`visitors/lib/server/milestone-tickets.ts`) para cumplir UT-RA-12 después del inicio de la rifa.
- Quitar la exclusión de un visitante (deshacer) no está en la SRS y no se implementó.
- La subida de logos de patrocinadores: hoy se escribe la ruta de un archivo de `public/`.

## Pruebas manuales

1. `npm run db:deploy && npm run db:seed && npm run db:seed:stands`, y `npm run dev`.
2. Entra como el sysadmin del `.env` y recorre las secciones de la navegación del panel.
3. En Moderación busca el PIN `10001` (8 visitas), anula una visita con motivo y revisa su pasaporte.
