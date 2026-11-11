# Manual de uso: torneo de KOF

Guía para quien opera el torneo el día del evento. Cubre al administrador de KOF, al staff de las mesas y al público.
Describe lo que el sistema hace hoy; lo que todavía no existe está en la sección "Lo que el sistema no hace".

## 1. Quién es quién

| Rol | Entra a | Qué puede hacer |
| --- | --- | --- |
| Administrador de KOF | `/login`, luego `/admin/kof` | Todo: inscripciones, check-in, generar y reiniciar el bracket, capturar cualquier combate, congelar, descongelar, descalificar, revertir, abrir o cerrar la vista pública, invitar a su staff |
| Staff de la mesa 1 | `/login`, luego `/admin/kof` | Iniciar combates, marcar al perdedor y "No se presentó" en los tableros 1 y 2, la semifinal 1 y la final |
| Staff de la mesa 2 | `/login`, luego `/admin/kof` | Lo mismo en los tableros 3 y 4 y la semifinal 2 |
| Sysadmin | `/admin` | Invita a los administradores de KOF. No tiene comandos del torneo |
| Público | `/tournament` | Solo ver el bracket, sin sesión |

El sistema valida el rol y la mesa en el servidor: si un staff abre el combate de otra mesa, el botón no aparece y, aunque
lo forzara, se rechaza. Un staff sin mesa asignada ve el aviso "Tu cuenta todavía no tiene una mesa asignada".

### Dar de alta al staff

1. El sysadmin invita al administrador de KOF desde `/admin`; el administrador de KOF invita a su staff desde `/admin/kof`.
2. Cada invitado recibe un enlace por correo, válido 72 horas. Al abrirlo elige su contraseña (mínimo 12 caracteres).
3. Un enlace vencido se reenvía desde el mismo panel. Una cuenta se puede desactivar y volver a activar.
4. La mesa (1 o 2) se elige al invitar al staff, en el mismo formulario de invitación.

## 2. Línea de tiempo del día

Las horas no están escritas en el código: salen de la configuración del evento (`event_settings`). Los valores previstos:

| Hora | Qué ocurre |
| --- | --- |
| 13 de noviembre | Se abre la lista de inscripciones |
| Antes de las 12:00 del evento | Lista previa: inscrito, sin check-in. Máximo 50 |
| 12:00 a 12:45 | Inscripción presencial: la persona entra con el check-in ya hecho |
| `kofCheckInStartsAt` a `kofCheckInEndsAt` | Ventana para hacer check-in con el PIN |
| 12:45 | Se cierra la inscripción presencial |
| 12:55 | Ya se puede generar el bracket |

No hay temporizadores automáticos. Las acciones que dependen de la hora (cerrar el check-in, marcar ausentes) se ejecutan
cuando el administrador abre el panel, agrega a alguien, hace un check-in o genera el bracket. Si nadie toca el panel, no
pasan solas.

Las horas se cambian en la tabla `event_settings` de la base de datos; todavía no hay una pantalla para editarlas.

## 3. Antes del torneo: inscripciones y check-in

Todo esto lo hace el administrador de KOF en el panel "Inscripciones" de `/admin/kof`.

### Agregar a un jugador

1. Escribe el gamertag en "Gamertag del jugador" y pulsa "Agregar al torneo".
2. El gamertag debe existir (el jugador se registró antes como visitante). Si no, sale "No existe ese gamertag".
3. Según la hora, el resultado es:
   - Antes del 13 de noviembre: "La lista abre el ...". No se agrega.
   - Hasta las 12:00: "Agregado a la lista previa."
   - De 12:00 a 12:45: "Inscrito en el torneo, con el check-in hecho."
   - Desde las 12:45: "La inscripción cerró."
4. Mensajes de rechazo: "Ya está inscrito.", "La lista previa está llena." (50) y "Torneo lleno." (64).

### Hacer el check-in

