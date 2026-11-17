# Ocultar los juegos sin arte completo

Rama `feature/hide-unready-games` desde `develop`. Un juego sin su portada vertical y su imagen horizontal no aparece en
el sitio público.

## Specs

- S1: "de los juegos que no estan listos, o sea no tienen el arte completo no se muestran".
- S2: Un juego no está listo si le falta la portada vertical o la imagen horizontal ("Sin portada vertical y
  horizontal"): con el seed se ocultan Make 'em Fall, One Mind y Sombra del Mictlán (sin imágenes) y Vaporlock (solo
  vertical).
- S3: Dónde: "En todo el sitio público": coverflow de la portada, catálogo `/games`, ficha `/games/[slug]` (404),
  `/showcase` y el panel del croquis. El stand sigue en el croquis, sin el juego.
- S4: El panel del staff (`/admin`, `/stand/game`) no es sitio público: sigue viendo todos los juegos para poder
  completarles el arte.

## Tasks

| ID | Specs | Ruta | Commit |
| --- | --- | --- | --- |
| T1 | S1-S4 | worker (gentle-ai-worker) + prueba de precache inline | `feat(games): ocultar...` |

## Log

- L1: "Ahora de los juegos que no estan listos, o sea no tienen el arte completo no se muestran"
- L2: Respuestas: "Sin portada vertical y horizontal"; "En todo el sitio público".
