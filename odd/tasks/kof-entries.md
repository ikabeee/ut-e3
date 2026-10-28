`---
`status: done
`---
`
`# KOF entries and check-in (M10)
`
`Objective: make the KOF tournament usable on the day of the event. Today the bracket can only be generated with the fake
`players of `npm run db:seed:kof`. This task adds the pre-registration list, the on-site sign-up, the check-in by PIN, the
`closing of the check-in and the button that generates the bracket from the players that checked in (RF-58, RF-59, RF-75
`to RF-77 of `odd/requirements/srs-v2.md`). Branch `feature/kof-entries` (from `feature/kof-tournament`). Delivery:
``ask-on-risk` (forecast about 1,800 changed lines), chain strategy `stacked-to-main`. Test runner: Jest (`npm test`).
`
`## Specs
`
`- S1 (RF-58, RF-77): "El administrador de KOF agrega a la lista a los visitantes registrados que quieren jugar, con un
`  cupo de 50 [...]. Una inscripción por visitante; cupo total de 64 ("Torneo lleno")." The administrator adds a
`  visitor by gamertag (case-insensitive). The channel follows the clock: from `kofRegistrationOpensAt` until
`  `kofOnsiteSignupStartsAt` it is `pre` (status `registered`, at most 50); from `kofOnsiteSignupStartsAt` until
`  `kofOnsiteSignupEndsAt` it is `onsite` and is born `checked_in` with `checkedInAt = now`; before the first or after the
`  second it is rejected (UT-TO-25, UT-TO-26, UT-TO-36, UT-TO-37, UT-TO-39). The 64 places count the entries that are not
`  `no_show`, so the places of the pre-registered who have not checked in stay reserved until 12:45 (UT-TO-40).
`- S2 (RF-75): "El administrador de KOF hace el check-in tecleando el PIN del jugador." Only inside
`  `kofCheckInStartsAt` to `kofCheckInEndsAt`; the PIN is looked up with `hashPinForLookup`. A PIN that belongs to nobody, to a
`  visitor without an entry or in a wrong format answers the same message and creates nothing (UT-TO-29 to UT-TO-32).
`- S3 (RF-76): at `kofCheckInEndsAt` the entries that are still `registered` become `no_show` and never change again
`  (UT-TO-33, UT-TO-34, UT-TO-35). The closing is idempotent and runs when the administrator loads the panel, adds an
`  entry, checks in or generates the bracket, so no timer is needed.
`- S4 (RF-59, RF-60): "El bracket se genera [...] solo con los jugadores con check-in." The generate button closes the
`  check-in if it is due and calls \`generateTournament\` with the \`checked_in\` entries (player id = visitor id, tag =
`  gamertag). The hour and the 32 to 64 players are already enforced there (UT-TO-41, UT-TO-42).
`- S5 (data): table \`tournament_entries\` with the CHECKs and triggers of the ER model: \`channel\` in (\`pre\`, \`onsite\`),
`  \`status\` in (\`registered\`, \`checked_in\`, \`no_show\`), \`checked_in_at\` if and only if \`checked_in\`, an \`onsite\` entry is
`  always \`checked_in\`, \`visitor_id\` unique, a \`no_show\` row cannot change (trigger), at most 64 rows that are not
`  \`no_show\` and at most 50 \`pre\` (triggers, the safety net of S1 under concurrency, UT-TO-02).
`- S6 (roles): only \`kof_admin\` adds, checks in and generates (UT-TO-27); a \`kof_staff\` is rejected by every action.
`- S7 (RF-75, UT-TO-43): the passport of a registered visitor says that they are in the tournament and, while they have
`  not checked in, that on the event day they must do it in the KOF area between the configured hours.
`- S8 (screen): the administrator sees, in \`/admin/kof\`, the counts (registered, pre-registered of 50, places of 64,
`  checked in), the list with each status, a form to add by gamertag, a form to check in by PIN and the generate button.
`  The staff of the desks do not see it.
`
`## Not in this task
`
`- UT-TO-38: the administrator registering on the spot a visitor that has no passport. Registration binds a device to
`  the passport (RF-18), and registering for someone else needs its own flow. The visitor registers on their phone (M3)
`  and the administrator adds them by gamertag.
`- The \`slot\` column of the ER model: the shuffled order is kept in \`tournament.players\` and in the audit log.
`- A waiting list for the places of \`no_show\` (UT-TO-44: they stay empty and become byes).
`
`## Tasks
`
`| ID | Specs | Route | Status | Commit |
`| --- | --- | --- | --- | --- |
`| T1 | S5 | parent (Sonnet 5.5) | done, commit pending | |
`| T2 | S1, S2, S3, S4 | parent (Sonnet 5.5) | done, commit pending | |
`| T3 | S6, S8 | parent (Sonnet 5.5) | done, commit pending | |
`| T4 | S7 | parent (Sonnet 5.5) | done, commit pending | |
`
`- T1: migration \`tournament_entries\` and the Prisma model. Risk: item 1 (migration).
`- T2: \`lib/server/entries-queries.ts\` and \`lib/server/entries-mutations.ts\` (\`addEntry\`, \`checkInEntry\`,
`  \`closeCheckInIfDue\`, \`generateFromEntries\`).
`- T3: Server Actions, the entries panel and the generate button in \`/admin/kof\`, copy, \`docs/tournament.md\`,
`  \`CHANGELOG.md\` and \`FEATURE_DEPENDENCIES\`.
`- T4: the notice in \`/passport\`, composed in the page of \`visitors\`.
`
`## Log
`
`- L1 (2026-10-28): "no, solo del torneo, lo demas aun tenemos hasta el 15 de noviembre aprox". The user asked to
`  keep working only on the tournament after the stands, the raffle and the rest were listed. Without entries the
`  tournament cannot run on the event day, so this is the next piece.
- L2 (2026-10-28, T1 and T2): RED for each, then GREEN. The migration `20261028200000_tournament_entries` has the CHECKs
  and the three triggers of the ER model and `prisma migrate diff` finds no difference. A finding of the tests: Prisma
  reports a trigger that aborts as a foreign key error (P2003), and the message of the trigger travels in
  `meta.driverAdapterError.cause.originalMessage`, so the first version of `explainInsertFailure` did not recognise
  "Torneo lleno"; it now reads it from there and is tested with the real errors of the database. Prisma also serializes
  the transactions on SQLite, so in the race test the second request is stopped by the count and not by the trigger;
  the trigger is the safety net and is covered through `explainInsertFailure`. UT-TO-36 is read as: before noon
  adding a visitor is a pre-registration (a valid thing to do), never an on-site entry with a check-in.
- L3 (2026-10-28, T3 and T4): the actions refresh the screen with `refresh()` of `next/cache`; the page closes the
  check-in when the administrator loads it. Removing the role check made the staff test fail. The passport notice is
  composed in `passport-page.tsx` (a page may combine features); `PassportView` takes an optional `extra` node.
  Tried in Chrome on a production build with a throw-away database (`e2e.db`, already deleted): a visitor registered
  at `/register`, the administrator added her as "neo" (lower case) and the list and counts refreshed by themselves,
  her passport showed the check-in notice with the hours of the settings, the check-in by PIN worked, generating with
  one player answered "El bracket necesita entre 32 y 64 jugadores con check-in.", and with 32 the bracket appeared,
  the forms and the generate button disappeared and the passport said "ya estás en el bracket". Not done: the screen
  was not looked at, the on-site channel was only covered by tests, and registering a visitor on the spot (UT-TO-38)
  stays out.
