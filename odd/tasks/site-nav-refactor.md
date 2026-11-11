# Site navigation refactor (readability)

Objective: make the site header/nav code easy to read after the landing redesign introduced a second (light) variant. Not started; scope to be confirmed with the user in a later session.
Branch: to be created from `develop` after PR #74 merges (`feature/site-nav-refactor`). Delivery: `ask-on-risk`. Test runner: Jest 30 + Testing Library (`npm test`).

## Specs

- S1. "Esto esta re complejo de entender, hay que hacer un refact de algunas cosas pero en las siguientes sesiones" (user, about `src/features/site/components/site-nav-links.tsx`). The refactored code must be easy to read and adjust by the user (global rule: "Keep it as simple as possible").
- S2. Behaviour must not change: landing nav on `/` (coral #F36C69 hover underline, no glitch), dark nav with `link-wipe` + `ScrambleText` on other paths, footer hidden on `/`, `/admin` and `/team`. Existing tests pin it.
- S3. Coordinate with the planned app-wide redesign ("en otra sesion redisenaremos la aplicacion con este nuevo estilo"): if the whole app moves to the light style, the dark variant may disappear, which would remove most of the branching. Decide the order with the user before refactoring.

Diagnosis (parent, assumptions to confirm, not requirements):
- Very long Tailwind class strings stored in constants (`DARK_LIST`, `LANDING_LIST`, `LANDING_LINK`) are hard to scan.
- The `isLanding` branch is repeated in several places: list classes, link classes, label (`ScrambleText` vs plain), and again in `site-header.tsx` (`LandingHeader` vs dark header) and `site-footer.tsx`.
- `site` knows about the landing route (`HOME_PATH`) in three components; a single "variant from pathname" decision could live in one place.
- Candidate shapes: one `NavVariant` resolved once in the header and passed down; per-variant small components (`LandingNavLink`, `DarkNavLink`); moving repeated class groups to `@utility` blocks in `components.css`.

## Tasks

| ID | Specs | Unit | Route | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| T1 | S1,S3 | Confirm scope and order with the user (before or after the app-wide redesign) | parent | pending | |
| T2 | S1,S2 | Refactor nav links / header / footer variants per the agreed shape, tests unchanged in behaviour | to decide | pending | |

## Log

- L1 (2026-10-21, user, pasting `site-nav-links.tsx`): "Esto esta re complejo de entender, hay que hacer un refact de algunas cosas pero en las siguientes sesiones, agregalo como odd."
- L2 (2026-10-21): context from `odd/tasks/landing-redesign.md` L16: "en otra sesion redisenaremos la aplicacion con este nuevo estilo". Next: T1 in a later session.
