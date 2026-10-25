# Casos de uso para pruebas unitarias

Casos por feature en formato Dado / Cuando / Entonces. Cada caso se traduce en un `it(...)` de Jest.

| Campo | Valor |
| --- | --- |
| Fuentes | `odd/requirements/srs-v2.md` (versión 2.2), artifacts de arquitectura y modelo ER (25 de octubre de 2026) |
| Runner | Jest 30 + Testing Library (`next/jest`) |
| Ubicación | `src/features/<feature>/__tests__/` con las mismas subcarpetas que el código (ver `AGENTS.md`) |

## Convenciones

- **Capa:** `lib` (función pura), `server` (`lib/server/` contra una BD SQLite real) o `ui` (componente con Testing Library).
- **Pruebas `server`:** cada archivo crea una BD SQLite temporal en un directorio de `mktemp -d` fuera del repositorio,
  aplica las migraciones y la borra al terminar. No se usa `jest.mock` para la BD: las dependencias (reloj, generador
  aleatorio, envío de correo, bus de eventos) se inyectan, como pide `AGENTS.md`.
- **Reloj inyectado:** toda regla con horario recibe `now` como parámetro. Las horas del ejemplo son de `America/Cancun`
  el 20 de noviembre de 2026, salvo que se indique otra fecha.
- **Req:** ID de `srs-v2.md` (RF, RN, RNF, EC) o la decisión de arquitectura (D1-D7). Los requisitos que cambiaron
  después de la SRS (sin Supabase) se citan por la decisión.
- **Casos eliminados:** conservan su ID con la marca **(eliminado)** y el motivo; los casos nuevos de la v2.2 usan el
  siguiente número libre de su feature.
- **Horarios de KOF:** el check-in (de 11:00 a 12:00), la inscripción presencial (de 12:00 a 12:45) y la generación del
  bracket (13:00) son valores de `event_settings` (sección 1.1 de la SRS); las pruebas los fijan en la BD de prueba y no
  los escriben en el código.

---

## shared (infraestructura sin reglas de negocio)

| ID | Capa | Dado | Cuando | Entonces | Req |
| --- | --- | --- | --- | --- | --- |
| UT-SH-01 | lib | un token aleatorio | se calcula `hashToken(token)` | el resultado es un SHA-256 hex de 64 caracteres, distinto del token y estable para el mismo token | D1b |
| UT-SH-02 | server | un token recién creado para una invitación | se guarda en la BD | la columna `token_sha256` no contiene el token original | D1b |
| UT-SH-03 | lib | una contraseña | se calcula su hash con `scrypt` dos veces | los dos hashes son distintos (sal aleatoria) y ambos verifican la contraseña | D1b |
| UT-SH-04 | lib | un hash de contraseña | se verifica una contraseña incorrecta | devuelve `false` sin lanzar error | D1b |
| UT-SH-05 | lib | el instante `2026-11-20T22:00:00Z` | se formatea para mostrar | devuelve `17:00` en `America/Cancun` | RNF-01 |
| UT-SH-06 | lib | el texto `17:00` del 20 de noviembre capturado por el sysadmin | se convierte a instante | guarda `2026-11-20T22:00:00.000Z` | RNF-01 |
| UT-SH-07 | server | una fila en la bitácora | se intenta `UPDATE` o `DELETE` | la BD aborta la operación (trigger) y la fila no cambia | RNF-11 |
| UT-SH-08 | lib | el intento número n de un envío fallido y un generador aleatorio inyectado | se calcula el siguiente reintento | la espera está entre 0 y `min(máximo, base × 2^n)` (full jitter) | RNF-03 |
| UT-SH-09 | server | un correo `pending` con `nextAttemptAt` vencido | dos procesos lo reclaman a la vez | solo uno lo obtiene (`sending` con `leaseUntil`); el otro no recibe nada | D3 |
| UT-SH-10 | server | un correo en `sending` con `leaseUntil` vencido | corre el procesador | el correo vuelve a estar disponible y se reintenta | D3 |
| UT-SH-11 | server | un envío que falla con el error SMTP `4.7.28` | se procesa el resultado | el correo queda `pending` con un nuevo `nextAttemptAt` (error temporal) | RNF-03 |
| UT-SH-12 | server | un correo con 5 intentos fallidos | falla otra vez | queda `failed` y aparece en la lista de fallidos | D3 |
| UT-SH-13 | server | un correo `failed` | el sysadmin lo reenvía | vuelve a `pending` con `attempts = 0` y queda en la bitácora | D3 |
| UT-SH-14 | lib | un bus de eventos con dos suscriptores | se publica `bracket.changed` | los dos lo reciben; un suscriptor que se dio de baja ya no | D2 |
| UT-SH-15 | lib | 1,500 conexiones públicas abiertas | llega una conexión pública más | se rechaza; una conexión de la operación (admin de KOF, staff, pantalla) sí entra | D2 |
| UT-SH-16 | server | 3 solicitudes de una misma llave dentro de la ventana | llega la cuarta | se rechaza; en la ventana siguiente se acepta | RNF-10 |

