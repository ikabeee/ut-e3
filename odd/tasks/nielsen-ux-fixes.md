---
status: done
---

# Nielsen heuristics: navigation, passport, raffle, catalog and the floor plan

Objective: fix the usability problems found with Jakob Nielsen's 10 heuristics on the public site, first on phones.
Branch `feature/nielsen-ux-fixes` from `develop` at `451db64`. Delivery: `single-pr` to `develop`. Test runner: Jest
(`npm test`). Coders: Muse agents (`muse exec`, `muse-spark-1.3-contributor`), never Claude (L1, L2); Claude writes the
specs and handoffs, reviews tests and diffs, runs the checks and commits.

## Specs

- S1 (back, M1): "cuando entro a una sección no puedo regresar (tiene que ser amigable con los celulares)". Every public
  page except the landing shows a "Volver" control in the shared navbar (44 px target, phone and desktop). It goes back
  in history when the previous entry belongs to this site; otherwise it opens the parent page (`/games/<slug>` →
  `/games`, anything else → `/`).
- S2 (back, M1): with the phone menu open, the Back gesture closes the menu and keeps the page (audit H3-3).
- S3 (back, M1): Back after an anchor jump (`/#floor-plan`) returns at once; smooth scrolling stays for in-page jumps
  only (audit H3-4; Next.js 16 `data-scroll-behavior="smooth"`).
- S4 (passport, M2): after registering, Back leaves the passport instead of returning to it (audit H3-1).
- S5 (passport, M2): the passport stand grid shows the game name under each stand code (audit H6-1).
- S6 (registration, M2): validation errors of the registration form are shown in Spanish from the copy file, not with
  the browser's own messages (audit H9-1).
- S7 (registration, M2): the "aviso de privacidad" link is a 44 px touch target (audit M-1).
- S8 (raffle, M3): the live raffle screen opened from `/raffle` has a visible way out to `/raffle` (audit H3-2).
- S9 (tournament, M3): while the public bracket is not published, `/tournament` tells when and where the tournament is
  and links to the KOF zone of the floor plan and to the schedule (audit H3-7).
- S10 (catalog, M4): a genre filter can be cleared with a visible "Todos" option, and Back after choosing a genre
  returns to the unfiltered catalog (audit H3-6).
- S11 (catalog, M4): on a phone the catalog title and the search are visible without scrolling past the featured hero
  (audit H1-2).
- S12 (catalog, M4): the game page's link back to the catalog is clear: an arrow and the foreground color (audit H6-2).
- S13 (floor plan, phase 2): "en el navbar el croquis debe redirigir a su propia pantalla"; "el croquis en vertical se
  ve horrible busca otra forma de presentar el croquis", with the "Event map" reference (dark map, circular markers
  with an image and the name below). The user chose variant A of the canvas ("Déjalo como la A"). The navbar entry
  "Croquis" of the full site opens `/floor-plan`, a page of its own (landing-only mode keeps the `/#floor-plan` anchor).
  Links that point at one item from other pages (game page, public bracket) open `/floor-plan#floor-plan-<id>`.
- S14 (map): the plan is a landscape event map (variant A): dark ground, the Edificio B outline, block labels, a
  circular marker per stand (game cover inside, initials when the game has no cover, empty when the stand has no game)
  with its code badge and the game name below, and a white circular marker with an icon and its name per zone. The
  selected marker becomes an accent pin. The landing section and the showcase use the same map.
- S15 (filters): chips "Todos", "Stands", "Actividades" and "Servicios" with their counts (18, 3, 6) filter the markers
  and the list; one chip is pressed at a time.
- S16 (detail): choosing a marker opens its detail (a card over the map from 1000 px, a bottom sheet below it): cover,
  kicker, title, description, the block line ("Bloque A · stand 2 de 3") and, for a stand with a game, "Ver ficha del
  juego" to its page. "Cerrar" and Escape close it. Nothing is selected on load unless the URL hash names an item.
- S17 (move): zoom in, zoom out and center buttons (44 px); drag and pinch move the map. On the `/floor-plan` page one
  finger drags it; embedded on the landing, one finger scrolls the page and two fingers move the map. Below a zoom
  threshold the markers turn into small dots without names and a hint says how to zoom.
- S18 (list and legend): "Ver como lista" shows every filtered item as a list of buttons that select it (the
  alternative to the map for keyboard and screen readers), and a legend explains the marker kinds.
- S19 (offline): `/floor-plan` is one of the public pages the service worker keeps for offline use.

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| M1 | S1, S2, S3 | Muse agent, parallel | done | `0c96b43`; RED 2 suites; GREEN site 134 |
| M2 | S4, S5, S6, S7 | Muse agent, parallel | done | `a8c6209`; RED 8; GREEN visitors+pwa 289 |
| M3 | S8, S9 | Muse agent, parallel | done | `a33e186`; RED 4; GREEN raffle+tournament 419 |
| M4 | S10, S11, S12 | Muse agent, parallel | done | `bcba99e`; RED 5; GREEN games 225 |
| P2 | S13-S19 | Muse agent (one unit: the map, its page and the links share the same files) | done | see L7 |

