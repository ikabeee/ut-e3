---
status: done
---

# Games catalog (M2)

Objective: an Epic-style public catalog at `/games`, ported from `archive/develop-v1` with the current data only.
Branch `feature/games-catalog` from `develop` at `123bd62` (git flow, no worktree). Delivery: `single-pr` to `develop`
(forecast about 900 authored changed lines; ask-on-risk if it grows). Test runner: Jest (`npm test`) and the Playwright
e2e (`npm run test:e2e:games`).

## Specs

User-approved proposal (L2), quoted verbatim per item:

- S1 (route): "Para el catálogo /games propongo portar el del archivo (archive/develop-v1) usando solo los datos
  actuales". `/games` with its metadata and `alternates.canonical`.
- S2 (featured): "(1) carrusel de destacados arriba con imagen grande, título, miniaturas, flechas, avance automático y
  swipe". Assumption (as in the archive): every game is featured, in stand order; autoplay pauses with the mouse over,
  a finger down, focus inside or reduced motion.
- S3 (genres): "(2) carrusel de géneros con 3 portadas que filtra". Selecting the active genre clears it (archive).
- S4 (search): "(3) buscador + contador". Matches name, genre, stand and synopsis, ignoring accents and case
  (archive, without `team`, which the schema lacks).
- S5 (grid and empty state): "(4) cuadrícula de portadas 3:4 con nombre y 'género · stand' que lleva a la ficha; (5)
  estado vacío con 'Ver todos los juegos'."
- S6 (URL): "El género queda en la URL (?genre=<slug>) y la etiqueta de género de la ficha enlaza ahí."
- S7 (navigation): "'Juegos' del navbar (portada, ficha y 404) pasa de #games a /games, igual que 'Todos los juegos' y
  'Ver todos' de la ficha; el coverflow de la portada se queda."
- S8 (tests): "Seams de prueba: unitarias de lib (filtrar y resumir géneros), componentes con Testing Library
  (buscador, filtro, vacío, carrusel con timers falsos), la page, y el e2e de games."

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| T1 | S3, S4, S6 | inline | done | `067bbec`; RED (missing modules) then GREEN 10/10 |
| T2 | S1, S5, S6, S7 | inline | done | `067bbec`; RED 4 nav tests + browser/page tests, GREEN |
| T3 | S2 | inline | done | `39e81a7`; RED (missing module) then GREEN 7/7 |
| T4 | S8 | inline | done | `39e81a7`; e2e G-09 to G-13, 74/74 |

Route evidence: no Writer trigger (units depend on each other; fresh session, no context backstop).

## Log

- L1 (2026-10-29, user): "Continuemos a desarrollar el catalogo estilo epic games"
- L2 (2026-10-29, user): approved the proposal quoted in S1-S8 ("Así (Recommended)").
- L3 (2026-10-29): T1 and T2 in `067bbec` (750 lines; assess `medium`, `under_budget`). Decisions: the genre lives
  in `?genre=<slug>` through `useSearchParams` plus `window.history.replaceState` (Next docs
  `01-getting-started/04-linking-and-navigating.md` "Native History API"); `UrlGamesBrowser` wraps it in a client
  `Suspense` whose fallback is the unfiltered catalog, so `/games` still prerenders (`use-search-params.md`
  "Prerendering"). `GamesBrowser` is presentational (genre by props), tested with a state harness; the page test
  provides `SearchParamsContext` because `jest.mock` is banned. `landing` now depends on `games` (`GAMES_PATH` in
  `HOME_NAV_LINKS`).
- L4 (2026-10-29): T3 and T4. The sponsors carousel hooks moved to `src/shared/hooks` (`use-autoplay-carousel`,
  `use-autoplay-progress`, `use-active-thumb-scroll`) and both carousels use them; sponsors tests 28/28 unchanged.
  Hero slides mount only the current one and its neighbors; the first cover loads eagerly (`image.md`: `priority` is
  deprecated). e2e: G-10 first failed 2 checks because the grid re-renders a moment after `waitForURL` (Next syncs
  `useSearchParams` in a transition); the check now waits for the card count. Checks: format, ESLint (src, e2e),
  Oxlint, typecheck, jscpd 0 clones, `npm test` 108 suites / 550 tests (two earlier runs hit scrypt timeouts in the
  auth suites under load average ~111; they pass alone, 37/37), `npm run test:e2e:games` 74/74, no console errors.
  Note: `npm run lint` also walks `.claude/worktrees/ut-e3-next-aa04c5` (another session's worktree) and reports its
  errors; ESLint over `src e2e` is clean. Pending: native review of the slice, push and the PR to `develop`.