## event-settings

| ID | Capa | Dado | Cuando | Entonces | Req |
| --- | --- | --- | --- | --- | --- |
| UT-ES-01 | server | los horarios iniciales | se intenta poner el corte de check-ins (`checkInCutoffAt`) después del inicio de la rifa | se rechaza con un mensaje en español y la fila no cambia | RN-04 |
| UT-ES-02 | server | un cambio válido de la hora de la rifa | el sysadmin lo guarda | se actualiza la fila única, se invalida la caché `event-settings` y queda en la bitácora | RF-43 |
| UT-ES-03 | server | la tabla `event_settings` con su fila | se intenta insertar una segunda fila | la BD lo rechaza (`CHECK (id = 1)`) | ER |
| UT-ES-04 | server | los horarios iniciales de KOF | el sysadmin pone el fin del check-in (`kofCheckInEndsAt`) antes o igual que su inicio (`kofCheckInStartsAt`), o el fin de la inscripción presencial (`kofOnsiteSignupEndsAt`) antes o igual que su inicio (`kofOnsiteSignupStartsAt`) | se rechaza con un mensaje en español y la fila no cambia | RF-43, RF-75, RF-77 |
| UT-ES-05 | server | los horarios iniciales | se lee la fila de `event_settings` | trae el check-in de KOF de 11:00 a 12:00, la inscripción presencial de 12:00 a 12:45 y el bracket a las 13:00 (`kofBracketGeneratesAt`) del día del evento, y ya no existe un cierre de la inscripción previa (`kofRegistrationClosesAt`) | 1.1 |

## games

| ID | Capa | Dado | Cuando | Entonces | Req |
| --- | --- | --- | --- | --- | --- |
| UT-GA-01 | lib | un juego con enlace a itch.io y `now` = 16:29 | se decide si se muestra el enlace | no se muestra; se muestra la hora de activación (16:30) | RF-10 |
| UT-GA-02 | lib | el mismo juego y `now` = 16:30 | se decide si se muestra el enlace | se muestra | RF-10 |
| UT-GA-03 | lib | un juego sin enlace y `now` = 18:00 | se decide si se muestra el enlace | no se muestra nada | RF-10 |
| UT-GA-04 | lib | el stand zona `A`, número `3`, estudio `5`, grupo `103` | se forma el código | el visitante ve `zA-s3` y el admin ve `zA-s3-e5-103` | RF-11 |
| UT-GA-05 | server | un juego con 5 imágenes | se agrega una sexta | la BD la rechaza (`position BETWEEN 1 AND 5` + único) | RF-09 |
| UT-GA-06 | server | un juego con portada | se marca otra imagen como portada | la anterior deja de serlo en la misma transacción; nunca hay dos portadas | RF-09 |
| UT-GA-07 | server | un stand con su juego | se intenta crear un segundo juego para ese stand | la BD lo rechaza (`standId` único) | RF-09 |
| UT-GA-08 | server | un género asignado a un juego | el sysadmin intenta borrarlo | se rechaza (`onDelete: Restrict`) con un mensaje que pide reasignar el juego | ER |
| UT-GA-09 | server | un administrador del stand A | intenta editar el juego del stand B | se rechaza; el juego no cambia | RF-31 |
| UT-GA-10 | server | un administrador de stand | intenta cambiar zona o número de su stand | se rechaza | RF-31 |

## schedule

| ID | Capa | Dado | Cuando | Entonces | Req |
| --- | --- | --- | --- | --- | --- |
| UT-SC-01 | server | una actividad con fin antes del inicio | el sysadmin la guarda | se rechaza (`endsAt > startsAt`) | RF-42 |
| UT-SC-02 | lib | actividades capturadas en desorden | se preparan para la landing | quedan ordenadas por hora de inicio | RF-03 |
| UT-SC-03 | ui | ninguna actividad | se renderiza el cronograma | muestra "Cronograma por anunciar" | RF-03 |

## sponsors

| ID | Capa | Dado | Cuando | Entonces | Req |
| --- | --- | --- | --- | --- | --- |
| UT-SP-01 | lib | el teléfono `998 123 4567` | se normaliza | devuelve `+529981234567` | RF-48 |
| UT-SP-02 | lib | `+529981234567` | se formatea para mostrar | devuelve `998 123 4567` | RF-48 |
| UT-SP-03 | server | un teléfono que no está en E.164 | se guarda el patrocinador | la BD lo rechaza (`phone GLOB '+[0-9]*'`) | ER |
| UT-SP-04 | ui | un patrocinador con sitio web | se renderiza su tarjeta | el enlace abre en pestaña nueva con `rel="noopener noreferrer"` y nombre accesible | RF-48 |

