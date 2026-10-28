---
status: done
---

# Visitor passport and check-in (M4)

Objective: the visitor's passport shows the stands visited and missing, the progress toward the next ticket and the
tickets earned (RF-19 to RF-23 of `odd/requirements/srs-v2.md`), on the data model that M5 (kiosk check-ins) and M9
(raffle) write to. Branch `feature/visitor-passport` (from `develop` at `3c87c83`). Delivery: `ask-on-risk`, forecast
about 700 authored changed lines, chain strategy `stacked-to-main` against `develop` (reused from `visitor-registration`).
Test runner: Jest (`npm test`), browser e2e only in the session scratchpad. Coder: parent (Claude) inline; the work is
one feature with a shared data model, so no writer unit is delegated.

## Specs

- S1 (RF-19): "El pasaporte muestra el PIN y el gamertag." Already delivered by M3 (`visitor-registration`); kept
  covered by `passport-card` tests (UT-VI-20).
- S2 (RF-20): "Lista de stands visitados y de los que faltan." Every stand of the event (18, RN-01) appears once, in
  zone and number order, with its short code (RF-11, `ZA-S1`) and whether this visitor has checked in there.
- S3 (RF-21): "Barra de progreso hacia el siguiente boleto." Progress is the visits count over the next milestone
  (9, then 18); after 18 visits it is complete.
- S4 (RF-22): "Al llegar a 9 visitas válidas se otorga un boleto y al llegar a 18 otro. Máximo 2 por visitante. Cada
  boleto es un número global autoincremental." Tickets are granted in the same transaction as the check-in that
  reaches the milestone, unique per visitor and milestone (UT-CI-16, UT-CI-17, UT-CI-18).
- S5 (RF-23): "Un check-in por visitante y stand." Enforced by the database (`UNIQUE (visitor_id, stand_id)`), so a
  second check-in at the same stand is rejected and never counts twice.
- S6 (RF-24): "Si un check-in en cola se rechaza por llegar fuera de horario, el pasaporte muestra "Tu visita a ZA-S3 no
  se registró" con el motivo. Un PIN no reconocido no identifica a nadie: solo aparece en la lista de rechazadas del
  kiosco (RF-35)." **Deferred to M5**: the rejection comes from the kiosk queue, which does not exist yet.
- S7 (RF-25): "Si el visitante gana la rifa, el pasaporte muestra "Ganaste" y, cuando se registra, el premio." **Deferred
  to M9**: the raffle does not exist yet.
- S8 (RN-01): "El evento tiene exactamente 18 stands; los boletos se otorgan a las 9 y a las 18 visitas válidas."
  The passport lists exactly the stands in the database; the milestones are 9 and 18.
- S9 (assumption, A1): M4 creates the `checkins` and `raffle_tickets` tables and the ticket rule. Check-ins are written
  by M5 (the kiosk), so M4 tests create them directly. "Válida" is every stored check-in until M5 applies RN-04 when it
  writes, and until M8 can annul one.
- S10 (assumption, A2): the ticket number is the table's autoincrement primary key. The ER model in
  `odd/design/er-model.html` shows a separate UUID `id` plus a `number` unique; SQLite autoincrements only the primary
  key, so the number is the id.
- S11 (assumption, A3): the stand code is `formatStandCode` from `@features/games/lib/stand-code` (`ZA-S1` from zone
  `A`, number 1). `visitors` declares `games` in `FEATURE_DEPENDENCIES`.

## Tasks

| ID | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- |
| T1 | S5, S9, S10 (data) | direct inline | done (RED then GREEN, 7/7) | `c159acc` |
| T2 | S4, S8 (ticket rule) | direct inline | done (RED then GREEN, 6/6) | `c159acc` |
| T3 | S2, S3 (read model and progress) | direct inline | done (RED then GREEN, 9/9) | `fa32838` |
| T4 | S1, S2, S3, S4 (passport UI) | direct inline | done (RED then GREEN, 10/10) | `fa32838` |
| T5 | S6, S7 (deferred, no code) | none | deferred to M5 and M9 | |

- T1: migration `visitor_passport` with `checkins` and `raffle_tickets`, the Prisma models and the CHECKs in the
  migration SQL (`milestone IN (9, 18)`, `status IN ('active', 'voided')`). Risk: item 1 (migration, new tables only).
- T2: `grantMilestoneTickets(transaction, visitorId)` in `lib/server/milestone-tickets.ts`, idempotent through the
  unique key. Risk: none (new code only, no existing behavior touched).
- T3: `getPassportVisits` (`lib/server/passport-visits-queries.ts`) returns the stands with their visited flag, the
  visit count and the tickets; pure `getTicketProgress` in `passport-progress.ts` does the milestone math. `getPassport`
  is unchanged (see L5).
- T4: `PassportProgress`, `PassportStands` and `PassportTickets` components, the copy in `visitors-copy.ts`, and the
  page composition. Mobile first: 360 px, no horizontal scroll, progress with `role="progressbar"`.
- Verification: one independent verifier at the feature end (T1 names item 1), per the delivery rule, plus the
  focused checks and the full suite (`npm test`, typecheck, lint, oxlint, jscpd, format) inline.

## Log

- L1 (2026-10-28, user): "Vamos a desarrollar el objetivo 3"
- L2 (2026-10-28, decision, by the parent): RF-24 and RF-25 are deferred because their data producers (M5 kiosk queue,
  M9 raffle) do not exist. Stated in S6 and S7 instead of guessing a table for them.
- L3 (2026-10-28, decision): tests first. RED for each task before its implementation; the test files of the feature
  are locked (`.claude/tests.lock`) once reviewed, until GREEN.
