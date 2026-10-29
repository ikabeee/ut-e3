---
status: done
---

# Game detail page (M2)

Objective: a public page per game at `/games/[slug]` (RF-09, RF-10, RF-11; issue #106). Branch
`feature/106-game-detail` from `develop` at `688e81f` (git flow, no worktree). Delivery: `single-pr` to `develop`
(forecast about 600 authored changed lines). Test runner: Jest (`npm test`) and the Playwright e2e
(`npm run test:e2e:games`).

## Specs

- S1 (RF-09): "Un juego tiene nombre, sinopsis, un género del catálogo, imágenes (máximo 5, una de portada), enlace a
  itch.io y stand." The page shows the name, synopsis, genre, stand and gallery (cover first). The 5-image, one-cover
  and one-game-per-stand rules already live in the `public_content` migration.
- S2 (RF-10): "El enlace a itch.io se muestra a partir de la hora configurada (16:30). Antes, la ficha indica la hora
  de activación sin enlace. La validación usa la hora del servidor." Cases UT-GA-01 to UT-GA-03 of
  `odd/requirements/unit-test-cases.md`: 16:29 shows the activation time without a link, 16:30 shows the link, a game
  without a link shows nothing at 18:00. The time is `event_settings.itchOpensAt`.
- S3 (RF-11): "El visitante ve el código corto del stand (`ZA-S1`)". The page never shows the full code. The admin
  view of the full code is out of scope: there is no admin game view until M6/M7.
- S4 (route, L2 and L7): "Va en su misma ruta." `/games/[slug]`; an unknown slug shows the not-found page with
  `noindex` (L7: "Aceptar 200 + noindex"): its first visit answers 200, later ones 404. The coverflow links to the
  current game's page.
- S5 (e2e, L1 and L2): "Cuales son los casos de uso que implementaremos en la aplicacion y los flujos e2e para probar
  con playwright" and "Al finalizar el desarrollo me mostraras el output de los request http y los screenshots del
  flujo e2e". Flows G-01 to G-08 as proposed in L1: catalog to page, gallery, itch before and after the time, game
  without link, 404, short code only, mobile widths 360, 390 and 1440 px.

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| T1 | S2 | inline | done | RED (module missing) -> GREEN 4/4 `itch-link.test.ts`; commit `a9f44b0` |
| T2 | S1, S3, S4 | inline | done | RED -> GREEN `games-queries`, `game-cover`, `game-detail`, `game-itch-link` tests; commit `a9f44b0` |
| T3 | S4 | inline | done | RED 2 failing -> GREEN `game-catalog.test.tsx` 11/11; commit `a9f44b0` |
| T4 | S5 | delegated (parallel writer) | done | `npm run test:e2e:games` 38/38; commit `4e99d31` |

- T1: `lib/itch-link.ts`, the itch.io link rule (RED UT-GA-01 to 03).
- T2: `getGameBySlug`, `game-detail-page.tsx`, `src/app/games/[slug]/page.tsx`, metadata and 404.
- T3: the coverflow links to the page of the current game.
- T4: `e2e/games.e2e.mjs` with `playwright-core` and its screenshots.

Route evidence: T1-T3 inline (one dependent chain). T4 delegated as a parallel unit with a disjoint surface
(`e2e/games.e2e.mjs`), launched while T2-T3 were written (L4).

## Log

- L1 (2026-10-28, user): "Arrancamos con M2 como vamos a empezar? Cuales son los casos de uso que implementaremos en la
  aplicacion y los flujos e2e para probar con playwright"
- L2 (2026-10-28, user): "1. No vamos con worktress trabajaremos en una rama que viene develop siguiendo git flow 2. Va
  en su misma ruta. Al finalizar el desarrollo me mostraras el output de los request http y los screenshots del flujo
  e2e"
- L3 (2026-10-28): decisions. The page is cached (`generateStaticParams` with the seeded slugs plus `"use cache"`);
  only the itch.io block reads the server time per request (`await connection()` inside `<Suspense>`), per
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` ("With Cache
  Components"). `playwright-core` 1.64.0 is the same version the passport e2e uses on `feature/visitor-passport`;
  that harness is not in `develop` yet, so this feature brings its own script `test:e2e:games`.
- L4 (2026-10-28, user): "Continua desarrollando pero por que no estas delegando a otros agentes?" T4 was delegated to
  one writer in parallel (disjoint surface); T1-T3 stayed inline because each depends on the previous one.
- L5 (2026-10-28): decisions found while running the e2e.
  - The coverflow opens on the middle game (the 9th of 18), so the link names the current game, not the first one.
  - The link shows "Ver ficha" with `aria-label` "Ver ficha de <name>" (WCAG 2.5.3 label in name).
  - `partialPrefetching` flags `params` read outside Suspense ("URL data"). Moving it behind Suspense made an unknown
    slug answer 200 with `noindex` (probed with curl; `not-found.md`: "After streaming starts, the status code remains
    `200`"). Kept S4's 404 with `export const instant = false` in the route file (`instant.md`).
  - The clock read moved out of the component (`readItchLink`) to satisfy `react(purity)`.
- L6 (2026-10-28): verification. `npm run format:check`, `npx eslint src e2e/games.e2e.mjs`, `npm run lint:oxlint`,
  `npm run lint:duplication` (0 clones), `npm run typecheck` and `npm test` (95 suites, 482 tests) pass. `npm run
  test:e2e:games`: 38/38, HTTP log and screenshots in `e2e/screenshots/games/` (not versioned). `npm run lint` over the
  whole repo also lints another session's worktree at `.claude/worktrees/ut-e3-next-aa04c5` (12534 problems there,
  none in this branch). Risk: item 5 (adds the `playwright-core` devDependency). Next: native review of the range
  and the PR to `develop`.
- L7 (2026-10-28, user, answering the verifier's S4 blocker): "Aceptar 200 + noindex (Recommended)". The independent
  verifier (item 5) found that under `next start` the first visit to an unknown slug answers 200: from Next 16.3 the
  App Shell for unlisted params is served before `notFound()` streams
  (`02-guides/incremental-static-regeneration-cache-components.md`), and `dynamicParams` is not available with Cache
  Components (`dynamicParams.md`). The page now reads `params` inside `<Suspense>` and `instant = false` is gone.
  Verifier verdicts: dependency PASS, S1-S3 PASS (S2 also under `next start`), S5 PASS, invariants PASS.
- L8 (2026-10-28): rechecked. `npm run test:e2e:games` 40/40 with no console errors; production build plus `curl`:
  `/games/ceniza-protocol` 200, `/games/no-existe` 200 with `noindex` and then 404 (`x-nextjs-cache: HIT`).
- L9 (2026-10-28): native review of `develop..734e5ad` (lenses risk and reliability, consent granted by the user):
  approved and acknowledged (lineage `review-5b8cca33cac035e1`, authority burned). Non-blocking follow-ups:
  `R3-e2e-itch-lead-race` (the 90 s lead of `ITCH_LEAD_MS` can run out on a slow first compile; G-03 then fails
  explicitly), `R3-e2e-npm-execpath` (running `node e2e/games.e2e.mjs` without npm leaves `npm_execpath` unset),
  `R3-e2e-server-kill` (`server.kill()` may leave child processes), `R3-itch-invalid-date-opens` (an invalid
  `itchOpensAt` would open the link; the value comes from a `DateTime` column).
  Outcome: feature closed. Pending: push and the PR to `develop` (user's decision); `getGameBySlug` needs `updateTag`
  when games become editable (M6/M7). Next objective: M11, passport recovery, or M8, the sponsors page.