## accounts

| ID | Capa | Dado | Cuando | Entonces | Req |
| --- | --- | --- | --- | --- | --- |
| UT-AC-01 | lib | el rol de cada cuenta | se consulta qué roles puede crear | sysadmin: stand_admin, raffle_admin, kof_admin, help_desk; stand_admin: stand_staff; kof_admin: kof_staff; los demás: ninguno | Roles |
| UT-AC-02 | server | un administrador de stand | intenta crear un `kof_staff` | se rechaza | Roles |
| UT-AC-03 | server | un stand con 3 cuentas de staff activas | su administrador crea una cuarta | se rechaza (trigger) | RF-32 |
| UT-AC-04 | server | un stand con 3 staff, uno desactivado | su administrador crea otro | se acepta | RF-32 |
| UT-AC-05 | server | un stand con administrador | se intenta asignarle un segundo | se rechaza (único parcial) | RF-39 |
| UT-AC-06 | server | una invitación creada hace 71 h | se activa la cuenta | se acepta: guarda la contraseña con `scrypt`, `status = active` e invitación usada | RF-31 |
| UT-AC-07 | server | una invitación creada hace 73 h | se activa la cuenta | se rechaza por expirada; la cuenta sigue `invited` | 2.1 |
| UT-AC-08 | server | una invitación ya usada | se intenta usar otra vez | se rechaza | 2.1 |
| UT-AC-09 | server | una invitación reenviada | se usa la invitación anterior | se rechaza; solo sirve la nueva | 2.1 |
| UT-AC-10 | server | una cuenta `invited` o `disabled` | intenta iniciar sesión con la contraseña correcta | se rechaza | D1b |
| UT-AC-11 | server | una cuenta con dos sesiones abiertas | el sysadmin la desactiva o le cambia el rol | las dos sesiones se borran en la misma transacción | D1b |
| UT-AC-12 | server | una sesión expirada | llega un request con esa cookie | se trata como no autenticado | D1b |
| UT-AC-13 | server | 5 intentos de login fallidos de la misma IP en la ventana | llega el sexto | se rechaza por límite de solicitudes | RNF-10 |
| UT-AC-14 | server | un `kof_staff` activo en el tablero 2 | se crea otro `kof_staff` para el tablero 2 | se rechaza (único parcial) | RF-62 |

## visitors

| ID | Capa | Dado | Cuando | Entonces | Req |
| --- | --- | --- | --- | --- | --- |
| UT-VI-01 | server | `now` = 12 de noviembre, 23:59 | un visitante se registra | se rechaza: el registro abre el 13 de noviembre | RF-13 |
| UT-VI-02 | server | `now` = 13 de noviembre, 00:00 | un visitante se registra con datos válidos | se crea el pasaporte con su PIN de 5 dígitos, se guarda la cookie del dispositivo y se encola el correo con la copia del pasaporte | RF-12, RF-14, RF-16 |
| UT-VI-03 | server | un correo que pertenece a un integrante (`TeamMember`) o a una cuenta | se intenta registrar | se rechaza con "No se pudo registrar este correo", sin revelar el motivo | RF-15 |
| UT-VI-04 | lib | `Ana@Mail.com ` | se normaliza el correo | devuelve `ana@mail.com` | RF-15 |
| UT-VI-05 | server | un visitante con el correo `ana@mail.com` | otro se registra con `ANA@mail.com` | se rechaza por correo duplicado | RF-12 |
| UT-VI-06 | server | un gamertag ya usado | otro visitante lo usa | se rechaza por gamertag duplicado | RF-12 |
| UT-VI-07 | lib | gamertags `ab`, `luna dev` y `luna_dev` | se validan con `^[a-z0-9_.-]{3,24}$` (supuesto de la V1) | los dos primeros son inválidos y el tercero es válido | RF-12 |
| UT-VI-08 | server | un registro exitoso | se lee el correo encolado | contiene el PIN, el gamertag y el enlace a `/passport`; no contiene el enlace de recuperación | RF-16 |
| UT-VI-09 | server | un correo registrado y otro no registrado | se pide recuperación con cada uno | la respuesta es idéntica en los dos casos; solo el registrado encola un correo | RF-68 |
| UT-VI-10 | server | 3 solicitudes de recuperación del mismo correo en una hora | llega la cuarta | se rechaza por límite, con la misma respuesta genérica | RF-68 |
| UT-VI-11 | server | un enlace de recuperación de hace 29 min sin usar | se abre en otro dispositivo | se acepta: el dispositivo nuevo queda activo y la cookie del anterior deja de servir | RF-68, RF-70 |
| UT-VI-12 | server | un enlace de recuperación de hace 31 min, o ya usado | se abre | se rechaza | RF-68 |
| UT-VI-13 | server | un agente de atención | genera una recuperación | el token queda con `channel = help_desk`, `issuedById` del agente y registro en la bitácora | RF-69, RF-70 |
| UT-VI-14 | server | una recuperación con canal `help_desk` sin agente | se guarda | la BD la rechaza | ER |
| UT-VI-15 | server | el correo de recuperación encolado | se lee su contenido | contiene el enlace de un solo uso | RF-71 |
| UT-VI-16 | lib | un generador aleatorio inyectado | se genera el PIN de un visitante | es un texto de exactamente 5 dígitos | RF-14 |
| UT-VI-17 | server | un visitante con el PIN `12345` y un generador inyectado que devuelve primero `12345` y después `67890` | otro visitante se registra | su PIN es `67890`; nunca hay dos visitantes con el mismo PIN | RF-14 |
| UT-VI-18 | server | un visitante con el PIN `12345` | se intenta guardar a otro con el mismo PIN | la BD lo rechaza (`UNIQUE`) | RF-14, ER |
| UT-VI-19 | server | un visitante con el PIN `12345` y un enlace de recuperación válido | abre el enlace en otro dispositivo | el PIN sigue siendo `12345` (fijo); no se genera otro | RF-14, RF-70 |
| UT-VI-20 | ui | un visitante con gamertag `luna_dev` y PIN `12345` | se renderiza su pasaporte | muestra el PIN y el gamertag, y ningún código QR | RF-19 |

