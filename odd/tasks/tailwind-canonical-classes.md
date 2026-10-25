---
status: done
---

# Tailwind canonical classes

Objective: make non-canonical Tailwind classes a lint error that agents see, and fix the five existing ones.
Branch: `feature/landing-v2` (the violations live in its unpushed commits; this lands as its last slice). Delivery: one work-unit commit. Test runner: lint probes (`oxlint`/`eslint` on the offending files) and the full gates.

## Specs

- S1. User (2026-10-25), asked why agents write `group-hover:[animation-duration:.5s]` when IntelliSense says "The class `group-hover:[animation-duration:.5s]` can be written as `group-hover:animation-duration-[.5s]`", then answered "si" to: "¿La agrego a ut-e3 y corrijo las cinco clases?". The proposal: `eslint-plugin-better-tailwindcss` 4.10.0, rule `enforce-canonical-classes` (https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-canonical-classes.md), in ut-e3 only (not in the `eslint-plugin-readable-code` preset, since not every project uses Tailwind).
- S2. The rule runs where agents get feedback: the `lint-on-edit` hook (Oxlint on each edited file) and CI.
- S3. The five classes become canonical: three `group-hover:[animation-duration:.5s]` in `src/features/landing/components/video-hero.tsx`, and `group-hover:[animation-play-state:paused]` plus `group-focus-within:[animation-play-state:paused]` in `src/features/sponsors/components/sponsors-band.tsx` (canonical forms per Tailwind 4.3.3 with the project stylesheet: `group-hover:animation-duration-[.5s]`, `group-hover:paused`, `group-focus-within:paused`).
- S4. Docs: AGENTS.md says which rule checks it and where the utilities come from (`tw-animate-css`, imported by `@heroui/styles`).

## Tasks

| ID | Specs | Unit | Route | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| T1 | S1-S4 | Install, configure, fix the classes, document | inline (one small unit) | done (RED 9 then 60 findings; GREEN 0) | this commit |

## Log

- L1 (2026-10-25, user): "Por que los agentes hacen este tipo de errores The class `group-hover:[animation-duration:.5s]` can be written as `group-hover:animation-duration-[.5s]`?" then "si".
- L2 (2026-10-25): Evidence. `canonicalizeCandidates` from `@tailwindcss/node` with only `@import "tailwindcss"` leaves the classes unchanged and `animation-duration-[.5s]` emits no CSS; with `src/app/globals.css` it returns the canonical forms in S3. The utilities come from `tw-animate-css` 1.4.0, imported at `node_modules/@heroui/styles/dist/index.css:7`. `npm view eslint-plugin-better-tailwindcss@4.10.0 peerDependencies`: `eslint ^7-^10`, `oxlint ^1.35.0`, `tailwindcss ^3.3.0 || ^4.1.17` (project: ESLint 9.39.5, Oxlint 1.89.0, Tailwind 4.3.3).
- L3 (2026-10-25, T1): Docs for v4.10.0 read at the tag (`docs/parsers/tsx.md`, Oxlint section): `jsPlugins` entry `"eslint-plugin-better-tailwindcss"` plus `settings["better-tailwindcss"].entryPoint`. Configured in `.oxlintrc.json` only (entry point `src/app/globals.css`): Oxlint runs both in the `lint-on-edit` hook and in CI, so ESLint does not repeat it. RED: on the two known files the rule reported 9 findings, the five expected plus `font-wide font-bold uppercase` (the project's own `type-wide`) and `border-l-[11px]`; across `src/` it reported 60 in 13 files (24 of them `type-wide`). GREEN: `npx oxlint --fix src` then Prettier, 0 findings; the replacements come from Tailwind's canonicalizer, which only proposes a class that generates the same CSS. Checks: 37 suites, 170 tests; `lint`, `lint:oxlint`, `lint:duplication`, `format:check`, `typecheck` 0; `next build` 0; Chromium at 360/390/844 landscape/1440 shows no horizontal scroll, no target under 44 px and no console errors, and the coverflow screenshot (the file with the most changed classes) matches the previous one. Docs: AGENTS.md (Oxlint stack row and a style rule). New dev dependency to justify in the PR: `eslint-plugin-better-tailwindcss` 4.10.0, exact pin.
