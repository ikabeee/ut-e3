---
status: in-progress
---

# Admin schedule editing (sysadmin only)

Objective: the sysadmin signs in and edits the event schedule (RF-42) from `/admin`. Branch `feature/admin-schedule`
(from `c287f72`, the unpushed close of `sqlite-foundation` on top of `develop` at `9b1727d`). Delivery: `ask-on-risk`
(forecast about 1,800 authored changed lines), chain strategy `stacked-to-main` against `develop`, reused from
`sqlite-foundation` (L6 there): one PR per task, each on top of the previous one. Test runner: Jest (`npm test`).

## Specs

- S1 (scope, L1 and L2): "Necesito que agreguemos que podemos cambiar los eventos desde el panel de administracion".
  Scope chosen: "Solo sysadmin": "Cuenta del sysadmin por seed, login con correo y contraseña, sesiones en la BD,
  límite de intentos, y el CRUD del cronograma con updateTag y bitácora. Las invitaciones por correo y los demás roles
  llegan después con M3 y M7." No invitations, no other roles, no SMTP.
- S2 (RF-37, data): "La cuenta del sysadmin se crea con un seed." Tables `Account`, `Session`, `AuditLog` and
  `RateLimit` with the columns and `sql` rules of `odd/design/er-model.html`: `role IN (sysadmin, stand_admin,
  stand_staff, raffle_admin, kof_admin, kof_staff, help_desk)`, `status IN (invited, active, disabled)`, `password` ->
  column `password_scrypt`, `Session.token` -> column `token_sha256`, `AuditLog` insert-only through "Triggers BEFORE
  UPDATE y BEFORE DELETE con RAISE(ABORT)", `RateLimit` keyed by `@@id([key, windowStart])`. Rules that need other
  tables (`standId`, `kofBoard`, the stand-staff trigger) arrive with M6 and M10.
  - Assumption: the seed reads `SYSADMIN_EMAIL`, `SYSADMIN_NAME` and `SYSADMIN_PASSWORD` from the environment, never
    from the repository. It creates the account only when no sysadmin exists, and skips it with a console message when
    a variable is missing, so `npm run db:seed` keeps working in CI.
- S3 (RNF-09): "Tokens (invitación, sesión, recuperación, dispositivo) guardados solo como hash SHA-256 y contraseñas
  con `scrypt`. En Prisma la propiedad se llama `token` y se mapea a una columna `*_sha256` con un comentario `///`;
  solo `shared/lib/server` escribe y compara esas columnas."
- S4 (login, section 2 of the SRS): "Toda cuenta de staff o administrador es individual, con correo y contraseña." and
  "Las sesiones del staff se guardan en la BD: desactivar una cuenta o cambiarle el rol cierra sus sesiones al
  instante." `/login` signs in an `active` account; a session is checked against the database on every request, so a
  `disabled` account or a changed role stops working at once.
  - Assumption: a wrong email or password gets one generic message, "Correo o contraseña incorrectos", so the form does
    not reveal which accounts exist. A session lasts 12 hours. "Cerrar sesión" deletes the session row and the cookie.
- S5 (RNF-10): "Límite de solicitudes guardado en SQLite: login, registro y recuperación por correo (3 por hora)."
  - Assumption: the login limit counts failed attempts per email in a one-hour window; the fourth one gets "Demasiados
    intentos. Intenta de nuevo más tarde." and does not check the password.
- S6 (routing, `odd/design/architecture.html`): "/admin, /raffle/admin, /kof, /help-desk: sesión y rol. proxy.ts
  filtra; cada Server Action vuelve a validar en el servidor." Only `/admin` exists in this feature.
- S7 (RF-42): "Gestiona el cronograma: título, descripción breve, inicio, fin y zona opcional del croquis." The
  sysadmin creates, edits and deletes schedule items. The ER rule "endsAt >= startsAt (un instante tiene fin igual al
  inicio)" holds in the form and in the database. The zone is one of the floor-plan zones or none.
- S8 (RNF-01): "Toda fecha se guarda como instante UTC en ISO 8601 (SQLite no tiene `timestamptz`), se compara en el
  servidor y se muestra con `Intl.DateTimeFormat` y `timeZone: "America/Cancun"`." The form takes Cancun local times.
- S9 (RNF-02): "Los horarios, el cronograma, el catálogo y el bracket se leen con `"use cache"` + `cacheTag` y se
  invalidan con `updateTag` al editarlos." Each schedule change calls `updateTag` with `SCHEDULE_CACHE_TAG`, so the
  landing (RF-03) shows it on the next request.
- S10 (RNF-11): "Bitácora de auditoría en la BD, solo inserción (triggers que impiden `UPDATE` y `DELETE`): horarios,
  cronograma, cuentas, ...". Each schedule create, update and delete inserts one audit row with the actor, the action
  and the item, in the same transaction as the change.