## check-ins (kiosco, encuesta y boletos)

| ID | Capa | Dado | Cuando | Entonces | Req |
| --- | --- | --- | --- | --- | --- |
| UT-CI-01 | server | un staff del stand A y el PIN de un visitante válido, `now` = 15:00 | se envía el check-in con calificaciones de 4 al juego, 5 al stand y 3 al arte | se crean check-in y voto juntos y se registra `scannedById` | RF-26, RF-28, RF-36 |
| UT-CI-02 | server | un check-in sin calificación de juego, de stand o de arte | se guarda | la BD lo rechaza (`NOT NULL` y `BETWEEN 1 AND 5`): sin encuesta no hay check-in | RF-26, RF-28 |
| UT-CI-03 | server | una calificación de 0 o de 6 al juego, al stand o al arte | se guarda | se rechaza | RF-26 |
| UT-CI-04 | server | un check-in ya registrado (mismo `id`) | llega otra vez en un lote | responde `duplicate` y no crea otro registro | EC-03 |
| UT-CI-05 | server | un visitante con check-in en el stand A | se teclea otra vez su PIN en el stand A y llega otro check-in con otro `id` y otras calificaciones | responde `duplicate` con el check-in existente; queda uno solo (`UNIQUE (visitorId, standId)`) y no se guarda otra encuesta | RF-30, EC-03 |
| UT-CI-06 | server | un staff del stand A | intenta registrar un check-in en el stand B | se rechaza | RF-33 |
| UT-CI-07 | server | un stand sin juego registrado | su staff envía un check-in | se rechaza con "Registra tu juego para empezar a recibir visitas" | RF-34 |
| UT-CI-08 | server | `scannedAt` = 16:59 y recepción a las 17:40 | se procesa | se acepta | RN-04 |
| UT-CI-09 | server | `scannedAt` = 17:01 | se procesa | responde `late` | RN-04 |
| UT-CI-10 | server | `scannedAt` = 16:59 y recepción a las 18:00 (inicio de la rifa) | se procesa | responde `late` | EC-02 |
| UT-CI-11 | lib | `scannedAt` posterior a la hora de recepción | se ajusta la hora | queda igual a la hora de recepción | EC-01 |
| UT-CI-24 | lib | `scannedAt` = 09:00, antes de la apertura del evento (12:00) | se ajusta la hora | queda igual a la hora de apertura (`eventStartsAt`), como en la V1 | EC-01 |
| UT-CI-12 | server | `scannedAt` = 16:58 recibido a las 17:30 (reloj atrasado) | se procesa | se acepta y queda `scannedById` (riesgo aceptado) | EC-01 |
| UT-CI-13 | server | un PIN que no es de ningún visitante (por ejemplo, mal tecleado) | se procesa | responde `unknown_visitor`; no se crea check-in ni voto y el rechazo solo aparece en la lista de rechazadas del kiosco | RF-24, RF-35, D4 |
| UT-CI-14 | server | un lote con uno válido, uno `late` y uno `unknown_visitor` | se procesa | cada uno recibe su propio resultado; el válido se guarda aunque los otros fallen | D4 |
| UT-CI-15 | server | un lote de 51 check-ins | se envía | se rechaza por exceder el máximo de 50 | D4 |
| UT-CI-16 | server | un visitante con 8 check-ins | se registra el noveno | se crea el boleto del hito 9 en la misma transacción | RN-01 |
| UT-CI-17 | server | un visitante con 17 check-ins | se registra el decimoctavo | se crea el boleto del hito 18 | RN-01 |
| UT-CI-18 | server | un visitante que ya tiene el boleto del hito 9 | se reenvía el noveno check-in | no se crea otro boleto (`UNIQUE (visitorId, milestone)`) | RN-01 |
| UT-CI-19 | server | un visitante excluido | se envía un check-in suyo | se rechaza | RF-46 |
| UT-CI-20 | lib | una cola local con 3 check-ins pendientes | el servidor responde `ok`, `duplicate` y `late` | los dos primeros salen de la cola como enviados; el tercero pasa a la lista de rechazados con su motivo | D4 |
| UT-CI-21 | lib | 60 check-ins en la cola | se preparan los envíos | se arman lotes de máximo 50, en orden de escaneo | D4 |
| UT-CI-22 | ui | 3 check-ins pendientes sin conexión | se renderiza la barra del kiosco | muestra "Sin conexión · 3 visitas por enviar" y nunca muestra calificaciones | D4, RF-29 |
| UT-CI-23 | ui | un rechazo `unknown_visitor` | se abre el detalle | muestra el motivo y la instrucción "Que revise su pasaporte o vaya a Atención"; no muestra gamertag, porque un PIN no reconocido no identifica a nadie | RF-24, D4 |
| UT-CI-25 | server | el PIN de Ana, tecleado por otra persona en el stand A | se procesa el check-in | se acepta y la visita queda en el pasaporte de Ana (riesgo aceptado); queda `scannedById` | EC-04 |
| UT-CI-26 | lib | los textos `1234`, `123456` y `12a45` | el kiosco los valida como PIN | ninguno es válido; `12345` sí | RF-14, RF-26 |
| UT-CI-27 | ui | el PIN de un visitante ya aceptado en el kiosco | se renderiza la encuesta | muestra tres escalas de 1 a 5 (juego, stand y arte) y no permite enviarla con alguna sin contestar | RF-26, RF-28 |
| UT-CI-28 | ui | una encuesta enviada | termina el envío | muestra "Gracias", no muestra ninguna calificación y vuelve sola a la pantalla del PIN | RF-29 |

