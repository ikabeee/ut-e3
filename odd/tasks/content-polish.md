# Página 404 con la identidad del evento (issue #108)

Estado: implementado en `feature/content-polish`, pendiente de revisión.

## Alcance

- La 404 general (`src/app/not-found.tsx`, `site/pages/not-found-page.tsx`) muestra un "404" grande con las capas de
  glitch del diseño (`glitch-layer-*` de `components.css`, decorativo con `aria-hidden` y detenido con
  `prefers-reduced-motion`), el kicker "Error 404", el título, "Volver al inicio" y una navegación "Sigue explorando" con
  Juegos (`/games`), Croquis (`/#floor-plan`) y Cronograma (`/#schedule`).
- `/games/<slug>` inexistente tiene su propia 404 (`src/app/games/[slug]/not-found.tsx`, `games/pages/game-not-found-page.tsx`):
  "Juego no encontrado", las mismas salidas y cinco juegos del catálogo (`RelatedGames` con "Ver todos").
- `NotFoundView` recibe las salidas por props (`NOT_FOUND_EXITS`, armadas en la page), porque `site` no conoce las rutas de
  las otras features.

| ID | Pieza | Estado |
| --- | --- | --- |
| T1 | `NotFoundView` con glitch y salidas útiles | hecho |
| T2 | 404 propia para `/games/[slug]` con juegos para seguir | hecho |
| T3 | Pruebas de las dos pages | hecho |
| T4 | E2E a 360, 390, 844 en horizontal y 1440 px (`npm run test:e2e:not-found`) | hecho |

## Decisiones

- El croquis y el cronograma siguen siendo secciones de la portada, así que las salidas apuntan a sus anclas.
- La respuesta de un slug inexistente sigue igual que en #106 (primera visita 200 con `noindex`, siguientes 404).
