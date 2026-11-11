---
status: done
---

# Readable-code lint layer

Objective: finish ut-e3's lint gates with the rules built in the AI-Assisted Dev Kit, so agent-written code reads like a book.
Branch: `feature/ci-oxlint` (PR #79, still open). Delivery: `ask-on-risk`, forecast under 400 authored lines. Test runner: lint probes on stdin or scratch files (`oxlint`, `eslint --stdin`) plus `npm test` for regressions.

## Specs

- S1. "Hay terminar de implementar el linter ya terminamos el kit" (user, 2026-10-25). ut-e3 consumes the kit's package `eslint-plugin-readable-code` (`github:ikabeee/eslint-plugin-readable-code#v0.1.0`) by extending its Oxlint preset in `.oxlintrc.json`, next to the vendored anti-slop rules. The preset pins its peer `oxlint` to 1.89.0, so `oxlint` and `@oxlint/plugins` move from 1.88.0 to 1.89.0 together.
- S2. The existing code passes the new rules (`readable-code/stepdown-order`, `readable-code/no-test-runner-branching`, `max-lines-per-function` 40, `max-depth` 3, `max-params` 3, `react/jsx-max-depth` 6): `npm run lint:oxlint` exits 0. Violations are fixed in the code, never disabled.
- S3. Cross-file duplication is checked in CI with `jscpd` (decision of 2026-10-24: "the Opus 5.5 copy a similar component hack needs jscpd in CI, not a lint rule").
- S4. `sonarjs/no-commented-code` is on in ESLint (decision of 2026-10-24).
- S5. The commands table in `AGENTS.md`, the CI workflow and the integration notes describe the new checks.

Constraint (not a requirement): `unicorn/consistent-boolean-name` from the 2026-10-24 decision is left out. `eslint-plugin-unicorn` 79 has the peer `eslint >=10.4` and ut-e3 stays on ESLint 9 (`AGENTS.md`), so installing it breaks `npm ci`. It comes in with the ESLint 10 upgrade.

## Tasks

| ID | Specs | Unit | Route | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| T1 | S1, S2, S5 | Install the package, extend the preset, fix the violations, document it | inline (no writer reason: one unit, under 100 lines of code) | done (RED: 4 stepdown errors; GREEN: 0) | see Log L3 |
| T2 | S4, S5 | Turn on `sonarjs/no-commented-code` in ESLint | inline | done (RED: probe exit 0; GREEN: probe exit 1) | see Log L4 |
| T3 | S3, S5 | `jscpd` config, script and CI step | inline | done (probe pair exit 1; `src/` exit 0) | see Log L5 |

## Log

- L1 (2026-10-25, user): "Vamos a continuar con este proyecto. Hay terminar de implementar el linter ya terminamos el kit"
- L2 (2026-10-25): Evidence before the first write. The kit (`ai-assisted-dev-kit`, objective 7 done) publishes `eslint-plugin-readable-code` v0.1.0 with an Oxlint preset (`oxlintrc.json`) whose `plugins` key lists `eslint`, `typescript`, `unicorn`, `oxc` and `react`, and whose `jsPlugins` load `readable-code` and `eslint-plugin-sonarjs`. `npm view eslint-plugin-unicorn@79.0.0 peerDependencies` gives `eslint >=10.4`; `eslint-config-next` 16.4.2 accepts `eslint >=9.0.0`, but `AGENTS.md` keeps ESLint 9. Probe: `sonarjs/no-commented-code` fires under ESLint 9.39.5 on stdin (`2:3 Remove this commented out code`), unlike the kit's probe under Oxlint and ESLint 10. PR #79 today only adds the CI step (7 additions, 6 deletions), so this layer finishes the same PR.
- L3 (2026-10-25, T1): `npm install -D -E oxlint@1.89.0 @oxlint/plugins@1.89.0 github:ikabeee/eslint-plugin-readable-code#v0.1.0`. The lockfile resolves the plugin as `git+ssh://…#4f4377c`; the kit's CI installs the same entry and passed, so `npm ci` clones it over HTTPS for a public repo. RED: with the preset, Oxlint reported 4 `readable-code(stepdown-order)` errors, `parseSiteUrl` above `parseEnv` in `src/shared/lib/env.ts` and `subscribe`, `getSnapshot`, `getServerSnapshot` above `usePrefersReducedMotion`. GREEN: callees moved below their callers; the hook's `const` arrows became `function` declarations. `env` stays last on purpose: it runs at module load and reads `DEVELOPMENT_SITE_URL`, so it must come after the constants. Checks: `npm run lint` 0, `npm run lint:oxlint` 0 (21 files, 154 rules), `npm run typecheck` 0, `npm test` 4 suites / 13 tests, `npm run format:check` clean. Docs: `AGENTS.md` (stack, commands, style rule), `ci.yml` header, `UPSTREAM.md` integration, `srs.md` RNF-34.
- L4 (2026-10-25, T2): T1 is commit `acc73b0`. RED: a probe with `// const legacy = values.map(...)` passed `eslint --stdin` (exit 0). GREEN: after adding `{ rules: { "sonarjs/no-commented-code": "error" } }` below `sonarjs.configs.recommended`, the probe fails with `2:3 Remove this commented out code` (exit 1) and `npm run lint` on the repo exits 0. No doc change beyond the config comment: `AGENTS.md` already describes ESLint as the SonarQube rules.
- L5 (2026-10-25, T3): T2 is commit `8bc84d3`. jscpd 5.4.2 is the Rust rewrite: a 14 kB launcher plus one binary per platform as optional dependencies (`jscpd-linux-x64-gnu` is in the lockfile for CI); config keys match v4 (`node_modules/jscpd/README.md`, "Config File" and "Coming from jscpd v4"). `.jscpd.json`: `src/`, formats `typescript` and `tsx`, `**/__tests__/**` ignored, `minTokens` 50, `exitCode` 1. Before this, cross-file copies had no check: `sonarjs/no-identical-functions` only compares functions in one file. Probe: two scratch files with the same 7-line function give `Clone found (typescript)` and exit 1; `npm run lint:duplication` on `src/` finds 0 clones, exit 0. Script `lint:duplication`, CI step after `lint:oxlint`, `AGENTS.md` commands and checklist, PR template.
- L6 (2026-10-25, verify): An independent verifier ran, from a fresh clone: `npm ci` (built the git dependency's `dist/`), the seven CI commands (all exit 0, build included) and probes for S1-S5 against base `d04ffe5`. Verdict: PASS on every spec, no blockers.
- L7 (2026-10-25, user): "que srs estas modificando? el que cuenta es el srs v2, el srs normal no es el final". `odd/requirements/srs.md` is v1 and describes the archived `archive/develop-v1`; `srs-v2.md` has no lint or code-quality requirement, so neither SRS changes. The three commits were not pushed, so they were rewritten to leave `srs.md` untouched (the L3 docs list no longer includes it). New hashes: T1 `29e7e57`, T2 `d31f301`; T3 is the commit that holds this entry.
- L8 (2026-10-25, close): Native review of `d04ffe5..0bb9959` (risk high: shell in `ci.yml`, plus escalation item 5), user granted consent, lenses `review-risk` and `review-readability`: approved and acknowledged (lineage `review-766c749d485b9613`, authority burned). Advisory findings, none blocking: R1 the git dependency has no lockfile `integrity` field (commit-pinned, runs at install and at lint time); R2-001 `AGENTS.md` repeats the preset's limits (40/3/3/6), which can drift when the preset moves past v0.1.0; R2-002 this status was still `in-progress`, fixed by this entry. Pending: push to PR #79 and its CI run on GitHub (user's call). Next: `unicorn/consistent-boolean-name` when ut-e3 moves to ESLint 10.