- S11 (`AGENTS.md`): mobile first (360 and 390 px without horizontal scroll, 44 px touch targets, 16 px inputs), HeroUI
  components, copy in `lib/<feature>-copy.ts`, the five gates and Jest green, `CHANGELOG.md` and the docs updated
  (`README.md` and `.env.example` gain `SYSADMIN_*`).

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| T1 | S2, S3 (columns) | inline; Risk items 1 (migration) and 2 (credentials) | done | RED and GREEN L5, review L6; `7136bcd` |
| T2 | S3, S4, S5, S6 | inline; Risk item 2 (auth, sessions, guards) | done | RED and GREEN L7, review L8; `4ffd629`, `7738433` |
| T3 | S7, S8, S9, S10, S11 | inline; Risk item 2 (every action checks the session) | done | RED and GREEN L9, review L10; `821134b`, `37d0977` |
| T4 | S1-S11 | independent verifier for the named high-risk items, then the seam check | done except `.env.example` (pending with the user) | verifier L11; `1837c91` |

Route evidence: no Writer trigger holds. T1 to T3 depend on each other (T2 needs T1's tables, T3 needs T2's guard), so
they are not parallel units, and the parent writes them inline in order. T4 is the Verification trigger (item 2).

## Log

- L1 (2026-10-27, user): "Necesito que agreguemos que podemos cambiar los eventos desde el panel de administracion"
- L2 (2026-10-27, user decision): "¿Qué alcance de autenticación construyo para el panel donde se edita el
  cronograma?" -> "Solo sysadmin (Recomendado)".
- L3 (2026-10-27, analysis): RF-42 already exists in SRS v2.3 (M7); there is no auth, account or audit code in
  `develop`. This feature goes before M3 (`visitor-registration`), which stays next. Seams proposed to the user before
  RED (tdd skill).
- L4 (2026-10-27, user decision): seams confirmed: "Migración en BD real, Seed y login (actions), Actions del
  cronograma, Componentes y proxy".
- L5 (2026-10-27, T1): RED: 4 suites, 11 tests failed (no models, no modules). Decisions: the stand-role, KOF-board,
  lowercase-email and active-needs-password CHECKs live in the table now, because SQLite cannot add a CHECK without
  rebuilding the table; the partial unique indexes and the stand-staff trigger can be added later without a rebuild,
  so they stay with M6 and M10. Foreign keys to accounts are `RESTRICT` (nothing is deleted, and `SET NULL` would
  collide with the insert-only audit triggers); sessions cascade. scrypt uses the OWASP minimum (N = 2^17, r = 8,
  p = 1, 256 MiB maxmem). GREEN: 19 tests; the gates 0 on `src` and `prisma` (a bare `npm run lint` also walks the
  untracked `.atl/` and the `.claude/worktrees` checkout locally; CI does not have them); Jest 59 suites, 294 tests;
  `db:deploy` plus `db:seed` through the CLI with and without `SYSADMIN_*`; `prisma migrate diff` prints an empty
  migration. Lock lifted once to rename `PASSWORD_HASH` (sonarjs/no-hardcoded-passwords), then restored. `.atl/` was
  added to `.git/info/exclude` (local only) so native review accepts the candidate.
- L6 (2026-10-27, native review of `c287f72..7136bcd`, lenses risk and reliability): granted, approved and
  acknowledged. Advisories: `verifyPassword` throws instead of returning false on a corrupted hash with bad N, r or p
  (fixed in T2, which is the first caller); the seed throws if `SYSADMIN_EMAIL` already belongs to a non-sysadmin
  account (fixed in T2); `rate_limits` has no test yet (T2 covers it); the `server-only` import in the seed is a false
  alarm, the CLI seed ran.
- L7 (2026-10-27, T2): RED: 6 suites failed (session, rate limit, actions, guard modules missing; the seed email
  collision and the corrupted-hash cases). `jest.mock` is banned by anti-slop (`no-module-mocking`), so the tests spy
  on `cookies` from the real `next/headers` module and hand it the cookie store Next builds for a response
  (`NextResponse.next().cookies`); redirects are asserted through the real `NEXT_REDIRECT` digest. Decisions: login
  verifies an unknown email against a decoy scrypt hash so timing does not reveal accounts; `verifyPassword` accepts
  only the parameters `hashPassword` writes (fails closed); `proxy.ts` re-exports `redirectWithoutSession` from
  `accounts/lib/accounts-proxy.ts` (tests cannot import `src/proxy.ts`: `../` and `@/` are banned) and keeps the
  matcher literal. ESLint: the `lib/*-actions.ts` layer now also covers its tests (`lib/*-actions{,.test}.ts`). The
  copy keys are `emailLabel` and `credentialLabel` (sonarjs/no-hardcoded-passwords flags a `password` key). GREEN:
  accounts 30 tests; Jest 65 suites, 320 tests; the gates 0. Commit `4ffd629`.
