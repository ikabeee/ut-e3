---
status: done
---

# KOF public bracket

Objective: let any visitor follow the KOF bracket from their phone, and let the KOF administrator close that view when
the server is under pressure (RF-67 and RF-74 of `odd/requirements/srs-v2.md`). Work continues on
`feature/tournaments`. Delivery: `ask-on-risk` (forecast about 1,200 changed lines). Test runner: Jest (`npm test`).

## Specs

- S1 (RF-67, privacy): "Consulta pública del bracket y los resultados." The public view carries the gamertags and the
  results and nothing else: no player ids, no visitor ids, no emails, no PINs, no audit log. It is built from the stored
  tournament by one pure function.
- S2 (RF-67): the public answer has three states. `open` with the bracket, `pending` while the bracket does not exist yet,
  and `closed` when `event_settings.publicBracketEnabled` is false (or the settings are missing, which is the safe side).
  Closed wins over the bracket: nothing leaks while it is closed.
- S3: `GET /api/tournament/public` needs no session and is never cached. `/tournament` is the public page; it renders the
  state it finds and then asks the endpoint every 3 seconds (the same decision as the KOF panel, instead of SSE).
- S4 (RF-67): with the view closed the page says "El bracket está disponible en la pantalla del torneo."; while pending it
  says the bracket is not ready.
- S5 (RF-74): "Puede cerrar y reabrir el bracket público ('Cerrar al público'). [...] La operación del torneo conserva el
  acceso." Only the KOF administrator flips the switch, from `/admin/kof`; it writes `publicBracketEnabled` and one audit row
  in the same transaction. The staff and the panel of the desks keep working whatever its value.
- S6 (mobile first): the page has no horizontal scroll at 360 px, a link for each area (boards 1 to 4, semifinals, final),
  and the buttons of the panel are at least 44 px.

## Not in this task

- Closing by itself when the CPU or the memory pass 50% for 2 minutes (needs server monitoring) and the cap of open
  connections (polling opens none that last).
- SSE, and a drawn bracket tree: the page lists the matches by area, as the panel does.

## Tasks

| ID | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1, S2, S5 (server) | parent (Sonnet 5.5) | done, commit pending | |
| T2 | S3 | parent (Sonnet 5.5) | done, commit pending | |
| T3 | S3, S4, S6 | parent (Sonnet 5.5) | done, commit pending | |
| T4 | S5 (screen) | parent (Sonnet 5.5) | done, commit pending | |

- T1: `lib/public-bracket.ts` (pure), `lib/server/public-bracket-queries.ts` and the switch in `tournament-mutations`.
- T2: the Route Handler, its client and the polling hook (a shared hook for both polls).
- T3: the page and the components.
- T4: the switch in `/admin/kof`, copy, `docs/tournament.md`, `CHANGELOG.md`.

## Log

- L1 (2026-10-28): the user asked "agrega el bracket público?" after the list of what was missing from the tournament.
- L2 (2026-10-28, T1 to T4): RED then GREEN for each. The polling of the KOF panel and the one of the public page share
  `shared/hooks/use-polled-value.ts`; `useTournament` was rebuilt on it and its tests kept passing. The public view is built by
  one pure function that leaves the ids out, and a test looks for them in the JSON, in the endpoint and in the HTML.
  Closed wins over the bracket: the endpoint does not even read it. Tried on a production build with a throw-away database
  (already deleted): `/tournament` rendered without a session with 63 matches, 7 areas and links to each, no identifier in
  the HTML, no horizontal scroll at 360 and 390 px and links of 44 px; the closed state answered only `{"state":"closed"}`
  with 0 gamertags and the page showed the exact message of RF-67; reopening brought the bracket back. Not done: the Chrome
  extension disconnected before the administrator could press "Cerrar al público" in the browser and before a page that was
  already open could be watched closing; both are covered by tests (the action with its role checks, and the polling of the
  page when the answer changes to closed) but were not seen working together. The screen was not looked at.