- L4 (2026-10-28, lock): the lock blocked two edits of test files created after it, only to fix blank lines flagged by
  the lint hook. I removed it, fixed the formatting, confirmed RED again and re-locked the reviewed set before each
  implementation. The lock is deleted at GREEN (all 96 suites green).
- L5 (2026-10-28, decisions): S6 and S7 are deferred (RF-24 needs the M5 kiosk queue, RF-25 needs the M9 raffle).
  Deviations from `odd/design/er-model.html`: the ticket number is the autoincrement primary key (A2), and the
  `visitors` feature declares `games` for the stand code (A3). `getPassport` keeps its exact shape: its existing test
  is locked, so the visits come from `getPassportVisits`.
- L6 (2026-10-28, delivery): commits `c159acc` (tickets and milestone rule, about 420 authored lines) and `fa32838`
  (read model and UI, about 400). Both are work units with their tests and the CHANGELOG line. Pushes and PRs are the
  user's call.
- L7 (2026-10-28, checks): `npm test` 96 suites, 476 tests (base 88 and 444); `format:check`, `lint:oxlint`,
  `lint:duplication` (0 clones), `typecheck` and `eslint src prisma` exit 0. `npm run lint` at the root fails on 58
  files under `.claude/worktrees/` from another session; `visitor-registration` recorded the same. Not run: browser
  e2e of `/passport` with stands and tickets, since E2E-08 needs check-ins from the M5 kiosk.
- L8 (2026-10-28, review): `gentle-ai review assess` over `3c87c83..HEAD` gives `risk: high`, `review_due: true`
  (`high_risk`). It also reports the untracked feature document, so it must be committed or declared first. The native
  review needs the user's consent for this candidate; it has not been started.
- L9 (2026-10-28, verify): one independent verifier over the whole feature (T1 names item 1, the migration). Verdict:
  no blockers. S1 to S5 and S8 pass; S6 and S7 are deferred as specified. The migration matches the schema from the
  base (`migrate diff`), a fresh database rejects milestone 10, status `won`, a second check-in per stand and a second
  ticket per milestone, and ticket numbers increase across visitors. Advisories for M5: `grantMilestoneTickets` has no
  production caller yet, so "in the check-in transaction" is proven only when M5 wires it; M5 must map the
  unique-key error of a concurrent check-in to a retry; the passport reads its three collections in separate queries;
  `main` no longer uses `justify-center`, a visual change the spec did not ask for. The verifier also reported that
  this document was modified during its run; it only read it, and no cause was found.
- L10 (2026-10-28, review decision): after this document was committed, `gentle-ai review assess` over `3c87c83..HEAD`
  gives `risk: medium` (`executable_change` on `eslint.config.mjs`), `review_due: false`, `under_budget`. The native
  review is therefore not due and no consent was requested. Delivery follows ordinary repository policy.
- L11 (2026-10-28, close): outcome: M4 delivers RF-19 to RF-23 and the ticket rule (RN-01). Commits: `c159acc`,
  `fa32838`, and the docs commit that holds this log. Pending checks, none blocking: browser e2e of `/passport` with
  stands and tickets (its data needs the M5 kiosk, or a seed); RF-24 and RF-25 deferred to M5 and M9; M5 must wire
  `grantMilestoneTickets` into the check-in transaction and map its concurrent unique-key error to a retry. Next
  specific objective: M5, the stand kiosk and survey (RF-26 to RF-36, RF-78; `odd/requirements/srs-v2.md`). It is not
  yet an entry in `odd/objectives.md`, so it needs the user's decision to be added.
- L12 (2026-10-28, native review of the M4 range `3c87c83..HEAD`, 23 files and 942 lines, chosen by the user): the
  whole-branch candidate from base `852966b` (release 0.2.0, 528 files) failed with `lens_context_budget_exceeded` and
  created no authority; the user then chose the M4 range, which got its own consent and was granted. Lenses
  `review-risk` and `review-reliability`. Both captures were admitted; the reliability closure is `approved`. The
  acknowledgement ran exactly as offered and burned lineage `review-8e48850b956b0b76`. Non-blocking advisories, by
  location and severity only (the closure does not include their text): R3-001 `milestone-tickets.ts:25-27`, R3-002
  `passport-page.tsx:47`, R3-003 `prisma/schema.prisma:115`. Operational note: the first two capture calls failed
  because zsh does not split an unquoted variable into arguments; the retry passed the same tokens literally, after
  the bound STATUS offered the same two slots again.
- L13 (2026-10-28, e2e in the repository): `npm run test:e2e` (commit `1ea9e06`, `e2e/passport.e2e.mjs`) runs the
  passport in a real browser against its own temporary database: 35 of 35 checks pass at 360, 390 and 1440 px, with no
  horizontal scroll and no console errors. Visits are inserted with SQL until the kiosk exists (M5), and the milestone
  rule mirrors `grantMilestoneTickets`. New devDependency: `playwright-core@1.64.0`, exact. The e2e is not in CI yet.
- L14 (2026-10-28, PRs): the feature goes to `develop` as five chained PRs, each at most 400 changed lines
  (additions plus deletions): `feature/visitor-passport-01-tickets` (379), `-02-read-model` (199), `-03-ui` (257),
  `-04-e2e` (397) and `-05-docs` (120). Each branch starts where the previous one ends. The commit hashes in this log
  (`c159acc` to `35505fc`) belong to `feature/visitor-passport`, the local history, which stays unchanged; the PR
  branches carry the same content in new commits. Checks per slice: 01 runs its two suites (13 tests) and typecheck;
  02 runs its two suites (9 tests) and typecheck; 03 runs the 19 `visitors` suites (71 tests) and typecheck; 04 runs
  `npm run test:e2e` (35 of 35) and eslint.
