---
status: done
---

# SQLite foundation and public content

Objective: the landing reads its public content from SQLite through Prisma 7, with the constraints of the ER model for
those tables. Branch `feature/sqlite-foundation` (from `develop` at `ca1f8a4`). Delivery: `ask-on-risk` (forecast about
950 authored changed lines), chain strategy `stacked-to-main` against `develop` (L6): PR 1 holds T1, PR 2 holds T2 on
top of PR 1's branch. Test runner: Jest (`npm test`). Workflow: `swarm-workflow` (coder
subagent on Opus, tests first and locked).

## Specs

- S1 (scope, L1): "A, cimientos y contenido público". Only the 7 tables the landing reads today: `EventSettings`,
  `ScheduleItem`, `Stand`, `Game`, `Genre`, `GameImage` and `Sponsor`, with the columns of `odd/design/er-model.html`.
  The other 14 tables arrive with the module that uses them.
- S2 (RNF-08): "Datos en SQLite con Prisma 7 y `@prisma/adapter-better-sqlite3`, en modo WAL y con `busy_timeout`. Los
  estados se validan con `CHECK` en la migración. Las tablas y columnas se mapean a `snake_case` en plural."
  - Exact versions: `prisma@7.10.1` (dev; the npm `latest` tag is the 8.0 RC that section 8 discards),
    `@prisma/client@7.10.1` and `@prisma/adapter-better-sqlite3@7.10.1` (it brings `better-sqlite3` ^12.6.0; no direct
    `better-sqlite3` dependency).
  - Config in `prisma7.config.ts` (the Prisma 7.10+ name), schema in `prisma/schema.prisma`, migrations in
    `prisma/migrations/`, generator `prisma-client` with `output` in `generated/prisma/`.
  - The ids are TEXT UUIDs, except `event_settings`, whose `id` is the Int 1 (ER).
- S3 (RNF-01): "Toda fecha se guarda como instante UTC en ISO 8601 (SQLite no tiene `timestamptz`)". The queries keep
  returning ISO 8601 UTC strings, as the domain types do today.
- S4 (ER, `sql` rules of the 7 tables; unit cases UT-ES-03, UT-ES-01, UT-ES-04, UT-AD-16, UT-SC-01, UT-AD-11, UT-AD-12,
  UT-AD-17, UT-GA-05, UT-GA-06, UT-GA-07, UT-GA-08 and UT-SP-03, at the database level only):
  - `event_settings`: "`CHECK (id = 1)`", "`checkInCutoffAt < raffleStartsAt` and `eventStartsAt < eventEndsAt`", the
    KOF start < end pairs and the fraud thresholds "mayor que 0".
  - `schedule_items`: "se rechaza (`endsAt > startsAt`)" for "una actividad con fin antes del inicio". **Supuesto:** the
    CHECK is `ends_at >= starts_at`, because SRS 1.2 has two instants ("12:55 | Publicación del bracket de KOF" and
    "16:50 | Cierran los stands, Mario Kart y la zona de terror") that the seed stores with `endsAt = startsAt`.
  - `stands`: "`zone IN ('A','B','C','D','T')`", `number > 0`, "`UNIQUE (zone, number)`" and "Trigger: máximo 18
    stands".
  - `games`: "`standId` único", unique `slug`, genre with "`onDelete: Restrict`" and `itchUrl LIKE 'https://%'`.
  - `game_images`: "`position BETWEEN 1 AND 5` + único" per game, and one cover per game ("nunca hay dos portadas").
  - `sponsors`: "`phone GLOB '+[0-9]*'`".
  - The Spanish messages and the cover swap of UT-ES-01, UT-ES-04, UT-GA-06 and UT-GA-08 belong to the sysadmin panel
    (M7), not to this feature.
- S5 (ER "WAL y espera"): `journal_mode = WAL` plus `busy_timeout = 5000`, on the client in
  `src/shared/lib/server/prisma.ts` ("cliente con adapter better-sqlite3, WAL y busy_timeout"). One client per process,
  created on first use from `DATABASE_URL`, so a test can point it at a temporary database.
