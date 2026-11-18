# Correcciones que el usuario va reportando

Revisión del sitio en local (`develop` + `feature/hide-unready-games`). El usuario muestra los bugs poco a poco; cada uno
es una tarea.

## Specs

- S1: `/raffle` (ganadores de la rifa): "Debe ir centrado y con algo alusion a la rifa como icono o logo". La captura
  muestra el título "GANADORES DE LA RIFA", la descripción, el botón "VER LA TÓMBOLA EN VIVO" y "Todavía no hay
  ganadores confirmados." alineados a la izquierda de una columna angosta en escritorio.

## Tasks

| ID | Specs | Ruta | Commit |
| --- | --- | --- | --- |
| T1 | S1 | worker | `fix(raffle): centrar...` |

## Log

- L1: "Ire mostrando poco a poco los bugs que encuentre"
- L2: "[captura de localhost:3000/raffle] -> Debe ir centrado y con algo alusion a la rifa como icono o logo"