## raffle

| ID | Capa | Dado | Cuando | Entonces | Req |
| --- | --- | --- | --- | --- | --- |
| UT-RA-01 | server | `now` = 17:59 | el animador gira | se rechaza: la rifa empieza a las 18:00 | RF-49 |
| UT-RA-02 | server | boletos activos y un generador aleatorio inyectado | el animador gira | sale un boleto activo de un visitante no excluido; el giro queda `pending` | RF-49 |
| UT-RA-03 | server | un giro `pending` | se intenta girar otra vez | la BD lo rechaza (único parcial sobre `pending`) | RF-51 |
| UT-RA-04 | server | el mismo `requestId` | se envía "Girar" dos veces | se crea un solo giro y la segunda respuesta devuelve el mismo resultado | EC-08 |
| UT-RA-05 | server | un visitante con dos boletos | sale uno de ellos | los dos dejan de estar activos en la misma transacción | RF-52, RN-05 |
| UT-RA-06 | server | un giro `pending` | el animador elige "Ganador" | queda `winner`, se encola el correo al ganador y se publica el evento de la tómbola | RF-53 |
| UT-RA-07 | server | un giro `pending` | el animador elige "Descartado" | queda `discarded`, no se encola correo y se permite el siguiente giro | RF-51, RF-53 |
| UT-RA-08 | server | un giro `discarded` | se intenta registrar un premio | la BD lo rechaza (`prizeName` solo con `winner`) | RF-55 |
| UT-RA-09 | server | un giro `winner` | otro administrador de rifa registra el premio | se guarda el nombre del premio y quién lo registró | RF-55 |
| UT-RA-10 | server | la rifa cerrada (`raffleClosedAt`) | el animador gira | se rechaza | RF-54 |
| UT-RA-11 | server | ningún boleto activo | el animador gira | responde "No quedan boletos" sin crear un giro | RF-54 |
| UT-RA-12 | server | los boletos de un visitante excluido | se gira | nunca salen | RF-46 |

## tournament

