# Landing redesign (light) as the new home

Objective: replace the current home with a new `landing` feature built from the Figma "NUEVA PROPUESTA" (fileKey `dBIqXx3dZJazRMletamXFj`, node `1:2`), light theme, real data.
Branch: `feature/landing-redesign` from `develop`. Delivery: `ask-on-risk`, chained PRs to `develop`. Test runner: Jest 30 + Testing Library (`npm test`).
Implementation: Sonnet writers (one per unit); Opus orchestrates, reviews diffs and runs the seam check.

## Specs

- S1. New feature `src/features/landing/` mounted at `/` (`src/app/page.tsx` renders `LandingPage` + `landingPageMetadata`). The old `src/features/home/` (code, tests) is removed in the same delivery. Same architecture as `example`/`games` (AGENTS.md: pages/components/hooks/lib/lib-server, aliases, no barrels, copy in `lib/landing-copy.ts`).
- S2. Light theme: "Es el blanco, no es el de la paleta de colores negro". Pure white background `#FFFFFF` as in Figma, scoped to the landing; the rest of the site keeps the dark UTG theme. Colors via tokens (new light tokens), never hard-coded hex in components. Verify how HeroUI v3 scopes a theme to a subtree before choosing (`.light` class / `data-theme="light"` on a wrapper) and cite the doc.
- S3. (Superseded by L12: the landing is static, no database.) Previous text: Real data, no Figma placeholders: "Eran datos estaticos, es la primero que se mostrara y es la que vamos a deployear como inicio". Figma texts like "Videojuego 1", repeated "Apertura", "24/05/12/32", "3/18", "18 equipos" are placeholders. Sources:
  - Games, count, carousel: `listGames()` (DB, `games/lib/server/games-queries.ts`) + `getGamesHydrationState()`.
  - Groups strip IDYGS 101/102/103: `StudentGroup` values (`teams/lib/types.ts`), labels in copy.
  - Date, venue, admission, calendar link: `EVENT_INFO`, `EVENT_VENUE` via `getEventContent()`. Event date per D1: "La fecha es el 20 de noviembre" -> `startsAt`/`endsAt` in `event/lib/event-info.ts:32-34` become `2026-11-20` (same hours, `-05:00`); tests asserting `EVENT_INFO`-derived output (e.g. `event/__tests__/lib/event-lib.test.ts:93`) follow. Standalone fixtures with fixed dates stay as they are.
  - Program: `EVENT_SCHEDULE`. Countdown: live, to `EVENT_INFO.startsAt`.
  - Tournaments (KOF, Smash) and Gran Rifa: new constants in `event/lib/` (they do not exist yet), read through `getEventContent()`.
  - No new Prisma models, no migrations.