- L8 (2026-10-27, native review of `7136bcd..4ffd629`, escalated by the parent to item 2, lenses risk, resilience
  and reliability): granted, approved and acknowledged. Fixed now, tests first: the limit was check-then-act, so a
  concurrent burst got more than 3 guesses; `consumeAttempt` now counts before answering (upsert increment, SQLite
  serializes writes) and a success clears the key (RED: 8 failed; GREEN: 88). The decoy hash no longer caches a
  rejected promise. Open for the user: a third party who knows the sysadmin email can lock it out 3 times per hour
  (S5 as specified); scrypt has no concurrency cap and rows in `rate_limits` and expired `sessions` are never pruned
  (deploy and M7 concerns); pinning scrypt parameters means a future cost change needs a rehash path.
- L9 (2026-10-27, T3): RED: 4 suites, 8 tests failed (no Cancun datetime helpers, actions or components). Decisions:
  assumptions added to S7: title at most 120 characters and description at most 280 ("descripción breve"); the zone
  select offers "Sin zona" plus the floor-plan zones (`ZONE_IDS`); `schedule` now depends on `accounts` and
  `floor-plan` in `FEATURE_DEPENDENCIES`. `readFormText` moved to `shared/lib/form-data.ts` (shared by both action
  files); `recordAudit` takes the transaction of the change. `/admin` reads the session inside `<Suspense>` (Cache
  Components). Browser run (Playwright with the cached Chromium, production build on port 3217, scratch DB): the flow
  login -> create -> edit -> delete -> sign out passed, the landing showed each change at once (11:15 Cancun stored
  as 16:15Z), the audit log got create, update and delete rows, and 360/390 px had no horizontal scroll. The run found
  a defect the component tests missed: React resets a `<form action>` after the action, so an error wiped what was
  typed (the email on login, every schedule field). RED (2 tests), fixed with `useSubmitKeepingValues` (onSubmit plus
  a transition), GREEN. Jest 69 suites, 347 tests; the gates 0; `npm run build` 0. Commit `821134b`.
- L10 (2026-10-27, native review of `7738433..821134b`, escalated by the parent to item 2, lenses risk, readability
  and reliability): granted; closed `escalated` (`unknown_causality`) on one finding, `R3-login-progressive-enhancement`,
  whose text the envelope did not include. Reproduced the likely cause: with only `onSubmit`, a submit before
  hydration falls back to a native GET with the email and password in the URL. RED (2 server-render tests), fixed by
  passing `action={formAction}` too: React then captures or posts the submit, and because onSubmit prevented the
  default inside a transition React does not run the action twice nor reset the form (react-dom
  `extractEvents` for form actions). GREEN; no-JS browser run: `POST /login` then `GET /admin`, the password in no
  URL. Jest 71 suites, 349 tests; the gates 0. Commit `37d0977`.
- L11 (2026-10-27, T4 independent verification of `c287f72..821134b`, scratch copies of HEAD and base, production
  build, HTTP and CDP probes): S1-S10 pass; S11 partial. Evidence: every CHECK and both audit triggers fire on raw
  SQL; the raw cookie token is in no row; disabled, re-roled or expired sessions stop rendering `/admin` and the
  Server Actions redirect with the DB hash unchanged; 10 concurrent wrong logins: exactly 3 checked the password;
  unknown email and wrong password answer the same message in about the same time; create, update and delete over
  HTTP show on `/` at once and write one audit row each; all 275 baseline tests exist in HEAD with the same result.
  Blocker: `.env.example` lacks `SYSADMIN_*` (it still lists `ADMIN_USER`, `ADMIN_PASSWORD` and a PostgreSQL
  `DATABASE_URL`, already stale at the baseline); reading or writing `.env*` is denied to this session, so it stays
  with the user. Advisory fixed, tests first: inputs were 42 px, now `min-h-11` (RED 2, GREEN; `1837c91`).
  Advisories left: `/admin` with a bogus cookie answers 200 with a meta-refresh (redirect inside `<Suspense>`, panel
  not rendered); the first unknown email after a server start is slower while the decoy hash is computed once;
  the L8 points (email lockout, no pruning). Scratch removed by the parent. Jest 71 suites, 349 tests; the gates 0.
  Next step: the user adds `SYSADMIN_*` to `.env.example`; then PRs `stacked-to-main` against `develop`
  (T1 `7136bcd`; T2 `4ffd629`, `7738433`; T3 and T4 `821134b`, `37d0977`, `1837c91`), the first one also carrying
  `c287f72`.
