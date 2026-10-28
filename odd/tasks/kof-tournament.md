---
status: in-progress
---

# KOF tournament (M10)

Objective: run the 64-player single-elimination KOF tournament of `odd/requirements/srs-v2.md` (M10, RF-57 to
RF-67) in `develop`, porting the engine of the old `UTE3` folder (branch `feature/tournament-admin-test`, v1 stack)
instead of rewriting it. Branch `feature/kof-tournament` (from `develop` at `3c87c83`). Delivery: `ask-on-risk`
(forecast about 2,500 changed lines, to confirm), chain strategy `stacked-to-main` against `develop`. Test runner:
Jest (`npm test`).

## Source material (`UTE3`, read only)

`src/features/tournament/` has about 2,100 lines and 7 test files, with a double-elimination format (4 pools of 16
plus a Top 8, 126 or 127 matches) and an in-memory repository. It sits on Prisma 8 with PostgreSQL and TanStack Query.

| Piece | Plan |
| --- | --- |
| `types.ts`, `tournament-engine.ts` (`applyCommand`, pure), `tournament-queue.ts`, `tournament-rules.ts`, `tournament-view.ts`, `tournament-command-parser.ts`, `tournament-copy.ts` and their tests | Port; adapt to S1, S4 and S5 |
| `bracket-layout.ts` | Rewrite for single elimination (S1) |
| `tournament-seed.ts`, `server/tournament-repository.ts` (in memory) | Replace by the persistence of S6 |
| `api/`, `hooks/use-tournament.ts`, `tournament-query-options.ts` (TanStack Query) | Rewrite with polling, no new dependency (S7) |
| `tournament-actions.ts` (`runAdminAction`), `action-rule-error`, `admin-shell` | Rewrite on `requireSysadmin` style guards of `accounts` (S4) |
| `components/` (17), `pages/`, `docs/tournament.md` | Port and adapt to the v2 rules (copy files, aliases, tokens) |

## Specs

- S1 (RF-57): "64 jugadores, eliminación directa: 63 combates. Tableros 1 a 4 con un cuarto del bracket cada uno
  (16 jugadores, 15 combates); semifinales y final en un tablero aparte." `bracket-layout.ts` builds 63 matches:
  4 quarters of 15, 2 semifinals and the final. No pools, no losers bracket, no grand final reset.
- S2 (RF-59): "El bracket se genera una sola vez a la hora configurada (12:55), solo con los jugadores con check-in, con
  barajeo Fisher-Yates y `crypto.randomInt`; el resultado queda en la bitácora." The hour is
  `EventSettings.kofBracketGeneratesAt`; generating twice is rejected; the shuffle replaces the serpentine seeding of
  `UTE3`.
- S3 (RF-60): "Con menos de 64 jugadores con check-in, los lugares vacíos son byes, repartidos parejo entre los 4
  tableros; un bye nunca se enfrenta a otro." Byes advance their rival automatically.
- S4 (RF-62, changed by the user, 2026-10-28): the SRS says 4 KOF staff accounts, one per board. The team runs **2
  staff for the 4 boards, one per two boards**: desk 1 captures boards 1 and 2 and semifinal 1; desk 2 captures
  boards 3 and 4 and semifinal 2. The final goes to desk 1, as RF-62 gives it to staff 1 (open question D2). The KOF
  administrator (`kof_admin`) captures any match. Rejected captures name the desk that owns the match.
- S5 (RF-63 to RF-66): "No se presentó" works as a disqualification and the administrator can revert it while the
  next match has not started; the administrator freezes a match to disqualify one or both players; if both are
  disqualified the next match is a bye (a semifinal gives the other finalist the title, the final ends with no
  champion). States are `pending` -> `ready` -> `active` -> `finished`; `frozen` only by the administrator. The
  `UTE3` states `called`, `reported`, `paused`, `disputed`, the 5 minute check-in countdown, `player_report` and
  `request_judge` are not in the SRS v2 and are dropped (assumption D3).
- S6 (persistence): the tournament must survive a restart (the `UTE3` repository is in memory). Prisma 7 with
  SQLite. Proposal (decision D1): one table with the engine state as JSON plus an integer `version`, written with a
  conditional `updateMany` on the expected version so the two desks never overwrite each other, retried on conflict;
  every command also writes one `recordAudit` row in the same transaction, and the shuffle of S2 is stored there.