- S6 (RNF-02): "Los horarios, el cronograma, el catálogo y el bracket se leen con `"use cache"` + `cacheTag` y se
  invalidan con `updateTag` al editarlos." `getEventSettings`, `getGames`, `getScheduleItems` and `getSponsors` read
  Prisma and keep their signatures, return types, ordering, `cacheLife("hours")` and cache tags. RF-03: "Cronograma de
  actividades leído de la BD (ver M7). Sin actividades, muestra "Cronograma por anunciar"."
- S7 (seed): `prisma/seed.ts` loads the initial content from the existing constants (`INITIAL_EVENT_SETTINGS`,
  `INITIAL_SCHEDULE_ITEMS`, `INITIAL_GAMES` with their genres and stands, `INITIAL_SPONSORS`), so each value is written
  once. Running it twice leaves the same rows and does not overwrite rows that already exist.
  - The cover image gets `position: 1` (S4).
  - **Supuesto:** the 18 stands get sample `studio` and `groupCode` values, like the sample games, until the sysadmin
    creates the real ones (RF-39).
- S8 (RNF-15 and CI): "La imagen se construye en GitHub Actions; el VPS no compila."
  - `generated/prisma/` stays out of git and is generated before lint, typecheck, test and build.
  - Before `npm run build`, CI creates a temporary SQLite database, applies the migrations and runs the seed, because
    the `"use cache"` queries run during the build (`node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`).
  - `.env.example` documents `DATABASE_URL`, and the Prisma CLI loads `.env` with `loadEnvConfig` from `@next/env`
    (`node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`).
- S9 (boundaries and tooling, `AGENTS.md` "Reglas de dependencias" rule 2): only `lib/server/` and
  `@shared/lib/server/` import the Prisma client. ESLint, Oxlint, Prettier and jscpd ignore `generated/`. `.gitignore`
  covers the SQLite files (`*.db`, `*.db-wal`, `*.db-shm`). The v1 entries (`@shared/lib/prisma/*`, root `migrations/`)
  point to the new paths.
- S10 (`unit-test-cases.md` "Convenciones"): "cada archivo crea una BD SQLite temporal en un directorio de `mktemp -d`
  fuera del repositorio, aplica las migraciones y la borra al terminar. No se usa `jest.mock` para la BD". Seams under
  test (confirmed in L4), all against a temporary SQLite with the whole migration chain applied:
  1. Constraints, through the Prisma client: each S4 rule rejects the invalid row and accepts the boundary row.
  2. Client: a connection reports `journal_mode = wal` and `busy_timeout = 5000`, and dates are stored as ISO 8601 UTC
     text (S3).
  3. Queries with the seed loaded: the same domain values and ordering as today, except the ids, which become UUIDs;
     an empty table gives `[]`. `next/cache` is replaced in these tests because `cacheLife` and `cacheTag` only work
     inside Next; the database stays real.
  4. Seed: running it twice leaves the same rows and does not overwrite an existing row.
  - The existing tests (seed constants, `landing-page`, `floor-plan`) stay as regression tests.
