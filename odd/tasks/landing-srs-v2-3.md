---
status: done
---

# Landing aligned with SRS v2.3

Objective: the landing (`/`) follows SRS v2.3 (the official run sheet of 25 October 2026). Branch
`feature/landing-srs-v2-3` (worktree `../ut-e3-worktrees/landing-srs-v2-3`, from `develop` at `cfd62e2`), one PR to
`develop`. Delivery: `ask-on-risk`. Test runner: Jest (`npm test`).

## Specs

- S1 (RF-11): "El visitante ve el código corto del stand (`ZA-S1`); los administradores ven el completo (`ZA-S1-E6-101`: zona, stand, estudio y grupo)." The landing shows the short code.
- S2 (section 1.1): "Apertura y cierre del evento | Día del evento, 12:00 y 18:30", "Check-in de los inscritos a KOF | Día del evento, de 12:00 a 12:45", "Inscripción presencial a KOF | Día del evento, de 12:00 a 12:45", "Generación del bracket de KOF | Día del evento, 12:55", "Corte de check-ins | Día del evento, 16:50". The other values do not change.
- S3 (section 1.2 and RF-03): the initial schedule is the table "Programa del público" of SRS section 1.2, row by row (times in `America/Cancun`).
- S4 (section 1): "Exactamente 18: bloques A, B, C y D (3 stands cada uno) y T, zona de terror (6 stands)". The sample games occupy those 18 stands.
- S5 (RF-07): "Croquis interactivo como en la V1, según el croquis del Edificio B del orden del día, con la información de cada stand (bloques A a D y T) y las zonas de las actividades."
- S6 (section 1): "Sede | Edificio B de la Universidad Tecnológica de Cancún (lobby y áreas externas)". No landing text says "edificio E3".
- S7: docs: the `AGENTS.md` tree names the stand code as `ZA-S3`, and `CHANGELOG.md` has the visible changes under `[Sin publicar]`.

## Tasks

| ID | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- |
| T1 | S1, S2, S3, S6, S7 | inline (no writer trigger: one understood data change) | done | L3; `306c1d2` |
| T2 | S4, S5, S7 | inline (no writer trigger: depends on T1's stand codes) | done | L5; second commit of the branch |

## Log

- L1 (2026-10-25, user): "si", the answer to "¿Hago merge de #93 y después actualizo la portada a la v2.3?". #93 merged as `cfd62e2`.
- L2 (2026-10-25, exploration): seams under test are the existing ones agreed in `landing-v2` (L7): `formatStandCode`, the seed tests (`event-settings-seed`, `schedule-seed`), `FloorPlan`, `plan-layouts` and `LandingView`. The view tests inject their own data, so only the seeds and `formatStandCode` carry SRS values. The croquis (run sheet page 16, rendered with PDFKit) is a portrait lobby: marketplace trasero on top, restrooms below it with two KOF tables, blocks D (top) and B (bottom) on the left, C (top) and A (bottom) on the right, each block 3 stands of 2 tables; block T (6 stands) in an annex at the top right; four info centers at the corners; four Mario Kart tables above the main stage at the bottom; sponsors along the walls; Monumento a la Paz (marketplace central) and the external cafeteria below the lobby.
- L3 (2026-10-25, T1): RED: `stand-code` (`ZA-S3`, `ZT-S6`), `event-settings-seed` (event 12:00-18:30, KOF check-in 12:00-12:45, bracket 12:55, cutoff 16:50) and `schedule-seed` (the 21 rows of SRS 1.2 as `[startsAt, endsAt, title]`), plus the code format rewritten in the floor-plan and landing-page tests: 26 failed in 6 suites. GREEN: `formatStandCode` gives `Z{zone}-S{number}`, `DEFAULT_SELECTED_ID` is `ZA-S1`, both seeds updated; the old seed item that said "edificio E3" is gone. View tests keep their injected data. Checks: `format`, `lint`, `lint:oxlint` (no warnings), `lint:duplication`, `typecheck` 0; Jest 43 suites, 207 tests. CHANGELOG `[Sin publicar]` lines corrected in place (hours, KOF v2.3, schedule) and the `AGENTS.md` tree says `ZA-S3`. The Engram mirror is pending: `mem_save` fails with "host session already ended".
- L4 (2026-10-25, user): croquis on wide screens "Rotado 90° (Recomendado)": the phone keeps the run sheet orientation and wide screens rotate it 90 degrees (rear marketplace left, stage and Monumento right, C and A top, D and B bottom, T top left). Sampling the croquis PNG showed the four tables above the stage have the KOF legend color (183, 64, 192) and the two by the restrooms the Mario Kart one (171-174, 58-61, 170-173), so KOF is above the stage (4 boards) and Mario Kart by the restrooms.
- L5 (2026-10-25, T2): RED: `plan-layouts` (18 stands of A-D and T in both layouts, S1 to S3 from the rear in the tall one, and the wide layout as the tall one rotated counterclockwise, checked pair by pair on the centers of all 29 items), `plan-touch-areas` (29 targets, every touch area at least 56 units, 44 px at 360 px, no overlap), `floor-plan` (new zones, help centers, legend "Centro de atención", unassigned `ZT-S6`), a new `games-seed` test (one sample game per event stand) and `landing-page` (`ZA-S3`): 17 failed in 4 suites. GREEN: zones `rear-marketplace`, `cafeteria` and `help-center-1` to `-4` added; `entrance`, `rest-area`, `help-desk`, the public area and the info booth stands removed (with `PlanEntry`); `StandBlock.standNumbers` keeps block T in place when its 2 x 3 grid becomes 3 x 2; narrow zones of the wide layout get vertical labels (`ZoneGeometry.isLabelVertical`); the seed games occupy A1-A3, B1-B3, C1-C3, D1-D3 and T1-T6. Deviation: `floor-plan-links.test.ts` still listed the removed zones and was missed in the RED; the lock was lifted to update it, and with the old `lib/` and `components/` stashed it failed 5 of 12, with the new code 12 of 12. Checks: the five gates 0, Oxlint without warnings, Jest 44 suites and 211 tests, `next build` 0 with `/` as Partial Prerender. Headless Chromium (Playwright 1.64.1 in the scratchpad; the built-in browser pane was hidden, so its ResizeObserver never fired) on the production build: 360 and 390 use the tall layout and 844 x 390 and 1440 the wide one; no horizontal scroll, smallest croquis touch area 45 px, no console errors; the schedule shows the 21 rows. The `docs/design-system.md` touch-area paragraph and CHANGELOG describe the new croquis.
- L6 (2026-10-25, close): outcome: the landing follows SRS v2.3 (S1-S7 covered). Pending: push and PR to `develop` (the user's decision); the Engram mirror (host session ended); the stand numbering inside each block (S1 at the rear, T row by row) is an assumption until the organizers assign stands; the sample covers from V1 with commercial art (Halo, Call of Duty) are still there. Next step: the user decides on the push and the PR.
