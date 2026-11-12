---
status: in-progress
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
  with an image and the name below). Designed on the canvas first; implemented after the user approves it.

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| M1 | S1, S2, S3 | Muse agent, parallel | done | `0c96b43`; RED 2 suites; GREEN site 134 |
| M2 | S4, S5, S6, S7 | Muse agent, parallel | done | `a8c6209`; RED 8; GREEN visitors+pwa 289 |
| M3 | S8, S9 | Muse agent, parallel | done | `a33e186`; RED 4; GREEN raffle+tournament 419 |
| M4 | S10, S11, S12 | Muse agent, parallel | done | `bcba99e`; RED 5; GREEN games 225 |
| P2 | S13 | canvas proposal by Claude, then a Muse agent | pending | |

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
