---
status: done
---

# Guest badges, sponsor raffle tickets and a vertical floor plan

Objective: bring the approved canvas design (https://claude.ai/artifact/HrBuGDnZoqpqjb8fGXbi8a, artboards "B · Gafete del
evento" and its 390 px version) to code, plus the floor plan changes. Branch `feature/badges-raffle-tickets-floor-plan`
from `develop` at `5f777a6`. Delivery: `single-pr` to `develop` (forecast about 700 authored changed lines; asked
for as one change). Test runner: Jest (`npm test`).

## Specs

- S1 (floor plan, the user's uncommitted work on `develop`): remove the zone "Cafetería externa" from the floor plan,
  its copy and its drawing, with no commented-out code left behind.
- S2 (floor plan): "quitarás el marketplace trasero del croquis". The zone "Marketplace trasero" leaves the drawing,
  the panel copy and the zone ids; the tall drawing moves up to close the empty band it leaves.
- S3 (floor plan): "en la versión de escritorio dejarás el croquis en vertical". Every width uses the tall drawing; the
  wide drawing and the width-based orientation switch go away. On desktop the drawing keeps a readable width next to
  the panel instead of filling the column.
- S4 (guests): "Ve por gafete del evento, habrá al menos dos expositores", "La versión anterior del gafete era perfecta
  solo con los detalles que te mencioné, que los gafetes sean un carrusel". One badge at a time: lanyard strap,
  slot, photo, name and talk; no blue header strip and no footer (the user asked to remove both); a darker card behind
  as a deck cue; previous and next buttons and the counter "Pase 01 de 02", announced with `aria-live`. The second
  guest is "Por anunciar" with a placeholder instead of a photo. No subtitle under the heading (the user removed it).
- S5 (guests motion): "aplica animaciones para el apartado de los invitados que simulen un gafete con movimiento",
  answered "Animación en la web". The badge drops on its lanyard when the section first comes into view and settles
  with a damped swing; on previous or next it swings in from that side with a small twist; at rest it sways under one
  degree. Pivot at the top of the strap. `prefers-reduced-motion` turns all of it off.
- S6 (sponsors): "Ahora que los patrocinadores simulen que son tickets de rifa en diseño". Each sponsor is a horizontal
  raffle ticket: a stub with diagonal security stripes, the vertical label "Patrocinador" and the number "Nº 001" in
  the accent color (number from the display order), a dashed perforation with notches at top and bottom, and the body
  with the logo, the name and the contact links. Three tickets per row on desktop, one per row on a phone.
- S7 (sponsors look): "el fondo de los patrocinadores sea en negro", "conservando los colores de los logos de los
  patrocinadores", "hacer uniformes los logos para que destaquen porque no todas las empresas tienen un logo
  decente". Black tickets with the theme border; logos in their colors, each given the same visual area from its
  aspect ratio. Algorix: "Que los marcos sean negros" (its outline is black). Le Jardin d'Aurore: its white disc is
  removed so only the lettering and the flower show.
- S8 (sponsors copy): "Este copy irá abajo del h1": "Gracias a quienes hacen posible el evento." goes under the
  sponsors heading.
- S9 (scope): the landing (`/`) and `/showcase` use the new sections; the sponsors carousel and its parts that nothing
  else uses are removed. `/sponsors` keeps its cards.

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| T1 | S1, S2, S3 | inline (parent) | done | `144e4f4`; RED 12 failing, GREEN 41/41 floor-plan tests |
| T2 | S6, S7, S8, S9 | delegated writer (parallel unit, Writer trigger (a)) | done | `c088048`; RED: new suites failed (module missing), GREEN 115 tests |
| T3 | S4, S5 | delegated writer (parallel unit, Writer trigger (a)) | done | `5e17e55`; RED 6 failing, GREEN 121 landing tests |
| T4 | all | inline: CHANGELOG, docs, full checks, browser check | done | last commit of the branch |

Approved test seams (L8): FloorPlan render and PLAN_LAYOUTS/buildPlanItems; SpecialGuests render (one badge, counter,
previous/next, aria-live); SponsorTickets render (ticket per sponsor, number, logo alt, name, contacts, nothing when
empty) and the pure logo-balancing function; landing and showcase pages. CSS motion is checked in the browser.

## Log

- L1 (2026-11-12, verbatim): "Pasalo a codigo mas los cambios que tengo en develop y quitaras el marketplace trasero
  del croquis, en la version de escritorio dejaras el croquis en vertical"
- L2: "los cambios que tengo en develop" were uncommitted edits removing `cafeteria` from `ZONE_IDS` and commenting
  out its copy; they were carried onto this branch and are finished in T1.
- L3: the design was iterated on the canvas (direction B "Gafete del evento", carousel, motion, raffle tickets, black
  background, brand colors). Canvas-only experiments that were dropped: white knockout logos, light logo tiles.
- L4: assets prepared by the parent before the writers start: `public/sponsors/algorix-insights.svg` outline
  `#343534` -> `#000000`; `public/sponsors/le-jardin-d-aurore.svg` now wraps a 240 px quantized PNG without the white
  disc (22 KB, was 53 KB), so `logoPath` stays the same and no data changes.
- L8: test seams approved by the user ("Aprobadas").
- L9 (T4, browser check with Playwright against `next dev`): at 1440 px the giant guests heading ran into the badge,
  at 360 px the "Patrocinadores" heading did not fit and the "Visitar sitio" button pushed the tickets past the screen.
  Fixes: the guests heading scales to its 5/12 column from 820 px; the sponsors heading uses the `/sponsors` title
  size; inside a ticket the website is a text link (`SponsorContactLinks isCompact`), as in the canvas. After the fixes:
  no horizontal scroll at 360, 390 and 1440 px, the next pass swings in and settles on "Pase 02 de 02", no page errors.
  The deck card uses `bg-surface-tertiary` (#3a3a3a, the canvas colour) instead of `bg-muted`.
- L10 (verification): `npm run format:check`, ESLint, Oxlint, jscpd (0 clones), `npm run typecheck` and `npm test`
  (275 suites, 2016 tests) pass. `npm run test:e2e:sponsors`: SP-05 now checks the landing tickets; 32/33 passed on the
  first run, the failing "SP-07 360 landing: no horizontal scroll" came from the tickets and is fixed (re-checked with a
  Playwright script: scrollWidth 360). Two tournament seed tests failed once under full-suite load and passed alone and
  on the next full run. `npm run build` was not run locally (Turbopack cannot bind a port on this machine); CI runs it.
- L11 (outcome): delivered on `feature/badges-raffle-tickets-floor-plan`, commits `144e4f4`, `c088048`, `5e17e55` and
  the T4 commit. Pending: push and PR to `develop` (user decision). Next step: PR review; the admin copy
  `SPONSORS_COPY.admin.lead` still says "la banda de la portada".
