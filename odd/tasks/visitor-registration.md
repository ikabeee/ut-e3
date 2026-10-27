---
status: done
---

# Visitor registration (M3)

Objective: a visitor registers (RF-12 to RF-18 of `odd/requirements/srs-v2.md`), gets a 5-digit PIN, a device bound
to the passport and a copy by email over SMTP (RNF-03). Branch `feature/visitor-registration` (from `develop` at
`3fe08d7`). Delivery: `ask-on-risk` (forecast about 2,000 authored changed lines), chain strategy `stacked-to-main`
against `develop`, reused from `admin-schedule`. Test runner: Jest (`npm test`). Coder: Antigravity (`agy`), Claude
Opus specifies, reviews and commits.

## Specs

- S1 (RF-12): "El visitante se registra con nombre completo, gamertag único y correo electrónico." Gamertag and email
  are unique case-insensitively (stored normalized: trimmed, lowercase for the email). A taken gamertag answers a
  field error on the gamertag; the form keeps the typed values.
- S2 (RF-13): "El registro se abre en la fecha configurada; la Server Action también valida la fecha." The date is
  `EventSettings.registrationOpensAt`. Before it, `/register` shows when it opens and the action rejects.
- S3 (RF-14): "Al registrarse se genera su PIN de identidad: único, fijo y de 5 dígitos. Sustituye al QR." Range
  `00000`-`99999`, random from `node:crypto`, retried on collision. Storage (decided by the user, 2026-10-27,
  section 9 of the SRS): AES-256-GCM with a key in `PIN_ENCRYPTION_KEY` (column `pin_aes_gcm`), plus an HMAC-SHA-256
  of the PIN with the same key material (column `pin_hmac`, unique) for uniqueness and lookup. Only
  `src/shared/lib/server/pin-cipher.ts` encrypts, decrypts and computes the HMAC.
- S4 (RF-15): "Un correo que esté en la lista negra (integrantes de equipos, staff y administradores) no puede crear
  pasaporte. El rechazo usa un mensaje genérico ("No se pudo registrar este correo")." The list is a new
  `email_blocklist` table (team members; RF-44 manages it later, out of scope) plus every `accounts.email`. An email
  already registered gets the same generic message.
- S5 (RF-16, RNF-03): "Al registrarse, el visitante recibe por correo una copia de su pasaporte: PIN, gamertag y un
  enlace a `/passport` (no el de recuperación). El pasaporte se activa sin esperar al correo." RNF-03: "Correo por
  `smtp.gmail.com` (Google Workspace, 2,000 mensajes por usuario al día) con una bandeja de salida en la BD: envío
  inmediato con `after()`, reintentos con un intervalo iniciado en `instrumentation.ts`, backoff exponencial con
  jitter (máximo 5) y el error `4.7.28` tratado como temporal." The outbox row is written in the same transaction as
  the visitor. EC-12: "El correo queda en la bandeja de salida y se reintenta." SMTP settings come from `SMTP_*`
  environment variables; new dependency `nodemailer` (justified in the PR).
- S6 (RF-17): "Aviso de privacidad breve en el registro con enlace al aviso completo." Assumption: the full notice
  text is an open topic (SRS section 9), so `/privacy` ships with placeholder copy marked pending.
- S7 (RF-18, RNF-09): "Un pasaporte tiene un solo dispositivo activo." Registration issues a device token in an
  httpOnly cookie; only its SHA-256 is stored (`token` mapped to `token_sha256`), one row per visitor.
- S8 (RNF-10): registration is rate limited to 3 per hour per client IP with `consumeAttempt` of
  `src/shared/lib/server/rate-limit.ts`.
- S9 (assumption, RF-19 only so the email link works): `/passport` shows the PIN and the gamertag of the visitor
  bound to the device cookie; without a valid device it redirects to `/register`. The rest of M4 is out of scope.
- S10: every registration writes one audit row with `recordAudit` inside its transaction; the PIN never reaches the
  audit detail or a log.

## Tasks

| ID | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- |
| T1 | S3, S4, S7 (data) | delegated: agy | done | `6af593f` |
| T2 | S5 | delegated: agy | done | `e3e4c96` |
| T3 | S1, S2, S4, S6, S7, S8, S10 | delegated: agy | done | `e63a8c1` |
| T4 | S9 | delegated: agy | done | `76c61f2` |