1. El jugador llega al área de KOF y dice su PIN (el de su pasaporte).
2. En "PIN del jugador" se teclea y se pulsa "Hacer check-in". Sale "Check-in hecho: <gamertag>."
3. Un PIN desconocido o de alguien que no está en la lista da el mismo mensaje, "PIN no reconocido o sin inscripción.", y no
   crea nada. Otros avisos: "El check-in abre a las ...", "El check-in cerró." y "Ya hizo su check-in."
4. Al terminar la ventana, quienes no hicieron check-in pasan a "No se presentó" y ya no cambian.

El panel muestra los conteos: Inscritos, Lista previa, Lugares (de 64), Con check-in y No se presentaron.

El jugador ve su estado en su pasaporte (`/passport`): inscrito con las instrucciones del check-in, con check-in hecho, o
fuera por no presentarse.

### Generar el bracket

1. A partir de las 12:55, en "Generar el bracket", pulsa "Generar bracket".
2. Se generan 63 combates con los jugadores que hicieron check-in. El barajeo es aleatorio y queda registrado.
3. Se necesitan entre 32 y 64 jugadores con check-in. Con menos de 64, los lugares vacíos son byes, repartidos parejo entre
   los tableros; un bye nunca enfrenta a otro bye.
4. Se genera una sola vez. Un segundo intento sale "El bracket ya se generó."; antes de la hora, "El bracket se genera a
   las ...".

Revisa los conteos antes de generar. Una vez generado, la lista de jugadores ya no cambia, a menos que el administrador reinicie el torneo (sección 6).

## 4. Durante el torneo: capturar combates

### Qué ve cada persona

El panel muestra un resumen (Listos, En juego, Congelados, Terminados) y los combates por sección: tableros, semifinales y
final. El administrador ve las siete secciones; cada staff ve las de su mesa. La página se actualiza sola cada 3 segundos.
Si se pierde la conexión aparece "Sin conexión. Se muestra el último estado recibido." y la pantalla conserva el último
estado.

### Estados de un combate

| Estado | Significa |
| --- | --- |
| Pendiente | Todavía falta que se defina alguno de los jugadores |
| Listo | Los dos jugadores están definidos y el combate no empezó |
| En juego | Ya se inició |
| Terminado | Tiene resultado |
| Congelado | Pausado por el administrador |

Un combate con un bye se resuelve solo: el rival pasa a la siguiente ronda sin que nadie capture nada.

### Flujo normal de un combate

