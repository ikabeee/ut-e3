---
status: done
---

# Sponsors page (M8)

Objective: a public `/sponsors` page with one card per sponsor (RF-47, RF-48 of `odd/requirements/srs-v2.md`), reusing
the `Sponsor` data, `getSponsors()` and `formatPhone()` that the landing carousel already uses. Branch
`feature/sponsors-page` from `develop` at `477ef7d`. Delivery: `single-pr` to `develop` (forecast about 300 authored
changed lines). Test runner: Jest (`npm test`).

## Specs

- S1 (RF-47): "Página con tarjetas de los patrocinadores: logo, nombre, servicios, sitio web y teléfono." One card per
  sponsor in `position` order, read with `getSponsors()`.
- S2 (RF-48): "El teléfono es un enlace `tel:` mostrado con formato legible; el sitio abre en pestaña nueva con
  `rel="noopener noreferrer"`."
- S3 (route): `src/app/sponsors/page.tsx` only re-exports the page and its metadata, with `alternates.canonical`
  (AGENTS.md, "Agregar una feature nueva"). Assumption: the route is declared in `lib/sponsors-links.ts`.
- S5 (example seed): "Agrega un seed en lo que nos confirman los sponsors" (L5). Assumption: six fictitious
  sponsors with `example.com` sites, `+52 998 000 000N` phones and "LOGO DE EJEMPLO" SVGs in `public/sponsors/`.
- S6 (e2e): "Aplica el e2e con los screenshots" (L7). `npm run test:e2e:sponsors` (`e2e/sponsors.e2e.mjs`, same
  harness as `e2e/games.e2e.mjs`): SP-01 cards in position order, canonical URL; SP-02 logos load; SP-03 website in a
  new tab with `noopener noreferrer`; SP-04 `tel:` link with a readable phone; SP-05 landing carousel; SP-06 no
  horizontal scroll and 44 px targets at 360/390/844/1440 px. Screenshots in `e2e/screenshots/sponsors/` (ignored).
- S7 (navbar): "Agrega el enlace en la navbar y manda el PR" (L9). "Patrocinadores" -> `/sponsors` in the landing
  navbar and in `HOME_NAV_LINKS` (`/games`, `/games/[slug]`, `/sponsors`, 404); `landing` now depends on `sponsors` in
  `FEATURE_DEPENDENCIES`. E2E SP-07.
- S4 (style): "Like the carousel" (L3): logo on `bg-surface`, `type-wide` name, services in `text-copy`, the
  "Visitar sitio" `ActionLink` and the `tel:` link in `type-mono` (shared with the carousel through
  `SponsorContactLinks`).

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| T1 | S1, S2 | inline | done | RED (module missing) then GREEN, `47567ae` |
| T2 | S3 | inline | done | `47567ae` |
| T4 | S5 | inline | done | RED (no example sponsors) then GREEN, `f64f922` |
| T5 | S6 | inline | done | 28/28 checks, `80f7842` |
| T6 | S7 | inline | done | RED (2 tests) then GREEN, `453a990` |
| T3 | S4 | inline | done | screenshots at 360/390/844/1440, `47567ae` |

## Log

- L1 (2026-10-29, user): "M8, lo haremos en otra sesion"
- L2 (2026-10-29): new session started from the handoff. `feature/visitor-passport`'s `odd/tasks/visitor-passport.md`
  brought to this branch so objective 3 stops reporting `unknown`. PR #110 was already merged into `develop`
  (`477ef7d`). No sponsors page exists in `archive/develop-v1`, so there is no design to port; asked the user for the
  card style before writing UI.
- L3 (2026-10-29, user): card style "Like the carousel".
- L4 (2026-10-29): delivered in `47567ae` (docs and index in `27680ab`). Checks: format:check, ESLint on `src`
  (the repo-wide run also lints the git-ignored `.claude/worktrees/`, which fails outside this change), oxlint, jscpd
  (0 clones), typecheck and Jest (109 suites, 556 tests) pass. Browser check against a scratchpad copy of `dev.db`
  with 3 preview sponsors: no horizontal scroll and every link at least 44 px tall at 360, 390, 844 and 1440 px; the
  `h1` uses `type-wide` with a 24 px minimum because `type-giant` (30 px minimum) overflowed at 360 px.
  Pending: `INITIAL_SPONSORS` is empty, so `/sponsors` shows only its title until real sponsors are loaded; the navbar
  has no "Patrocinadores" link yet (needs `landing -> sponsors` in `FEATURE_DEPENDENCIES`); PR to `develop` not opened.
- L5 (2026-10-29, user): "Agrega un seed en lo que nos confirman los sponsors"
- L6 (2026-10-29): `INITIAL_SPONSORS` now holds six example sponsors. `sponsors-queries.test.ts` compared the seeded rows
  with `INITIAL_SPONSORS` including `id`, which only passed while the list was empty (the database assigns UUIDs); it now
  matches `id` with `expect.any(String)`. Seeded a scratchpad copy of `dev.db`: 6 cards on `/sponsors` without
  overflow at 360/390/844/1440 px, and the landing carousel shows them. Replacing them with the real sponsors needs an
  edit to `INITIAL_SPONSORS` plus emptying the `sponsors` table, because the seed only fills an empty table.
- L7 (2026-10-29, user): "Aplica el e2e con los screenshots"
- L8 (2026-10-29): `npm run test:e2e:sponsors` passes 28/28 checks twice (port 3471, own temp database seeded with
  the example sponsors; expectations read from that database). Screenshots: `01-cards`, `02-links`,
  `03-landing-carousel`, `04-viewports` (360, 390, 844 landscape, 1440) plus `http.log`.
- L9 (2026-10-29, user): "Agrega el enlace en la navbar y manda el PR"
- L10 (2026-10-29): navbar link added (landing and `HOME_NAV_LINKS`). G-01 of the games e2e asserted the exact list
  "Inicio,Juegos" and now expects "Inicio,Juegos,Patrocinadores" (74/74). Sponsors e2e 31/31 twice: SP-07 added;
  the touch-target check now counts the `::before` hit area (as the games e2e does), and SP-05 emulates reduced
  motion because autoplay (6.5 s) could advance the carousel before a cold compile of `/` finished (seen once:
  "heading=Nodo Caribe"). All repo checks pass (Jest 109 suites / 560 tests). Advisory: at 360 px the landing navbar
  shows "PATROCI..." cut off; the link list scrolls sideways, the page does not.
