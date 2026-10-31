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
  errors; ESLint over `src e2e` is clean.
- L5 (2026-10-29): Risk item 3 (sponsors carousel hooks moved and renamed into `src/shared/hooks`; `HOME_NAV_LINKS`
  changed). Independent verifier on `123bd62..53ba448`: PASS S1-S8, no blockers; the moved hooks are identical except
  the rename lines, sponsors tests 28/28 unchanged. Advisories: `GameCoverImage` now always emits `fetchpriority="auto"`
  (no behavior change), `landing` depends on `games`, grid `h3` without a visible `h2`. Native review of the slice
  (lenses readability and reliability, consent granted by the user): approved and acknowledged (lineage
  `review-97894c93a199d45f`). Non-blocking follow-ups: `R3-e2e-reload-race` (WARNING: G-10 reads the count after
  `page.reload` without waiting for hydration), `R3-url-write-untested` (no hook-level test of the replaceState write),
  `R2-duplicate-all-games-label` (section and list share the aria-label "Todos los juegos"), `R2-cover-order-coupling`
  (`COVER_ORDER` and `COVER_SLOTS` share an order only by comment), `R2-dup-autoplay-constant` (test hard-codes 6500).
  Outcome: feature closed. Pending: push and the PR to `develop` (user's decision). Next objective: M11 passport
  recovery or M8 sponsors page.
