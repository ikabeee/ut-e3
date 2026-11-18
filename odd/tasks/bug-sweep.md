# Correcciones que el usuario va reportando

Revisión del sitio en local (`develop` + `feature/hide-unready-games`). El usuario muestra los bugs poco a poco; cada uno
es una tarea.

## Specs

- S1: `/raffle` (ganadores de la rifa): "Debe ir centrado y con algo alusion a la rifa como icono o logo". La captura
  muestra el título "GANADORES DE LA RIFA", la descripción, el botón "VER LA TÓMBOLA EN VIVO" y "Todavía no hay
  ganadores confirmados." alineados a la izquierda de una columna angosta en escritorio.
- S2: "[Image#2] -> Quitar el boton de reproducir" (captura: botón de pausa cuadrado con borde blanco sobre la franja
  azul del video del hero).
- S3: "[Image#3] -> Quitar el neon del coverflow" (captura: resplandor blanco alrededor de la portada activa).
- S4: "[Image#4] -> Tardan en cargar las imagenes en los pases de los invitados" (gafetes de "Invitadas especiales").
- S5: "[Image#5] -> Aqui deberia poder registrarme al torneo de KOF y ademas debe haber un icono alusivo a ese evento.
  Ademas debe mostrar INFORMACION SOBRE EL TORNEO, FECHAS, HORAS CUANDO, COMO, CUANTOS. DEBERIA DEJAR DE MOSTRAR LOS
  BOTONES ARENA KOF Y CRONOGRAMA, NO SE NECESITAN" (captura: /tournament, "Bracket del torneo de KOF").
- S6: "Los mensajes de error de conexion deberian ser a traves de un TOAST y no un cuadro de texto" (captura: recuadro
  rojo "Sin conexión. Se muestra el último estado recibido." en /tournament).
- S7: "Necesito que sea SOLO UNA TIRA QUE FUNCIONE COMO CARRUSEL EN LA LANDING PAGE como un ticket largo de feria"
  (captura: rejilla de boletos de patrocinadores).
- S8: "Necesito un mapa de sitio en el footer para que podamos acceder al panel de administracion".
- S9: "Elimina la fecha 20.11.2026 · UT Cancún".
- S10: "Estos botones no tienen hover" (captura: filtros del croquis Todos, Stands 18, Actividades 3, Servicios 6).
- S11: "Quita estos botones de la landing page tanto abrir el croquis como ocultar lista".
- S12: "Quita ese subtitulo" (captura: "CARRETERA CANCÚN-AEROPUERTO · KM 11.5").
- S13: "Solo coloca ut cancun en la direccion del mapa" (captura: esquema de la sede con el letrero "PIXEL / UT CANCÚN"
  y "CARRETERA CANCÚN-AEROPUERTO · KM 11.5").
- S14: "quita Lobby y areas externas tambien sede" (captura: "EDIFICIO B · LOBBY Y ÁREAS EXTERNAS").
- S15: "'/Users/carlglzm/Downloads/FLYER TORNEO DE VIDEOJUEGOS.svg' '/Users/carlglzm/Downloads/FLYER FERIA DE
  VIDEOJUEGOS.svg' -> Necesito colocar esos flyers en la landing".
- S16: "El selector de invitados no debe estar ahi sino al lado de de las tarjetas pero debe ser sutil que no sea un
  elemento mas sino que el usuario interactue con la aplicacion y que se mueva pero indicandole al usuario que"
  (captura: "← PASE 01 DE 02 →").
- S17: "Quita el volver de la pagina" (captura: "< VOLVER" a la izquierda del logo UTG en la barra).
- S18: "Quita esos dos botones" (captura: "VER EN EL CROQUIS" y "QUIERO ASISTIR").
- S19: "Aqui se quita el uso de pwa dejalo como sitio web" (captura: "Centro de atención 4: Dudas, uso de la PWA, rifa
  y orientación.").
- S20: "quita esa informacion redundante" (captura: "18 STANDS · 5 BLOQUES · 3 ACTIVIDADES").
- S21: "Quita el numero de stand en esta card" (captura: "STAND ZT-S6 ·").
- S22: "Colocale un icono de ocultar a este boton" (captura: "OCULTAR LISTA" en el croquis).
- S23: "Esa lista debe ser interactiva, si clickeas deberia mostrartelo en el mapa" (captura: lista de stands y
  servicios del croquis).
- S24: "El search bar debe estar en el navbar y quita esa seccion solo deberia quedar el carrusel de juegos y los covers"
  (captura: encabezado de /games con "Catálogo de juegos", descripción, buscador y "18 de 18 juegos").
- S25: "El navbar no muestra el estado de donde esta posicionado el usuario" (captura: /games sin marcar "Juegos").
- S26: "Las correcciones de la landing van en / no va en \"showcase\"": `/showcase` se ve y se comporta como en
  `origin/develop`; las correcciones de la portada (S2, S4, S7-S9, S11-S16, S20-S21) solo aplican en `/`.

## Tasks

| ID | Specs | Ruta | Commit |
| --- | --- | --- | --- |
| T1 | S1 | worker | `fix(raffle): centrar...` |
| T2 | S2, S4, S8, S9, S12-S16 | worker landing | `feat(landing): flyers...` |
| T3 | S10, S11, S19-S23 | worker croquis | `fix(floor-plan): hover...` |
| T4 | S3, S18, S24 (catálogo) | worker juegos | `fix(games): coverflow...` |
| T5 | S7, S17, S24 (barra), S25 | worker barra y patrocinadores | `feat(site): buscador...` |
| T7 | S26 | worker | `fix(showcase): conservar...` |
| T6 | S5, S6 | worker torneo | `feat(tournament): información...` |

## Log

- L1: "Ire mostrando poco a poco los bugs que encuentre"
- L2: "[captura de localhost:3000/raffle] -> Debe ir centrado y con algo alusion a la rifa como icono o logo"
- L3: Segundo lote de capturas (S2-S25) con "Orquestra a 5 agentes en simultaneo". Contrato entre T4 y T5: el buscador
  de la barra envía GET /games?q=<texto> y /games filtra por `q`.
- L4: "Las correcciones de la landing van en / no va en "showcase", solamente es esa correccion y haces PRS y mandas a
  Develop"