- S4. Copy: Figma texts become the copy ("conservarás los mismos copys"). Literals live in `landing/lib/landing-copy.ts` (or the owning feature's copy when the text belongs to that feature); a datum is written once (date, venue, division come from their owners, never retyped).
- S5. Sections, in order, with their Figma nodes (call `get_design_context` per node, never the whole frame):
  1. Header/nav `1:30` (UTGAMES logo; INICIO, JUEGOS, DINÁMICAS, PROGRAMA, CROQUIS).
  2. Hero: SHOWCASE `1:22`, VIDE/JUEG/S `1:21`,`1:19`,`1:20` with icons `1:48`,`1:44`, DIVISIÓN `1:23`, date line `17:156`, CTAs "Ver Juegos" `1:73`-`1:75`,`1:83` and "Agendar Fecha" `1:76`, image `1:15`, dashed frames `1:69`,`1:71`.
  3. Groups strip: band `1:16`, labels `1:85`, rules `1:81`,`1:82`.
  4. Intro: title `1:90`, lead `1:93`, rule `1:89`, tagline `1:24`, banner `1:17`.
  5. Games (dark band `1:6`): title `1:55`-`1:62`, count `1:96`, cards `1:98`-`1:153` + `1:296`, arrows `1:7`,`1:11`, counter `1:97`.
  6. Tournaments and dynamics: `1:91`,`1:94`, KOF `1:3`-`1:5`,`1:106`,`1:108`,`1:110`,`1:112`,`1:130`, Smash `1:129`,`1:136`-`1:138`,`1:107`,`1:109`,`1:111`,`1:113`,`1:133`, Gran Rifa `1:155` (horizontal scroll continues off-canvas).
  7. Program: `1:92`,`1:95`, "Agendar Fecha" `1:400`, schedule card + countdown `1:399`, dashed frames `1:70`,`1:72`.
- S6. Interactions: "Ver Juegos" -> `GAMES_PATH`; "Agendar Fecha" -> `EVENT_INFO.calendarUrl` (external, `rel="noopener noreferrer"`); game cards -> `/games/[slug]`; carousel arrows + "n/total" counter; tournament cards scroll horizontally; nav anchors `#games`, `#dynamics`, `#program`.
- S7. Mobile first (AGENTS.md "Móvil primero"): no horizontal scroll at 360/390 px, 44x44 touch targets, `svh/dvh`, nothing only on hover, no preloaded heavy media on mobile. The Figma is desktop (1512 px); mobile layout is derived (stacked sections).
- S8. Static assets from Figma downloaded into `public/landing/` (no temporary Figma URLs in code); game images stay dynamic from the DB.
- S9. Quality gates: `npm run format`, `npm run lint`, `npm run typecheck`, `npm test` green; SEO metadata with `alternates.canonical: "/"`, `buildOpenGraph()`, JSON-LD kept (`buildEventStructuredData`); CHANGELOG `[Sin publicar]` line; `docs/where-to-edit.md`, `docs/architecture.md` and the AGENTS.md tree updated (home -> landing).

Open decisions (asked one at a time, see Log):
- D1. Event date: resolved (L6), 2026-11-20.
- D2. Header: resolved (L7), "Variante clara en /": the global `SiteHeader` gets a light variant when the path is `/`, with the Figma items (INICIO, JUEGOS, DINÁMICAS -> `/#dynamics`, PROGRAMA -> `/#program`, CROQUIS); other pages keep the current dark header and links. One header component.

## Tasks

| ID | Specs | Unit | Route | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| T1 | S1,S2,S3,S4,S9 | Foundation: event date to 2026-11-20 (D1), `landing` feature skeleton, route swap, `HOME_PATH` moved to `landing/lib/landing-links.ts`, `FEATURE_DEPENDENCIES` (`landing`, and `site`/`offline` -> `landing`), light theme tokens + scoped wrapper, fonts check, `landing-copy.ts` skeleton, empty `LandingPage` composing section slots, smoke test. Remove `home`. | delegated (Sonnet), blocks T2-T5 | done; review approved (lineage review-48cae6bd9bda2281, burned) | 4c6b3af (fix), 9670d9f, a32996f |
| T2 | S3,S5.2-S5.4,S6,S8 | Hero + groups strip + intro/banner | delegated (Sonnet), parallel | done (fidelity gaps) | a9ce838 |
| T3 | S3,S5.5,S6,S8 | Games band: carousel over `listGames` (TanStack hydration), counter, arrows | delegated (Sonnet), parallel | done (fidelity gaps) | a9ce838 |
| T4 | S3,S5.6,S6,S8 | Tournaments/dynamics: new event constants (KOF, Smash, Gran Rifa) + horizontal cards | delegated (Sonnet), parallel | done | a73214a, a9ce838 |
| T5 | S3,S5.7,S6,S8 | Program: schedule card from `EVENT_SCHEDULE` + live countdown hook (`use-countdown.ts`) | delegated (Sonnet), parallel | done | a9ce838 |
| T6 | S5.1,S6 | Header light variant on `/` per D2 (`site/components/site-header*.tsx`, `site/lib/navigation.ts`, `site/lib/site-copy.ts`) | delegated (Sonnet), parallel with T2-T5 | done | 3f1c4fe |
| T8a | S2,S3,S4,S5,S8 | Static + fidelity base: no DB in landing, `landing-games.ts` (Figma literal cards, `LANDING_TEAM_COUNT = 18`), LINE Seed JP, exact light tokens, vector icons from the SVG export, shared `LandingWordmark`, Figma-literal copy | delegated (Sonnet), blocks T8b-T8e | done | 830f852 |
| T8b-e | S2,S5,S7 | Per-section pixel fidelity against the reference render (header+hero+groups, intro+games, dynamics, program), screenshot diff loop at 1512 px plus mobile pass | delegated (Sonnet), parallel after T8a | done | fed3fb4, 8607c73 |
| T7 | S7,S9 | Seam check: full suite, build, mobile pass at 360/390/1440, docs + CHANGELOG | Opus inline + one verifier | pending | |

Edit surfaces (disjoint for parallel units): T2 `landing/components/landing-hero*.tsx`, `landing-groups-strip.tsx`, `landing-intro.tsx`; T3 `landing/components/landing-games*.tsx`, `landing/hooks/use-carousel*.ts`; T4 `landing/components/landing-dynamics*.tsx`, `event/lib/event-dynamics.ts`; T5 `landing/components/landing-program*.tsx`, `landing/hooks/use-countdown.ts`. Each with its `__tests__/` mirror and `public/landing/<section>/`. `landing-copy.ts` and `landing-page.tsx`: owned by the parent, merged at the end.

Risk: item 3 (removing `home` and moving `HOME_PATH` changes code that `site` and `offline` consume); T1 is its own commit.

## Log

- L1 (2026-10-21, user): "'/Users/carlglzm/Downloads/NUEVA PROPUESTA.svg'  Vamos a ser un rediseno de la landing page en una nueva pagina. Vamos armar el plan, te paso el figma para que te conectes via mcp https://www.figma.com/design/dBIqXx3dZJazRMletamXFj/LANDING-VIDEOJUEGOS?node-id=1-2&t=9Egvdm47o047pUZe-0. Esta pagina sera nueva no tendras datos estaticos y conservaras los mismos copys, sigue el mismo patron arquitectonico. Este modelo lo hara sonnet mismo tu orquestras"
- L2 (2026-10-21, user): "Es el blanco, no es el de la paleta de colores negro"
- L3 (2026-10-21, user, on "sin datos estáticos"): "Eran datos estaticos, es la primero que se mostrara y es la que vamos a deployear como inicio"
- L4 (2026-10-21, user): route decision "Feature nueva en /" — new `src/features/landing/`, old `home` removed in the same PR.
- L5 (2026-10-21, exploration): none of the Figma copy exists in code; no countdown, no tournaments data, no `.ics`; only games/teams are DB-backed; `getEventContent()` (`event/lib/event-content.ts:18`) is the single read point for event constants; `home` is consumed by `site` and `offline` (`eslint.config.mjs:25-36`); `home-page.tsx:17` imports `visitors` (check lint exemption for pages). Figma has no variables (`get_variable_defs` empty): colors/typography come from `get_design_context` per node.
- L6 (2026-10-21, user): "Quiero el mirror. La fecha es el 20 de noviembre"
- L7 (2026-10-21, user): header decision "Variante clara en / (Recommended)".
- L8 (2026-10-21, T1): HEAD had a stray `x` in `games/api/games-contract.ts:108` (commit "idk xd") breaking typecheck and 6 suites; fixed in its own commit 4c6b3af. T1 committed 9670d9f; README/data-sources home references fixed by parent. Native review (risk/readability/reliability) approved, 12 advisory findings: stale date comment fixed (a32996f); empty slots, unused copy and dead hydration resolve with T2-T5 wiring; zoneId guard lost with `resolveScheduleZones` -> restored as a test in T5; `HOME_PATH` naming and `teams` allowance kept (teams needed by T2 groups strip). Delivery note: `/` renders empty slots until T2-T5 are wired, so T1 must not reach `develop` alone (one PR, or chained PRs merged together).
- L9 (2026-10-21): T2-T6 launched in parallel (Sonnet). Parent owns `landing-page.tsx` wiring; writers edit only their own block of `landing-copy.ts`.
- L10 (2026-10-21): Figma MCP hit the Starter-plan call limit mid-run; writers fell back to the full SVG export (embedded PNGs extracted by the parent and mapped by position). Export background is #FEFDFD; Figma font is LINE Seed JP (not loaded).
- L11 (2026-10-21): all writers returned inside their surfaces. Parent wired `landing-page.tsx`, restored `resolveScheduleZones` in `landing/lib/` (with its original tests; `landing` now depends on `floor-plan`, graph acyclic) instead of T5's eslint-disabled test, converted ~10 MB of PNG to ~650 KB WebP, fixed the page smoke test (`renderWithGames`). Checks: format ok, lint ok, typecheck ok, jest 119 suites / 531 tests ok (2 failures before the smoke-test fix). Commits 3f1c4fe, a73214a, a9ce838.
- Open fidelity gaps (T8 candidate): VIDE+JUEG(o)S wordmark is CSS/text approximations in hero, games and raffle (should be one shared component); no tokens for #0D0D0D, #F6F6F6, #F6FD79, #EF6762, #737373 (writers used foreground/danger/surface); LINE Seed JP not loaded; CTA icons missing; groups strip not full-bleed and without rules; header logo not the Figma cube mark; layouts not checked in a browser.
- Blocker for T7: Docker daemon not running, so no DB for `npm run build` / visual pass.
- L12 (2026-10-21, user): "Esa landing debe ser estatica, no necesita de una base de datos. Esa landing tiene que quedar FIEL al figma" -> S3 rewritten: no Prisma/TanStack/DB in the landing; all content from static TS constants. S2/S5 tightened: pixel fidelity to the Figma (font LINE Seed JP, exact colors, wordmark vectors from the SVG export). T3 (games carousel over DB) reopened.
- L13 (2026-10-21, user, game cards): "Exacto al Figma" -> 3 literal cards (Videojuego 1-3, Mario/Clash/Hollow Knight art, "Plataformas", counter "3/18").
- L14 (2026-10-21): Figma MCP exhausted; fidelity source = design.svg export rendered with the cached Playwright chrome-headless-shell at 1512x5786 (scratchpad ref/), node map with coordinates and literal texts in scratchpad ref/figma-nodes.md. Schedule rows keep the static `EVENT_SCHEDULE` (Figma rows are one entry repeated: Apertura / Entrada).
- L15 (2026-10-21): T8a-T8e done. Parent integration fixes: intro top spacing (+97 px) and dynamics top spacing (+121 px) so section tops match the reference (games band 2416 = 2416, dynamics title 3808 = 3808, program title 5104 vs 5110); program subtitle capitalized. Checks: format, lint, typecheck ok; jest 122 suites / 546 tests ok. Mobile 390 checked (stacked, no horizontal scroll). Native assess since a32996f: medium, review_due false (under_budget). Docs: CHANGELOG, where-to-edit (2332b3e).
- Remaining: footer on `/` (Figma has none; asked, unanswered); light header is sticky and 141 px tall at 1512; program card notch stretches ~7% with 9 real rows; raffle art 1:178 missing from the export (off-canvas); `npm run build` still needs PostgreSQL for other routes (/games etc.); push/PR are the user's decision.
- L16 (2026-10-21, user): "Oculta el footer, y en otra sesion redisenaremos la aplicacion con este nuevo estilo. Al terminar manda PR hacia develop" -> footer hidden on `/` (d2b3d08); nav hover coral #F36C69 underline without glitch (ba9bff6). Checks: lint, typecheck ok; jest 123 suites / 551 tests ok. Branch pushed; PR #74 to develop: https://github.com/ikabeee/ut-e3/pull/74. Sticky header question left unanswered (kept sticky). Next session: redesign the rest of the app with this style.