Process (swarm-workflow two-pack): each Muse agent first writes its tests and shows them failing (RED); Claude reviews
them against the specs and locks them; then the agent implements until GREEN without editing the reviewed tests;
Claude reviews the diff, runs the full checks once and commits each unit.

## Log

- L1 (2026-11-12, verbatim): "Lo que harás ahora es aplicar las 10 heurísticas de Jakob Nielsen en el proyecto lo
  analizarás y mandarás a varios agentes de muse en paralelo para corregir temas de UI porque cuando entro a una
  sección no puedo regresar (tiene que ser amigable con los celulares), en el navbar el croquis debe redirigir a su
  propia pantalla, el croquis en vertical se ve horrible busca otra forma de presentar el croquis un amigo me dio esta
  página para poder presentar el croquis" (image: "EVENT MAP" reference).
- L2 (verbatim): "todo lo que encuentres, mandarás agentes de muse a desarrollar NUNCA TÚ"
- L3: audit by a read-only subagent (Playwright at 390 touch and 1440): 19 findings; severity 3: H3-1, H3-2, H3-3,
  H3-4, H1-1, H3-5, H8-1. Artifacts in the session scratchpad `audit/` folder. The user approved the plan ("Aprobado"):
  phase 1 = M1-M4 in parallel; phase 2 = floor plan via canvas first.
- L4 (phase 1 result): four Muse agents wrote tests (round 1, reviewed and locked by Claude; hashes unchanged at the
  end) and implemented them (round 2). Two Muse cleaner passes: review nits (merged React imports, JSDoc, `Link` on the
  live raffle exit, CHANGELOG) and lint/format of the new test files (44 tests before and after). M2 also changed
  `src/features/pwa/__tests__/pages/offline-page.test.tsx` (outside its surface) to add `gameName: null`, required by
  the new `PassportStand` type: accepted. Seam check: format, ESLint, Oxlint 0 errors, jscpd 0, typecheck, `npm test`
  292 suites / 2114 tests. Browser (390 touch): Volver 101x56 px leads from a game page to `/games`; Back with the menu
  open closes it and stays on the page; the live raffle has its exit link; `<html data-scroll-behavior="smooth">`.
  Known limit: Volver detects same-site history with `document.referrer`, which client navigations do not update, so
  after entering the site directly it goes to the parent page instead of the previous one.
- L5: floor plan proposals on the canvas https://claude.ai/artifact/2s5Gx7EDkAY153tvM6wcvF: variant A (circular
  markers, detail card / bottom sheet) and variant B (districts, side list, card carousel), asked for by the user
  ("tráeme otra propuesta similar"). Waiting for the user's choice before P2.
- L6 (2026-11-12, verbatim): "Déjalo como la A". Phase 2 specified as S13-S19. Assumptions: the landing and the
  showcase keep a floor-plan section with the same map (landing-only mode has no `/floor-plan`); the desktop card has no
  "Cómo llegar" button (no behavior was defined for it); the zone names come from the existing copy, not the mockup.
  The map geometry is the former wide layout (`git show 451db64^:src/features/floor-plan/lib/plan-layouts.ts`) without
  the rear marketplace and the cafeteria, shifted 60 units left, which is what the canvas drew.
- L7 (phase 2 result): Muse round 1 wrote the tests (RED: 47 failed, 120 passed in 10 files); Claude reviewed and
  locked them (one fix: the compact hint text). Round 2 implemented them. Browser review (390, 360, 1440 px) found a
  200 px gap from nested section spacing, a desktop fit scale of 0.99 that made stand names overlap, a detail whose full
  cover hid the phone map and wrapping filters; round 3 fixed them plus Oxlint `max-params` (authorized signature change
  in `map-viewport` and its test), anti-slop assertions in the tests, a `PointerEvent` stub in `jest.setup.ts` (jsdom 26
  has none) and the stale `site-nav.test.tsx` href. Round 4: the zoom test aligned with `NAME_SCALE` 1.2 (a conflict in
  the spec), letter-only initials (`game-initials.ts`) and mono block labels. Seam check: format, ESLint on `src` and
  `public`, Oxlint, typecheck pass; jscpd 1 clone (stand and zone marker button shell, 11 lines); `npm test` 295 suites /
  2170 tests (one earlier run had 4 failures that did not reproduce). `npm run lint` reports 10 errors only inside the
  git-ignored `.claude/worktrees/ut-e3-next-aa04c5` checkout. Browser: no horizontal scroll, no console errors; fit
  scale 0.42 on phones (compact dots, hint) and 1.36 at 1440 px (names in one line).
  Pending: real-device check of drag and pinch (not testable in jsdom or headless screenshots); the jscpd clone.
  Next: PR of `feature/nielsen-ux-fixes` to `develop` (user's decision).