- S7 (RF-61, RF-64): each desk sees its quarter in near real time and the administrator sees the whole bracket. Polling
  every 3 seconds against a Route Handler (`api/tournament-route.ts` re-exported from `src/app/api/`). SSE and the
  public bracket (RF-67, RF-74) are out of scope.
- S8 (access): new guard in `accounts` for `kof_admin` and `kof_staff` (the sysadmin creates the administrator,
  roles table of the SRS); every Server Action starts with it and validates the desk of the match. The routes
  go in the `matcher` of `src/proxy.ts`.
- S9 (accounts data): the SRS and the schema must follow S4. `accounts.kof_board` (`BETWEEN 1 AND 4`) cannot hold
  two boards, so a new migration replaces it with `kof_desk` (`BETWEEN 1 AND 2`, only for `kof_staff`). The applied
  `staff_auth` migration is not edited. SRS edits: line 131 ("Staff de KOF (2, uno por dos tableros)"), RF-61, RF-62.

## Out of scope for this task

Pre-registration list and pasaporte notice (RF-58, RF-75, RF-76, RF-77), check-in by PIN, public bracket and
SSE (RF-67, RF-74), and the participant view of `UTE3`. They need M4 and a decision on who adds the players.

## Open questions

- D1: JSON state with a version (proposed, simple, matches the pure engine) or normalized tables for players and
  matches (easier to query, bigger migration and ER model change in `odd/design/er-model.html`).
- D2: who captures the final: desk 1 (RF-62 as written) or only the KOF administrator.
- D3: confirm that the dispute, judge call and countdown flows of `UTE3` are not wanted.
- D4: how do players reach the engine before M4 exists (a seed list of test players for development).

## Tasks

| ID | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- |
| T1 | S9 | parent (Sonnet 5.5) | done, commit pending | |
| T2 | S1, S3, S5 | unrouted | pending | |
| T3 | S2, S6 | unrouted | pending | |
| T4 | S4, S8 | unrouted | pending | |
| T5 | S7 | unrouted | pending | |

- T1: SRS edits (version 2.4) and migration `20261028160000_kof_desk`; update the schema, `accounts-table.test.ts`,
  `er-model.html`, `unit-test-cases.md` and `e2e-flows.md`. `accounts/lib/types.ts` needed no change (it has roles, not
  boards). Risk: item 1 (migration).
- T2: port and adapt the pure engine and its tests to single elimination, byes and the new states; a full 64-player
  simulation (63 matches) and a 40-player one with byes.
- T3: persistence (S6), bracket generation at `kofBracketGeneratesAt` with `crypto.randomInt`, audit.
- T4: role guard, `proxy.ts` matcher, Server Actions with the desk check.
- T5: `/admin/kof` page with the polling Route Handler and the ported components; copy in
  `lib/tournament-copy.ts`; `docs/tournament.md`, `CHANGELOG.md` and `FEATURE_DEPENDENCIES` in `eslint.config.mjs`.

## Log

- L1 (2026-10-28): the user asked whether the tournament had an endpoint; it does not exist in any branch of the
  repository (checked `develop`, `main`, `feature/visitor-registration` and both archives).
- L2 (2026-10-28): the user shared `C:\Users\ahudh\OneDrive\Desktop\UTE3` as the previous work and said the format is
  "eliminacion directa, y son 2 personas para los 4 tableros, 1 para 2". Evidence: `UTE3` is double elimination
  (`docs/tournament.md`), `accounts_kof_board_check` allows one board per account, and the SRS line 131 says 4
  staff.
- L3 (2026-10-28, T1): the user said "empieza con las tareas" without answering D1 to D4, so the proposals of this
  document are assumed: D1 JSON state with a version, D2 the final goes to desk 1, D3 the dispute, judge and countdown
  flows are dropped, D4 a seed list of test players. RED: `accounts-table.test.ts` failed with "Unknown argument
  `kofDesk`". GREEN: the migration redefines `accounts` (SQLite cannot change a CHECK in place) and maps boards 1 and 2
  to desk 1 and 3 and 4 to desk 2; checked on a database with accounts and a session: no foreign key violations, the
  session cascade still works. `prisma migrate diff` against the schema: no difference. 445 tests pass, `lint`,
  `lint:oxlint` and `typecheck` have no errors; `visitors-actions-hardening` still fails only on Windows (EPERM).