| ID | Capa | Dado | Cuando | Entonces | Req |
| --- | --- | --- | --- | --- | --- |
| UT-TO-01 | (eliminado) | — | — | Sustituido por UT-TO-25 y UT-TO-26: desde la v2.2 el visitante ya no se inscribe desde su pasaporte, el administrador de KOF arma la lista previa. Cómo pide entrar el visitante sigue abierto (sección 9 de la SRS). | RF-58 |
| UT-TO-02 | server | 63 inscripciones vigentes (sin contar las de "No se presentó") y `now` dentro de la inscripción presencial | dos visitantes se inscriben a la vez | entra solo uno; el otro recibe "Torneo lleno" | EC-05, RF-58, RF-77 |
| UT-TO-03 | server | un visitante inscrito | el administrador de KOF lo agrega otra vez | se rechaza (`visitorId` único) | RF-58 |
| UT-TO-04 | (eliminado) | — | — | Sustituido por UT-TO-39: a las 13:00 se genera el bracket (RF-59) y la inscripción presencial cierra a las 12:45 (RF-77), no con la hora del bracket. | RF-59, RF-77 |
| UT-TO-05 | lib | 64 jugadores con check-in y un generador aleatorio con semilla fija | se baraja | el resultado es una permutación de los 64 y es reproducible con la misma semilla | RF-59 |
| UT-TO-06 | lib | 40 jugadores con check-in | se genera el bracket | hay 24 byes, 6 por tablero, y ningún combate de la ronda 1 es bye contra bye | RF-60 |
| UT-TO-07 | lib | el bracket generado | se revisa la estructura | hay 63 combates: 15 por tablero en las rondas 1 a 4, 2 semifinales y 1 final, y cada combate apunta a su siguiente | RF-57 |
| UT-TO-08 | lib | el bracket generado | se revisa la asignación de captura | cada combate del tablero N es del staff N; semifinal 1 y final del staff 1; semifinal 2 del staff 2 | RF-62 |
| UT-TO-09 | server | un bracket ya generado | se intenta generar otra vez | se rechaza con "El bracket ya se generó" | EC-06 |
| UT-TO-10 | lib | un combate con un bye | se genera el bracket | el jugador avanza solo y el combate queda `finished` con `outcome = bye` | RF-60 |
| UT-TO-11 | server | un combate `ready` | su staff lo activa | queda `active` | RF-66 |
| UT-TO-12 | server | un combate `pending` (falta un jugador) | su staff intenta activarlo | se rechaza | RF-66 |
| UT-TO-13 | server | un combate `active` | su staff marca al perdedor | queda `finished`, el ganador pasa al siguiente combate en su lado y se publica el evento del bracket | RF-61 |
| UT-TO-14 | server | un combate del tablero 1 | el staff del tablero 2 intenta capturarlo | se rechaza | RF-62 |
| UT-TO-15 | server | un combate del tablero 3 | el administrador de KOF lo captura | se acepta | RF-62 |
| UT-TO-16 | server | un combate con `version = 3` | el staff y el admin guardan a la vez con la versión 3 | gana el primero; el segundo recibe "El combate cambió, recarga" | EC-07 |
| UT-TO-17 | server | un combate `active` | el staff marca "No se presentó" a un jugador | el otro avanza y queda en la bitácora | RF-63 |
| UT-TO-18 | server | un "No se presentó" cuyo siguiente combate no ha empezado | el administrador lo revierte | el combate vuelve a `active` y el jugador que había avanzado se retira del siguiente | RF-63 |
| UT-TO-19 | server | un "No se presentó" cuyo siguiente combate ya está `active` | el administrador intenta revertirlo | se rechaza | RF-63 |
| UT-TO-20 | server | un combate `frozen` | su staff intenta capturar resultado | se rechaza; solo el administrador lo resuelve | RF-64 |
| UT-TO-21 | server | un combate congelado | el administrador descalifica a los dos | el combate queda sin ganador y el siguiente combate se convierte en bye para su rival | RF-65 |
| UT-TO-22 | server | una doble descalificación en la semifinal 1 | se resuelve | el ganador de la semifinal 2 es campeón sin jugar la final | RF-65 |
| UT-TO-23 | server | una doble descalificación en la final | se resuelve | el torneo queda sin campeón | RF-65 |
| UT-TO-24 | lib | un ganador que no es ninguno de los dos jugadores | se valida el resultado | se rechaza; la BD también lo impide | ER |
| UT-TO-25 | server | `now` = 12 de noviembre, 23:59 y un visitante registrado | el administrador de KOF lo agrega a la lista previa | se rechaza: la inscripción previa abre el 13 de noviembre | RF-58, 1.1 |
| UT-TO-26 | server | `now` = 13 de noviembre, 00:00 y un visitante con pasaporte | el administrador de KOF lo agrega a la lista previa | se crea la inscripción con `channel = pre`, `status = registered`, sin hora de check-in y con `registeredById` del administrador | RF-58 |
| UT-TO-27 | server | un `kof_staff` (o un administrador de stand) | intenta agregar a la lista previa o hacer un check-in | se rechaza; solo lo hace el administrador de KOF | RF-58, RF-75, Roles |
| UT-TO-28 | server | 50 jugadores en la lista previa | el administrador de KOF agrega al 51 por la lista previa | se rechaza: el cupo previo es de 50, para dejar al menos 14 lugares al día del evento | RF-58 |
| UT-TO-29 | server | una inscripción previa y `now` = 10:59 del día del evento | el administrador de KOF teclea el PIN del jugador | se rechaza: el check-in abre a las 11:00 | RF-75, 1.1 |
| UT-TO-30 | server | una inscripción previa y `now` = 11:30 | el administrador de KOF teclea el PIN del jugador | queda `checked_in` con `checkedInAt` = `now`; el jugador entra al bracket | RF-75 |
| UT-TO-31 | server | `now` = 11:30 y el PIN de un visitante que no está en la lista previa, o un PIN que no es de nadie | el administrador de KOF lo teclea en el check-in | se rechaza y no se crea ninguna inscripción | RF-75 |
| UT-TO-32 | server | una inscripción previa sin check-in y `now` = 12:05 | el jugador hace su check-in con su PIN | se rechaza; la inscripción sigue en "No se presentó" y su lugar sigue libre | EC-15, RF-76 |
| UT-TO-33 | server | 45 inscripciones previas, 40 con check-in, y `now` = 12:00 (fin del check-in) | corre el cierre del check-in | las 5 sin check-in pasan a `no_show`; las 40 no cambian y el cierre queda en la bitácora | RF-76 |
| UT-TO-34 | server | una inscripción en `no_show` | se intenta pasarla a `checked_in` o a `registered` | la BD lo rechaza (trigger): "No se presentó" ya no cambia | RF-76 |
| UT-TO-35 | server | el fin del check-in (`kofCheckInEndsAt`) movido a las 12:30 | corre el cierre con `now` = 12:00 y otra vez con `now` = 12:30 | a las 12:00 no cambia nada; a las 12:30 las inscripciones sin check-in pasan a `no_show` | RF-76, 1.1 |
| UT-TO-36 | server | `now` = 11:59 | un visitante con pasaporte se inscribe de forma presencial | se rechaza: la inscripción presencial abre a las 12:00 | RF-77, 1.1 |
| UT-TO-37 | server | `now` = 12:00 y un visitante con pasaporte que no está en la lista previa | el administrador de KOF lo agrega | se crea la inscripción con `channel = onsite`, `status = checked_in` y `checkedInAt` = `now`: el check-in queda hecho al inscribirse | RF-77 |
| UT-TO-38 | server | `now` = 12:10 y un visitante sin pasaporte | el administrador de KOF lo registra (M3) y lo agrega | se crean el pasaporte con su PIN y la inscripción presencial con check-in | RF-77, RF-12, RF-14 |
| UT-TO-39 | server | `now` = 12:46 (la inscripción presencial cerró a las 12:45) | se intenta inscribir a alguien de forma presencial | se rechaza: la inscripción presencial cerró | RF-77, 1.1 |
| UT-TO-40 | server | 64 inscripciones, una en `no_show`, y `now` = 12:10 | llegan dos visitantes a inscribirse de forma presencial, uno tras otro | el primero entra (el lugar de "No se presentó" quedó libre); el segundo recibe "Torneo lleno" | RF-76, RF-77, RF-58 |
| UT-TO-41 | server | `now` = 12:59 y un bracket sin generar | se intenta generar | se rechaza: el bracket se genera a la hora configurada (13:00) | RF-59, 1.1 |
| UT-TO-42 | server | 45 inscripciones: 40 con check-in y 5 en `no_show`, y `now` = 13:00 | se genera el bracket | solo los 40 con check-in entran, cada uno con su `slot`; los de `no_show` no tienen `slot`; hay 24 byes | RF-59, RF-60 |
| UT-TO-43 | ui | un jugador inscrito en la lista previa, sin check-in | se renderiza su pasaporte | indica que está en el torneo y avisa que el 20 de noviembre, de 11:00 a 12:00, debe hacer su check-in en el stand de KOF del edificio B; las horas llegan por props desde `event_settings` | RF-75, 1.1 |

