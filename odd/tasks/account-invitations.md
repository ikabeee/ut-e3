---
status: done
---

# Account invitations and staff management

Objective: let the people who run the event get an account without a developer. The sysadmin invites the administrators
(KOF, raffle, help desk), the KOF administrator invites the staff of its two desks, and each person activates their
account from a link sent by email (RF-40, the KOF staff sign-up of the roles table, and "Las cuentas se activan con
una invitación por correo que expira a las 72 horas y se puede reenviar" of `odd/requirements/srs-v2.md`). The same
mechanism will carry the stand administrators and their staff. Branch `feature/account-invitations` (from
`feature/kof-entries`). Delivery: `ask-on-risk` (forecast about 1,800 changed lines), chain strategy `stacked-to-main`.
Test runner: Jest (`npm test`).

## Specs

- S1 (RNF-09): an invitation token is 32 random bytes in base64url. Only its SHA-256 is stored, in
  `account_invitations.token_sha256` (the property is `token`). It expires 72 hours after it is created, works once, and
  an account has at most one valid invitation: sending a new one makes the previous one useless.
- S2 (RF-40): the sysadmin invites a `kof_admin`, a `raffle_admin` or a `help_desk` account with name and email. The email
  is stored lowercase and must be new. RN-02: an email that already has a passport cannot become an account.
- S3 (roles table, UT-AC-14): the KOF administrator invites a `kof_staff` with a desk, 1 or 2. A desk has at most one staff
  member that is invited or active; replacing someone is disabling the old account and inviting the new one. A
  trigger enforces it and the action explains it.
- S4: the invitation email carries `${siteConfig.url}/activate/<token>`. The row of `email_outbox` is written in the same
  transaction as the account and the invitation, and delivered with `after()` like the passport email; the outbox
  already erases the text once it is sent, so the token does not stay there.
- S5: resending an invitation is only for accounts that are still `invited`. Disabling moves an `invited` or `active`
  account to `disabled` and deletes its sessions. Each of these writes one audit row in the same transaction.
- S6: `/activate/[token]` shows a form with a new password (at least 12 characters) and its confirmation. With a valid
  token it hashes the password with scrypt, sets the account `active`, marks the invitation used and sends the person to
  `/login`. An expired token says so and tells them to ask for another one; an unknown or used token gets one neutral
  message.
- S7: who may do what is a pure rule: the sysadmin manages `kof_admin`, `raffle_admin` and `help_desk`; the KOF
  administrator manages `kof_staff`; nobody else manages anyone. Every Server Action checks it against the target
  account, not only against the form.
- S8 (screens): the sysadmin panel gets an "Cuentas" section (invite form, list with status, resend, disable) and the
  panel of the KOF administrator gets "Staff de las mesas" (invite with desk, list, resend, disable).

## Not in this task

- Stand administrators and stand staff (they need the stands; the rule of S7 gets two more rows then).
- Recovering a forgotten staff password, and limiting the attempts on `/activate`: the tokens have 256 bits.
- Editing the name or the email of an account, and moving a staff member to the other desk.

## Tasks

| ID | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1, S3 (data) | parent (Sonnet 5.5) | done, commit pending | |
| T2 | S1, S2, S3, S4, S5, S7 | parent (Sonnet 5.5) | done, commit pending | |
| T3 | S6 | parent (Sonnet 5.5) | done, commit pending | |
| T4 | S8 | parent (Sonnet 5.5) | done, commit pending | |

- T1: migration `account_invitations` (table, index and the trigger of the desk). Risk: item 1 (migration).
- T2: `accounts/lib/invitation-rules.ts` (pure), `lib/server/invitations.ts` and the Server Actions of management.
- T3: the page and the action of `/activate/[token]`.
- T4: the two panels, copy, `docs/`, `CHANGELOG.md`.

## Log

- L1 (2026-10-28): "terminemos lo del torneo para pasar eso a los administradores del torneo, para que lo prueben, y mientras
  eso hacen eso, nosotros veamos lo del sistema para los stands". Without accounts the tournament administrators cannot
  sign in outside the development seed, so the invitations come first, then the public bracket.
- L2 (2026-10-28, T1 to T4): RED then GREEN for each. The migration `20261028220000_account_invitations` adds the table and two
  triggers for the desk (not a partial unique index, because Prisma cannot model it and the schema must keep matching;
  `prisma migrate diff` finds no difference). The error of a trigger reaches Prisma as a foreign key error (P2003), so the
  reading of its text moved to `shared/lib/server/database-errors.ts`, now shared with the tournament. Findings of the tests:
  the simultaneous invitations to one desk do reach the trigger (the checks before the transaction pass for both), and the
  accounts table rejects an email that is not trimmed and lower case, so `inviteAccount` normalizes it and does not trust
  the parser alone. `Account` has no `createdAt`, so the lists are ordered by role and name. `jscpd` found that the invite form
  repeated the pattern of the entries form; both now use `useActionForm` and `FormFeedback` of `shared`.
  Tried in Chrome on a production build with a throw-away database (already deleted): the sysadmin invited an
  administrator, the email with the link was in the outbox, the page greeted by name, a 5-character password was refused
  keeping what was typed, the valid one activated the account and led to `/login`, the same link then gave the neutral
  message, the new administrator signed in to `/admin/kof`, invited the staff of desk 1 and a second invitation to that
  desk answered "Esa mesa ya tiene un staff". At 360 and 390 px there is no horizontal scroll and the fields are at least 16 px.
  Not done: the screen was not looked at; the email was read from the outbox because the test database has no SMTP, so the
  real delivery depends on `SMTP_*` and `NEXT_PUBLIC_SITE_URL` in the deployment; resending, disabling and the expiry of a
  link were covered by tests but not clicked.