- S11 (docs): `AGENTS.md` (stack table, `db:*` commands and the sentence "Sus datos viven en código detrás de las
  consultas de `lib/server/` hasta que exista la base de datos"), `odd/design/er-model.html` and `unit-test-cases.md`
  (the S4 assumption), and `CHANGELOG.md` only if something visible changes.

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| T1 | S1-S5, S8 (generated client), S9, S10 (seams 1-2), S11 (T1 parts) | delegated: Opus coder subagent (swarm-workflow, plan `max-20x`; Risk items 1 and 5) | done | RED L7, GREEN L8, verified L9, reviewed L10; `fc88990`, `7bea0cc`, `124b050`, `2811216` |
| T2 | S6, S7, S8 (build database and `.env.example`), S10 (seams 3-4), S11 | delegated: the T1 coder, continued (depends on T1's schema and client) | done except `.env.example` (pending with the user) | RED L11, GREEN and verification L12, review L13; `1166e49`, `a4a9957`, `6380c44`, `ed482c2` on `feature/sqlite-public-content` |
| T3 | S1-S11 | delegated: independent verifier per task (L9, L12), then the seam check | done | seam check on `ed482c2`: `npm run format`, the five gates 0, Jest 55 suites and 275 tests |

## Log

- L1 (2026-10-25, user): "la base de datos SQLite primero", then "A, cimientos y contenido público" as the answer to the
  scope question (A: foundation plus the 7 tables the landing reads; B: the full ER; C: infrastructure only).
- L2 (2026-10-25, exploration): map in the side-session notes (`sqlite-db-layer-map.md`). Checked facts:
  - npm: `prisma` latest is `8.0.0-rc.27` (prev `7.10.1`); the adapter depends on `better-sqlite3` ^12.6.0.
  - Prisma 7.10+ names the config `prisma7.config.ts` (https://www.prisma.io/docs/v7/prisma-orm/quickstart/sql-server).
    The client takes `new PrismaBetterSqlite3({ url })` (https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7).
  - Next.js 16.4.2 already keeps `better-sqlite3`, `prisma` and `@prisma/client` out of the bundle
    (`node_modules/next/dist/docs/01-app/02-guides/package-bundling.md`).
  - The seed needs a runner that resolves the `@features/*` aliases: `tsx` resolves tsconfig `paths`
    (https://tsx.is/faq) and forwards Node flags such as `--conditions` (https://tsx.is/node-enhancement).
  - Seed data that breaks the ER: two schedule instants and the cover `position: 0` (S4, S7).
  - Prisma redefines a SQLite table (create, copy, drop, rename) when a later migration alters it. That drops the
    hand-written CHECKs and triggers, so the constraint tests must run against the whole migration chain.
- L3 (2026-10-25, mirror): Engram mirror `odd/sqlite-foundation/tasks`.
- L4 (2026-10-25, user): "go", the answer to "¿Confirmas estos 4 seams o cambias alguno?" (S10).
- L5 (2026-10-25, parent): installed with `--save-exact` `@prisma/client@7.10.1`, `@prisma/adapter-better-sqlite3@7.10.1`
  and, as dev dependencies, `prisma@7.10.1`, `tsx@4.23.15` and `@next/env@16.4.2`. `better-sqlite3` resolved to 12.11.1
  (SQLite 3.53.2, so `RETURNING` works). npm 11.19 warns that 6 install scripts (`better-sqlite3`, `@prisma/engines`,
  `prisma`, `esbuild`, `@parcel/watcher`, `unrs-resolver`) are not covered by `allowScripts`; they ran (the
  `better-sqlite3` binding loads). DateTime is stored as ISO 8601 by default with the adapter
  (https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite).
- L6 (2026-10-25, user): "Stacked a develop (Recomendado)", the answer to "¿Cómo lo entrego?" (options: stacked to
  `develop`, feature branch chain, one PR with `size:exception`). PR 1 = T1 to `develop`; PR 2 = T2 on PR 1's branch,
  retargeted to `develop` after PR 1 merges.
- L7 (2026-10-25, T1 RED): the coder wrote `prisma/schema.prisma` (7 models, generator `prisma-client` with
  `moduleFormat = "cjs"` because Jest cannot load the ESM query compiler), `prisma7.config.ts` (`process.env`, since
  `env()` throws on `prisma generate` without a database), the generated migration `20261025222344_public_content`, the
  alias `@generated/*`, the helper `test-database.ts` (applies the whole migration chain with `node:sqlite`) and the
  tests of seams 1 and 2. RED: 23 tests, 17 failed (every hand-written rule rejects nothing; `prisma.test.ts` misses
  `@shared/lib/server/prisma`), 6 passed (rules Prisma declares: `@@unique`, unique `standId` and `slug`, `Restrict`,
  and the two accepted boundaries); the other 44 suites pass. Facts found: the adapter stores DateTime as
  `...000+00:00`; Prisma makes an `Int @id` `AUTOINCREMENT`, so the singleton row passes `id: 1`; a trigger `RAISE` comes
  back as P2003. Parent review: renamed two tests and set the stand factory to `studio: 4, groupCode: "103"`, re-ran
  the RED (17 failed, 6 passed) and locked the tests (`.claude/tests.lock`, hashes in the scratchpad). PR 1 must pass
  CI alone, so the generated client (S8, first bullet) moves to T1 as a `postinstall` script.
- L8 (2026-10-25, T1 GREEN): the migration has 14 named CHECKs (dates compared with `julianday`), the partial index
  `game_images_one_cover_per_game_key` and the trigger `stands_limit_check`. `getPrisma()` keeps one client on
  `globalThis`, passes better-sqlite3's `timeout: 5000` and switches each connection to WAL in a `connect()` override,
  because the adapter has no WAL option. It also rejects a missing or non-`file:` `DATABASE_URL` with a Spanish error,
  pinned by the new `prisma-env.test.ts` (the coder forced its RED by stubbing the check: 3 failed, then 3 passed).
  Scripts `postinstall`, `db:generate`, `db:migrate` and `db:deploy`; ESLint, Oxlint, Prettier and `.gitignore` point
  to `generated/` and `prisma/migrations`; `AGENTS.md` documents the stack row, the `@generated/*` alias, the commands
  and the server-only rule. Checks (coder, then parent): locked hashes unchanged; Jest 50 suites, 241 tests;
  `lint`, `lint:oxlint`, `lint:duplication`, `format:check` and `typecheck` 0; `prisma migrate deploy` on a fresh
  database applies the CHECKs, index and trigger; `prisma migrate diff --from-migrations ... --to-schema ...` prints an
  empty migration (no drift). Parent fix after review: the env test's `afterEach` stored the string `"undefined"` when
  the variable was unset; lock lifted, `restoreDatabaseUrl()` added, lock restored. Pending: `.env.example` lacks
  `DATABASE_URL`, because reading `.env*` files is denied by this session's permissions.
- L9 (2026-10-25, T1 independent verification of `c28cbf7` and `7044121` against `ca1f8a4`): S1, S2, S3, S4, S5,
  S8 (first bullet), S10 (seams 1-2) and S11 pass; S9 failed with one blocker.
  - Evidence: 65 of 70 raw-SQL probes behave as specified (the other 5 are advisories), including mixed `Z` and
    `+00:00` instants, UPDATE paths, a 19-row `INSERT ... SELECT` and a second cover by UPDATE. WAL, `busy_timeout` 5000
    and `foreign_keys` hold on a fresh file and when the first call is a `$transaction`; a writer waits for a 2 s lock
    and fails after about 5.4 s against an 8 s one. Each commit passes its gates alone; a real `npm ci` without
    `DATABASE_URL` generates the client and `npm run build` passes. No drift; lint, Oxlint and Prettier give the same
    results as the baseline for existing files; the landing and floor-plan suites keep 22 suites and 117 tests.
  - Blocker B1: `src/app/**/route.ts` could import `@generated/prisma/client` (`eslint.config.mjs` restricted route
    handlers only with `routeHandlerImports`). Correction (parent, inline): route handlers also get `prismaClient`, and
    `prismaClient` and `serverCode` now cover `@prisma/client` and `@prisma/adapter-better-sqlite3` too (advisory A6).
    Recheck: the probe import exits 1 from `src/app/api/probe/route.ts` and from a component, 0 from `lib/server/`.
    No Jest regression test: the flat config is ESM and loading it from Jest needs `--experimental-vm-modules`.
  - Also corrected: `getPrisma()` reads in stepdown order (`createPrismaClient` parses the URL), and
    `unit-test-cases.md` UT-SC-01 and the ER now state the S4 assumption `endsAt >= startsAt`.
  - Carried to T2: `server-only` is not an installed package (Next and `next/jest` provide it), so a `tsx` seed that
    imports a `lib/server` module fails; the seed must write `event_settings` with `id: 1` (the column is
    `AUTOINCREMENT`).
  - Advisories left open: `julianday` CHECKs accept non-date text (NULL passes a CHECK); `LIKE 'https://%'` ignores
    case; `GLOB '+[0-9]*'` accepts `+52abc`; deferred interactive transactions across processes fail at once with
    `SQLITE_BUSY_SNAPSHOT` (P1008), so later write transactions should start with an immediate lock; `npm audit` has
    one high-severity issue (zod via `eslint-plugin-react-hooks`) already on the baseline; `tsx` is installed in T1 but
    first used in T2.
- L10 (2026-10-25, native review, RDD on): the whole T1 range did not fit the reviewers' context
  (`lens_context_budget_exceeded`, mostly the 2,600-line lockfile). User: "Partir en candidatos (Recomendado)". The
  three unpushed commits were rebuilt with the same final tree as four: `fc88990` (dependencies and lockfile), `7bea0cc`
  (schema, migration, constraint tests, tooling; was `c28cbf7`), `124b050` (client; was `7044121`) and `2811216`
  (B1 fix; was `a2fc964`). Three candidates, each granted by the user ("Revisar este cambio") and approved, then
  acknowledged (authority burned):
  - `ca1f8a4..fc88990`, lens risk: advisories on `prebuild-install` 7.1.3 (deprecated, downloads binaries at install)
    and on keeping the dev tree out of production with `npm ci --omit=dev`.
  - `fc88990..7bea0cc`, lenses risk and reliability: advisories that mostly come from reviewing the slice alone (client
    and dependencies in the neighbouring commits), plus `node:sqlite` being experimental in the test helper and the
    literal ER phone and URL rules.
  - `7bea0cc..2811216`, lenses risk, resilience and reliability: advisories that the `DATABASE_URL` error echoes the
    whole value (a non-file URL with credentials would reach the logs), that the ESLint boundary has no automated
    check, and that no test shows a failed `getPrisma()` caches nothing.
  - The stop hook kept proposing a selectorless START against `852966b` (the merge-base with `main`, release 0.2.0),
    which would review everything `develop` gained since; it was not run.
  - PR 1 (`feature/sqlite-foundation` to `develop`) is ready; push and PR are the user's decision. Size: about 1,000
    authored lines (about 480 of tests, 130 of SQL, 110 of this document) after one honest split, so it carries a
    `size:exception` recommendation.
- L11 (2026-10-25, T2 RED, branch `feature/sqlite-public-content`): the parent installed `server-only@0.0.1` (exports
  `react-server` -> `empty.js`; installing it is optional for Next,
  `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md:584`), so the `tsx` seed can
  import `lib/server` modules. The coder wrote seam 3 (`<feature>-queries.test.ts` for the four features) and seam 4
  (`describe("seed...")` in the three existing seed tests plus `sponsors-seed.test.ts`). The interfaces are
  `seedEventSettings`, `seedScheduleItems`, `seedGames` and `seedSponsors(prisma)` in each feature's
  `lib/server/<feature>-seed.ts`, with `prisma/seed.ts` composing them. `next/cache` is stubbed with
  `jest.spyOn(jest.requireActual("next/cache"), ...)`, because Oxlint's `anti-slop/no-module-mocking` rejects `jest.mock`.
  A missing settings row must reject with a message naming `event_settings` and `npm run db:seed`. RED: 65 tests in
  12 suites, 25 failed (missing seed exports, queries still returning the constants, no rejection), 40 passed
  (constant tests, the cache calls, the empty sponsors). Parent re-ran it (same numbers) and locked the tests (hashes of
  15 server test files in the scratchpad).
- L12 (2026-10-25, T2 GREEN, verification and correction):
  - GREEN (`1166e49` seeds, `a4a9957` queries, CI and AGENTS.md): locked hashes unchanged; Jest 55 suites, 270 tests;
    the five gates 0. `npm run db:seed` twice gives 1 / 21 / 18 / 13 / 18 / 18 / 0 rows (settings, schedule, stands,
    genres, games, images, sponsors); `npm run build` with that database keeps `/` as Partial Prerender; without
    `DATABASE_URL`, or with an unseeded database, the build fails with the Spanish messages. Stands use the sample
    `studio: 0`, `groupCode: "000"` (S7 assumption).
  - Incident: the coder found a `next-server` 16.4.2 of another ut-e3 checkout on port 4317, took it for its own and
    killed it (pids 91310 and 91290). Reported to the user; the port rule in the file memory now says to prove a port
    is free with `lsof` and never to stop a process one did not start.
  - Independent verification of `10be75f..a4a9957`: no blockers. The visible text of `/` is byte-identical between the
    constants build and the seeded build (4,795 characters; only ids, key order and the cover position differ in the
    RSC payload); the CI steps run in order on a real `npm ci`; RF-03's "Cronograma por anunciar" shows with an empty
    table; a raw edit stays hidden until `cacheLife("hours")` expires, as designed.
  - Correction (parent, inline, tests first): the games seed matched rows by natural key, so after a slug or cover
    change it failed on `stand_id` or the one-cover index, and a deleted game came back. `seedGames` now fills the
    catalog only while it has no games, like the schedule and sponsors seeds. New tests: an edited catalog is left as it
    is and a deleted game stays deleted (RED: 2 failed), plus two regression pins the verifier's mutants survived
    (`getGames` orders by stand when rows are stored out of order; `getEventSettings` returns the stored value).
    `EVENT_SETTINGS_ID` lives in the seed file only, and `AGENTS.md` says `db:seed` fills empty tables only. GREEN:
    Jest 55 suites, 274 tests; the five gates 0 (`6380c44`).
  - Advisories left open: a `DATABASE_URL` that points to a missing file creates an empty database and the build fails
    with Prisma's English "table does not exist"; the build leaves `-wal`/`-shm` files (ignored); two schedule items
    with the same start and end have no defined order (none today); `prisma/seed.ts` is covered only by the CLI run; CI
    runs Node 22 while local checks used Node 24 (`node:sqlite`, `tsx --conditions`).
- L13 (2026-10-25, native review of `10be75f..6380c44`, lenses risk, resilience and reliability): user "Revisar este
  cambio"; approved and acknowledged (authority burned). Two lenses raised the same non-blocking warning: `seedGames`
  wrote game by game without a transaction, so a run that failed partway left a partial catalog that the
  `game.count() > 0` guard then kept forever. Follow-up (parent, tests first): a genre named "Pelea" with another slug
  makes the run fail at the 16th game; RED kept 15 games, and `seedGames` now writes the catalog in one interactive
  transaction, so the failed run leaves 0 games and the next run fills all 18. GREEN: Jest 55 suites, 275 tests; the
  five gates 0; `npm run db:seed` twice through the CLI still gives 18 games, 18 images, 18 stands, 13 genres, 21
  schedule items and 1 settings row. The assessment of `6380c44..dde4412` says `under_budget` (62 lines), so that slice
  stays pending until a later commit reaches the review budget.
- L14 (2026-10-26, close): outcome: S1-S11 delivered except the `.env.example` bullet of S8. PR 1
  (ikabeee/ut-e3#95, `size:exception`) merged into `develop` as `35f0434`; PR 2 (ikabeee/ut-e3#96, `size:exception`)
  merged as `9b1727d`. Pending checks: `DATABASE_URL` in `.env.example` (reading `.env*` files is denied in this
  session; the user has not answered); the `ed482c2` slice, `under_budget` for native review; the advisories in L9,
  L10, L12 and L13 (Node 22 in CI, `prebuild-install` deprecated, the `DATABASE_URL` error echoing its value, no
  automated ESLint boundary check, a missing database file giving Prisma's English error). Next step: SRS v2.3 module
  M3, visitor registration, in `odd/tasks/visitor-registration.md` on branch `feature/visitor-registration` from
  `9b1727d`.