## admin (moderación, alertas y paro de emergencia)

| ID | Capa | Dado | Cuando | Entonces | Req |
| --- | --- | --- | --- | --- | --- |
| UT-AD-01 | server | un visitante con check-ins y boletos | el sysadmin lo excluye con motivo | sus check-ins dejan de contar, sus boletos quedan fuera de la rifa, nada se borra y queda en la bitácora | RF-46 |
| UT-AD-02 | server | una exclusión sin motivo | se guarda | la BD la rechaza | ER |
| UT-AD-03 | server | un check-in | el sysadmin lo anula con motivo | queda con fecha, motivo y quién lo anuló; deja de contar en promedios y conteos | RF-46 |
| UT-AD-04 | server | una anulación con fecha pero sin motivo | se guarda | la BD la rechaza (anulación completa o nula) | ER |
| UT-AD-13 | server | un visitante con 9 check-ins y el boleto del hito 9, antes de la rifa | el sysadmin anula uno de sus check-ins | el boleto pasa a `voided` en la misma transacción y queda en la bitácora | RF-46 |
| UT-AD-14 | server | ese visitante con el boleto `voided` | registra un nuevo check-in válido y vuelve a 9 | el mismo boleto vuelve a `active` con su número original; no se crea otro | RF-46 |
| UT-AD-15 | server | la rifa ya empezó | el sysadmin anula un check-in | el check-in queda anulado, pero los boletos no cambian (congelados) | RN-04 |
| UT-AD-05 | lib | umbral configurado de 12 calificaciones de 5 en 10 minutos, y un stand con 12 en ese lapso | se evalúan las alertas | aparece una alerta para ese stand; con 11 no aparece | RF-45 |
| UT-AD-06 | lib | umbral configurado de 1 visita, y un visitante con un solo check-in | se evalúan las alertas | aparece en la alerta de visitantes de un solo stand; con 2 check-ins no aparece | RF-45 |
| UT-AD-16 | server | los umbrales de alertas | el sysadmin guarda un valor de 0 o negativo | se rechaza (`CHECK` mayor que 0) y los umbrales no cambian | RF-45 |
| UT-AD-07 | lib | muestras de CPU al 55% durante 90 s | se evalúa el paro | no se activa | Ops |
| UT-AD-08 | lib | muestras de memoria al 55% durante 2 min | se evalúa el paro | se activa: cierra el bracket público | Ops |
| UT-AD-09 | server | el paro automático activado | se registra el cambio | `publicBracketEnabled = false` y queda en la bitácora | Ops |
| UT-AD-10 | server | el bracket público cerrado | llega una conexión SSE pública | se rechaza; la operación sigue conectada | D2 |
| UT-AD-11 | server | 18 stands | el sysadmin crea el decimonoveno | se rechaza (trigger) | RN-01 |
| UT-AD-12 | server | un stand `zA-s3` | el sysadmin crea otro `zA-s3` | se rechaza (`UNIQUE (zone, number)`) | RN-07 |

