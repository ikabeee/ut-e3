---
status: in-progress
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
- S7 (tree, requested with `inspiracion.jpg`): the public page draws the bracket as a tree with brackets, like the image: two
  mirrored halves, boards 1 and 2 on the left until semifinal 1, boards 3 and 4 on the right until semifinal 2, and the
  final in the middle. It is a pure positional layout (match `i` of a round feeds match `i/2` of the next) checked against the
  slots of the stored tournament. The admin panel is not touched. On wide screens the tree is the main view; on a phone the
  list stays the default and a button shows the whole tree inside a container that scrolls sideways, never the page.
- S8 (animations, requested by the user): when a result arrives, the public tree shows it. The camera moves to the match, the
  loser is struck through in red, the box of the winner lights up and the name of the winner flies to its place in the next
  round. A new answer is compared with the previous one and each new result becomes a step; the steps play one after
  another, so results that arrive together are queued, and a long queue plays faster so the view does not fall behind. What
  is drawn stays one step behind the data until the animation reaches it, so the name appears in the next round when it
  lands. With `prefers-reduced-motion` nothing is animated and the result is shown at once. The champion banner waits for the
  last step. The admin panel is not touched.
- S6 (mobile first): the page has no horizontal scroll at 360 px, a link for each area (boards 1 to 4, semifinals, final),
  and the buttons of the panel are at least 44 px.

## Not in this task

- Closing by itself when the CPU or the memory pass 50% for 2 minutes (needs server monitoring) and the cap of open
  connections (polling opens none that last).
- SSE, and any change to the panel of `/admin/kof`, which keeps its list of cards.

## Tasks

| ID | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1, S2, S5 (server) | parent (Sonnet 5.5) | done, commit pending | |
| T2 | S3 | parent (Sonnet 5.5) | done, commit pending | |
| T3 | S3, S4, S6 | parent (Sonnet 5.5) | done, commit pending | |
| T4 | S5 (screen) | parent (Sonnet 5.5) | done, commit pending | |
| T5 | S7 | parent (Sonnet 5.5) | done, commit pending | |
| T6 | S8 | parent (Sonnet 5.5) | pending | |

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
- L3 (2026-10-28): the user asked how feasible a tree view was, then put `inspiracion.jpg` in the project: a classic 64 entry bracket,
  mirrored halves with thin white connectors on a dark background, and said "la vista de admin no lo toques".
- L4 (2026-10-28, T5): RED then GREEN. `buildBracketTree` is pure and a test checks, against the slots of the stored tournament, that
  every match sits in front of the two that feed it. `BracketTree` draws it with flex columns that split the height evenly
  (a round has half the cells of the one before, so each match centers itself) and thin lines made with borders; the lines are
  `aria-hidden` and each match is a group named "Combate #n: A contra B". Measured in Chrome on a production build: 10 matches
  checked are centered between their feeders, the final is centered, the halves are symmetric and no name is cut. A first
  measure found a real bug: with the tree visible the page was pushed to 1400 px (a grid item does not shrink below its
  content), at 1280 px as well as on a phone; `min-w-0` on the two wrappers fixed it, and after that the page fits at 360,
  390, 900, 1280 and 1829 px and only the box of the tree scrolls. Not done: the screenshots of the extension time out, so
  nobody has looked at the colors, the weight of the lines or the spacing; that review is the user's. At exactly 900 px
  the iframe still showed the list, a boundary that was not investigated. The admin panel was not touched.
- L5 (2026-10-28): the user asked for "mas vistozo cuando alguien pase": an approach to the bracket, the loser struck in red, the winner's box
  lighting up and moving on to the next bracket, and the animations queued when two or more results arrive together.
