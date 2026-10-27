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
| T1 | S2, S3 (columns) | inline; Risk items 1 (migration) and 2 (credentials) | pending | |
| T2 | S3, S4, S5, S6 | inline; Risk item 2 (auth, sessions, guards) | pending | |
| T3 | S7, S8, S9, S10, S11 | inline; Risk item 2 (every action checks the session) | pending | |
| T4 | S1-S11 | independent verifier for the named high-risk items, then the seam check | pending | |

Route evidence: no Writer trigger holds. T1 to T3 depend on each other (T2 needs T1's tables, T3 needs T2's guard), so
they are not parallel units, and the parent writes them inline in order. T4 is the Verification trigger (item 2).

## Log

- L1 (2026-10-27, user): "Necesito que agreguemos que podemos cambiar los eventos desde el panel de administracion"
- L2 (2026-10-27, user decision): "¿Qué alcance de autenticación construyo para el panel donde se edita el
  cronograma?" -> "Solo sysadmin (Recomendado)".
- L3 (2026-10-27, analysis): RF-42 already exists in SRS v2.3 (M7); there is no auth, account or audit code in
  `develop`. This feature goes before M3 (`visitor-registration`), which stays next. Seams proposed to the user before
  RED (tdd skill).
