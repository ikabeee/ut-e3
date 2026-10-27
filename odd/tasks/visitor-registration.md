---
status: in-progress
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
| T1 | S3, S4, S7 (data) | delegated: agy | pending | |
| T2 | S5 | delegated: agy | pending | |
| T3 | S1, S2, S4, S6, S7, S8, S10 | delegated: agy | pending | |
| T4 | S9 | delegated: agy | pending | |

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