1. Cuando el combate está "Listo", el staff pulsa "Iniciar combate". Pasa a "En juego".
2. Al terminar la partida, pulsa "Pierde <gamertag>" en quien perdió y confirma con "Confirmar" (la pregunta es "¿Seguro?
   Esta acción queda en la bitácora.").
3. El ganador aparece de inmediato en el siguiente combate. Si ese combate ya tiene sus dos jugadores, queda "Listo".
4. Un combate terminado como "Jugado" no se puede revertir. Verifica el perdedor antes de confirmar.

### Si alguien no se presenta

En un combate "Listo" o "En juego" pulsa "No se presentó: <gamertag>" en la persona ausente y confirma. El rival avanza. Si
no se presenta ninguna de las dos, el siguiente combate queda como bye para su rival.

### Funciones solo del administrador

| Acción | Cuándo | Efecto |
| --- | --- | --- |
| Congelar | Combate "Listo" o "En juego" | Se pausa. El staff ve "Congelado: solo el administrador de KOF lo resuelve." |
| Descongelar | Combate "Congelado" | Vuelve a su estado |
| Descalificar a <gamertag> | Combate congelado | Quita a ese jugador; el rival avanza |
| Descalificar a los dos | Combate congelado | Quita a ambos; el siguiente combate es bye para su rival |
| Revertir resultado | Combate terminado por "No se presentó" o descalificación | Devuelve el combate a su estado anterior |

Para revertir, el combate siguiente no debe haber empezado ni terminado; si no, sale "No se puede revertir: el combate #N
ya empezó o terminó." Los combates jugados no se revierten.

Casos especiales: una doble descalificación en una semifinal deja campeón al otro finalista; en la final, el torneo termina
sin campeón.

### Cuando dos personas capturan a la vez

Cada cambio se guarda solo si nadie guardó antes. Si la otra mesa guardó primero, el sistema vuelve a aplicar tu acción
sobre el estado nuevo. Solo falla con "El combate cambió, recarga." cuando ya no encaja (por ejemplo, el combate ya estaba
terminado). Recarga y revisa antes de repetir.

### Bitácora

Al final del panel, "Bitácora" lista cada movimiento (combate en juego, ganador, ausencia, descalificación, congelado,
reversión, campeón). Es de solo inserción: no se edita ni se borra.

## 5. La pantalla pública

`/tournament` muestra el bracket sin sesión, solo con gamertags y resultados. Se actualiza cada 3 segundos.

- En pantallas de 900 px o más se ve como árbol de llaves, con la final al centro.
- En el teléfono se ve la lista por tablero, con el botón "Ver el árbol completo".
- Cada vez que se registra un resultado, el árbol acerca la cámara al combate, tacha en rojo al perdedor, ilumina al
  ganador y lo mueve a la siguiente ronda; después aleja la cámara. Si llegan varios resultados juntos, se reproducen uno
  tras otro. Con "reducir movimiento" activado en el dispositivo, el resultado aparece al instante.
- Arriba aparece "En juego ahora" con los combates activos y, al terminar, el campeón.

### Abrir y cerrar la vista pública

El administrador de KOF usa el botón "Cerrar al público" (o "Abrir al público") en `/admin/kof`. Cerrada, el público ve "El
bracket está disponible en la pantalla del torneo." y la API no entrega el bracket. No afecta al staff. Cada cambio queda en la
bitácora. Antes de generar el bracket, el público ve "El bracket todavía no está listo."

## 6. Reiniciar el torneo y otros imprevistos

### Reiniciar el torneo

Solo el administrador de KOF puede reiniciar el torneo, desde `/admin/kof`. El bloque "Reiniciar el torneo" (con borde rojo)
aparece en el panel de Inscripciones solo cuando el bracket ya existe.

**Qué hace**
- Borra el bracket y todos sus resultados.
- Conserva la lista de inscritos, los check-in y los "No se presentó".
- Deja el torneo como antes de generarlo: el panel vuelve a mostrar "Generar bracket" y se puede generar uno nuevo, con un barajeo
  nuevo.
- Deja una fila en la bitácora de auditoría (`kof_tournament.reset`) con quién lo hizo, cuántos jugadores tenía el bracket,
  su versión y cuántos combates estaban terminados.

**Qué no hace**
- No devuelve los resultados: es definitivo. Si un jugador ya ganó un combate, ese resultado se pierde.
- No reabre el check-in ni el registro. Las horas siguen las del evento: si ya pasó el cierre, no se puede agregar a nadie.
- No quita a nadie de la lista. Para sacar a un jugador no hay una función; queda como está.
- No cambia la vista pública: sigue abierta o cerrada como estaba. Mientras no haya bracket, el público ve "El bracket todavía no
  está listo."

**Cómo se hace**
1. Avisa a las dos mesas que se va a reiniciar: dejarán de ver los combates.
2. En el bloque "Reiniciar el torneo", escribe `REINICIAR` en el campo "Escribe REINICIAR para confirmar". Va en mayúsculas;
   los espacios alrededor no importan. Con cualquier otra palabra no se hace nada y sale "Escribe REINICIAR tal cual para
   confirmar."
3. Pulsa "Reiniciar torneo". Sale "Torneo reiniciado. Ya puedes generar el bracket otra vez."
4. Revisa los conteos de inscripciones y pulsa "Generar bracket". La generación sigue las reglas de siempre: desde las 12:55 y con
   entre 32 y 64 jugadores con check-in.

Si otra mesa guarda un resultado justo mientras reinicias, puede salir "No hay un bracket que reiniciar." Recarga y repite.

**Cuándo usarlo**
- Se generó el bracket con una lista equivocada.
- Hubo un error grave de captura que no se arregla con revertir (por ejemplo, un perdedor equivocado en un combate jugado, que no se
  puede revertir).
- Fue una prueba y hay que empezar el torneo real.

No lo uses para corregir un solo combate "No se presentó" o descalificado: esos se revierten desde el combate (sección 4).

### Reiniciar en local (desarrollo)

Para pruebas puedes usar lo mismo desde el panel. Para dejar la base de datos como nueva:
1. Detén el servidor.
2. Borra o reemplaza el archivo de la base de datos local.
3. Corre `npm run db:deploy`, `npm run db:seed` y `npm run db:seed:kof` (3 cuentas de prueba y 40 jugadores con el bracket ya generado).
   Nunca lo corras con `NODE_ENV=production`; se niega.

### Qué hacer si algo sale mal

| Problema | Qué hacer |
| --- | --- |
| Se capturó al perdedor equivocado en un combate jugado | No se puede revertir un combate jugado. Si es grave, el administrador reinicia el torneo (se pierden todos los resultados) o un desarrollador lo corrige en la base de datos |
| Un jugador no llega a su combate | "No se presentó" y el rival avanza. Si aparece después, el administrador revierte el resultado mientras el siguiente combate no haya empezado |
| Hay una disputa o duda en un combate | El administrador lo congela y lo resuelve con "Descalificar" o "Descongelar" |
| Un combate quedó "En juego" por error | El administrador lo congela y lo descongela, o resuelve el resultado |
| "El combate cambió, recarga." | Recarga la página y revisa el estado |
| "Sin conexión" en el panel | Se mantiene el último estado; revisa la red. Los botones envían al servidor, no se guarda nada localmente |
| Un jugador de última hora sin gamertag | Debe registrarse primero como visitante en su teléfono; después el administrador lo agrega entre las 12:00 y las 12:45 |
| Fallo del sistema durante el torneo | Cierra la vista pública para el público y sigue con el bracket en la pantalla del torneo |

## 7. Tiempos

- **Duración de un combate:** el sistema no la mide. No hay temporizador de combate ni de ronda; el staff decide cuándo iniciar
  y cuándo terminar. Si se quiere cronometrar, hay que usar un reloj aparte.
- **Actualización de las pantallas:** cada 3 segundos, tanto el panel como la vista pública.
- **Animación de un resultado:** unos 2,7 segundos por resultado (acercamiento, brillo y avance), más 0,7 de zoom out al
  final. Con más de 3 resultados en espera cada paso dura la mitad.
- **Enlaces de invitación:** 72 horas.
- **Sesión del staff:** la duración está en `src/shared/lib/server/session.ts`.

## 8. Lo que el sistema no hace (hoy)

- Reiniciar solo una parte del torneo: se reinicia todo el bracket o nada.
- Corregir un combate jugado: la única salida es reiniciar todo el torneo.
- Quitar o cambiar a un jugador de la lista una vez inscrito.
- Cronometrar combates o rondas.
- Cerrar solo el check-in o la inscripción a la hora exacta sin que alguien abra el panel.
- Cerrar la vista pública automáticamente por carga del servidor (CPU o memoria).
- Mostrar el bracket en tiempo real por SSE: se consulta cada 3 segundos.
- Registrar en el momento a un visitante sin pasaporte.
- Lista de espera para los lugares de "No se presentó": quedan vacíos y son byes.
- Editar los horarios del evento desde una pantalla.

## 9. Lista rápida del día

1. Confirma que el staff de las dos mesas pueda entrar y tenga su mesa asignada.
2. Revisa en `event_settings` las horas del torneo.
3. Hasta las 12:00: lista previa. De 12:00 a 12:45: inscripción presencial.
4. En la ventana de check-in: PIN de cada jugador.
5. Revisa los conteos y, desde las 12:55, "Generar bracket". Si hay que empezar de nuevo, "Reiniciar torneo" (sección 6).
6. Abre `/tournament` en la pantalla del torneo.
7. Cada mesa: "Iniciar combate", luego "Pierde <gamertag>" y "Confirmar".
8. El administrador atiende congelados, descalificaciones y reversiones.
9. Al terminar, aparece el campeón en el panel y en la vista pública.