## Decisiones tomadas al escribir los casos

- Anular un check-in anula el boleto del hito que dependía de él; si el visitante vuelve a llegar al hito, el mismo
  boleto se reactiva. Con la rifa iniciada, los boletos no cambian.
- El horario del evento (de 12:00 a 19:00 por ahora) vive en `event_settings` (`eventStartsAt`, `eventEndsAt`).
- Desde la v2.2 el PIN sustituye al QR en todos los casos de visitantes, check-ins y KOF. Los nombres `scannedAt` y
  `scannedById` se conservan (RF-36): son la hora y la cuenta del staff que tenía abierto el kiosco.
- Solo el administrador de KOF agrega a la lista previa y hace el check-in (Roles, RF-58 y RF-75); el staff de KOF
  captura combates.
- El cupo total de 64 cuenta las inscripciones que no están en "No se presentó": ese estado libera el lugar (RF-76).
- El bracket no se genera antes de la hora configurada (UT-TO-41): es una lectura de "se genera una sola vez a la hora
  configurada" (RF-59).
- Los umbrales de las alertas de fraude son configurables por el sysadmin en `event_settings`
  (valores iniciales: 12 calificaciones de 5 en 10 minutos; visitantes con 1 solo check-in).

## Temas que la SRS deja abiertos

Sin casos hasta que el equipo decida (sección 9 de `srs-v2.md`):

- **Cómo se guarda el PIN:** UT-VI-16 a UT-VI-19 no suponen hash ni cifrado; se prueban el formato, la unicidad y que
  sea fijo.
- **PIN mal tecleado sin conexión que coincide con el de otro visitante:** UT-CI-25 fija el comportamiento actual de la
  SRS (la visita queda en el pasaporte de quien tiene ese PIN); un caso de detección espera la decisión.
- **Cómo pide el visitante entrar a la lista previa de KOF:** sin casos de autoservicio (UT-TO-01 eliminado).