- T1: migration `visitor_registration` (`visitors`, `visitor_devices`, `email_blocklist`, `email_outbox`) and
  `pin-cipher.ts`. Risk: items 1 (migration) and 2 (secret key).
- T2: `src/shared/lib/server/mailer.ts` and outbox delivery with backoff, `instrumentation.ts`. Risk: item 5
  (dependency).
- T3: feature `visitors`: `/register`, Server Action, `/privacy`.
- T4: `/passport` minimal page.

Route evidence: the user asked to delegate implementation to `agy` because Claude's token quota is running out
(L2); the parent keeps specs, test review, lock, diff review and git.

## Log

- L1 (2026-10-27): "Estamos en el repositorio de la pagina del evento de videojuegos de la universidad por lo tanto
  necesito que me digas que es lo que estabamos haciendo y que es lo que sigue realizar. Se nos esta acabando la
  cuota de tokens por lo tanto empezaras a delegar tareas al arnes de agy"
- L2 (2026-10-27): the user chose real SMTP delivery ("Listo, se entrega por SMTP") and AES-GCM for the PIN.
  `.env.example` needs `PIN_ENCRYPTION_KEY` and `SMTP_*`; this session cannot edit `.env*`, the user applies it.
- L3 (2026-10-27, T1): agy RED (2 suites fail: missing module and models), tests reviewed and locked; agy edited
  `.env.example` outside its surface, reverted with `git restore` unread. GREEN: 73 suites, 359 tests; typecheck,
  `eslint src prisma`, oxlint and jscpd 0. Parent fix: `Visitor.device` is 1:1 (`VisitorDevice?`); `prisma migrate
  diff` against the schema is empty. `npm run lint` at the root also walks `.claude/worktrees/` (another session's
  worktree), not caused by this change. `--mode auto` is not available on this agy account (default mode used).
  Commit `6af593f`.
- L4 (2026-10-27, T2): parent installed `nodemailer@10.1.0` pinned (newest release older than two weeks; ships its
  own types). agy RED then GREEN; agy reported, instead of editing, that the locked `mailer.test.ts` failed
  typecheck (`NodeJS.ProcessEnv` requires `NODE_ENV` under Next's types): the parent fixed the test (unlocked,
  edited, relocked) without widening the type. Parent simplified `src/instrumentation.ts` (type-only import, one
  SMTP transport). Outbox claims a row with a conditional `updateMany` lease so `after()` and the interval never
  send twice. Jest 75 suites, 378 tests; typecheck, `eslint src`, oxlint, jscpd 0. Commit `e3e4c96` (with the
  doc update). Risk: items 4 (concurrency) and 5 (dependency).
- L5 (2026-10-27, native review of `3fe08d7..cea45b3`, T1+T2): user granted; lenses risk, resilience, reliability;
  approved and acknowledged (`review-1c1f63b152365e0a`, authority burned). No blockers. Advisories to fix in a T2
  hardening pass: outbox keeps the PIN email body in plain text after sending (R1); `sentAt` update inside the send
  `try`, so a DB error after SMTP accepted re-sends (R4, R3); one `now` per batch and a 2-minute lease shorter than
  a slow send (R4, R3); 535 auth errors abandon every email after one try (R4); no `requireTLS` on 587 (R1);
  `SMTP_PORT` not validated (R3). Fixed by the parent: the tamper test in `pin-cipher.test.ts` was
  nondeterministic (R3); it now changes the first auth-tag character.
- L6 (2026-10-27, T3): agy RED (4 suites), then GREEN plus UI; it stopped and reported, instead of editing, that
  the locked tests broke two DB rules (`auditLog.deleteMany()` against the append-only trigger, and an event window
  violating the CHECKs). Parent fixed the tests (seed-like dates, active account with a password, `stubAfter()` in
  `beforeEach`, audit lookups already filtered by `entityId`) and one implementation bug (account emails compared
  lowercased). Parent also: the `after()` log keeps only the error message (a nodemailer error can carry the
  address), and `/register` reads the time inside `<Suspense>` after `await connection()` (dev server reported
  `Date.now()` during prerender). Dev server on :3456: `/register` and `/privacy` 200, closed text
  "El registro se abre el 13.11.2026." with the seeded date, no console errors. The full form flow was not run in a
  browser: it needs `PIN_ENCRYPTION_KEY` in `.env`, which this session cannot write; the Server Action tests cover
  it. Jest 83 suites, 409 tests; typecheck, eslint, oxlint, jscpd, prettier 0. Commit `e63a8c1`. Risk: item 2
  (rate limit keyed by the spoofable `x-forwarded-for`, same trust as the host proxy gives).
- L7 (2026-10-27): T2 hardening (L5 advisories) `551f4c8` and T4 `/passport` `76c61f2`, run by two agy workers in
  parallel on disjoint surfaces. Seam check: Jest 86 suites, 434 tests; typecheck, eslint, oxlint, jscpd, prettier 0.
  Native review of T3 (`cea45b3..8e5b7ba`, escalated item 2, lenses risk and reliability): user granted, approved,
  acknowledged (authority burned). Advisories: R1-001 the rate limit trusts a client-set `x-forwarded-for`; R1-002 no
  email ownership check, so a third party can take a victim's address (RF-16 activates the passport without waiting
  for the email, so this is by design until the SRS says otherwise); R3-001 a concurrent duplicate escapes as a
  `P2002`; R3-002 the quota is spent while closed; R3-003/R3-004 weak assertions; R3-005 unbounded PIN loop.
  R3-001, R3-002, R3-003 and R3-005 sent to an agy cleaner; R1-001 and R1-002 need a user decision.
- L8 (2026-10-27): agy cleaner fixed R3-001 (P2002 mapped to `gamertagTaken`/`blocked`, PIN collision retried),
  R3-002 (open check before the rate limit), R3-003 (exact closed message) and R3-005 (20 PIN attempts), with new
  regression suites. Jest 88 suites, 444 tests; eslint, oxlint 0. The user chose to accept R1-002 ("Aceptar el
  riesgo"): added to section 7 of `odd/requirements/srs-v2.md`. R1-001 (`x-forwarded-for`) pending a user decision.
- L9 (2026-10-27): R1-001 resolved by deployment, user answer "Servidor propio con nginx": README "Despliegue"
  documents `proxy_set_header X-Forwarded-For $remote_addr;` and the new environment variables. `.env.example`
  still needs `PIN_ENCRYPTION_KEY` and `SMTP_*`; this session cannot write `.env*`.
- L10 (2026-10-27, close): S1-S10 delivered in `6af593f`, `e3e4c96`, `e63a8c1`, `551f4c8`, `76c61f2`, `981c74e`
  (plus doc commits). Native reviews: T1+T2 and T3 approved and acknowledged; the hardening and T4 commits after
  `8e5b7ba` are not reviewed yet. Pending checks: end-to-end browser run of `/register` -> `/passport` and a real
  SMTP send, both blocked on `PIN_ENCRYPTION_KEY` and `SMTP_*` in `.env` (user); `.env.example` needs the same keys
  without values. Delivery: `stacked-to-main` against `develop` is about 3,000 authored lines; PR slices: PR 1 =
  T1+T2 (`6af593f`..`cea45b3`), PR 2 = T3 (`e63a8c1`, `8e5b7ba`), PR 3 = hardening, T4 and docs
  (`551f4c8`..HEAD). Push and PRs are the user's call. Next specific objective: M4 passport and check-in
  (`odd/tasks/visitor-passport.md`, not created).
- L11 (2026-10-27, e2e requested by the user: "realiza los tests y las pruebasss e2e me traes los outputs de las
  pruebas"): Jest 88 suites, 444 tests; typecheck, eslint, oxlint, jscpd, format:check 0. Browser e2e with
  `playwright-core@1.64.0` installed in the session scratchpad (not in the repo), the cached chrome-headless-shell,
  `next dev` on :3456 against a scratch SQLite (`db:deploy` + `db:seed`, registration opened and one blocklist email
  inserted only there), `PIN_ENCRYPTION_KEY` passed as a process variable and SMTP pointed at a closed local port:
  12/12 steps pass (360 px layout, register -> `/passport` with PIN and gamertag, encrypted PIN and lowercased
  email in the DB, one device, audit without PIN or email, outbox retry after `ECONNREFUSED`, case-insensitive
  gamertag error, generic message for blocklist, staff and repeated emails, 4th attempt per IP rejected,
  `/passport` without cookie -> `/register`, `/privacy` 200, closed window rejected by the action). The first runs
  failed on script mistakes (screenshot during streaming, CSS uppercase in `innerText`, a rerun without reset), not
  on the app. A hydration warning seen once came from Playwright's screenshot caret style: the server HTML has no
  `caret-color` and a plain load logs 0 hydration warnings. Still pending: a real SMTP send.
