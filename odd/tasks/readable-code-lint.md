---
status: in-progress
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
| T3 | S3, S5 | `jscpd` config, script and CI step | inline | pending | |

## Log

- L1 (2026-10-25, user): "Vamos a continuar con este proyecto. Hay terminar de implementar el linter ya terminamos el kit"
- L2 (2026-10-25): Evidence before the first write. The kit (`ai-assisted-dev-kit`, objective 7 done) publishes `eslint-plugin-readable-code` v0.1.0 with an Oxlint preset (`oxlintrc.json`) whose `plugins` key lists `eslint`, `typescript`, `unicorn`, `oxc` and `react`, and whose `jsPlugins` load `readable-code` and `eslint-plugin-sonarjs`. `npm view eslint-plugin-unicorn@79.0.0 peerDependencies` gives `eslint >=10.4`; `eslint-config-next` 16.4.2 accepts `eslint >=9.0.0`, but `AGENTS.md` keeps ESLint 9. Probe: `sonarjs/no-commented-code` fires under ESLint 9.39.5 on stdin (`2:3 Remove this commented out code`), unlike the kit's probe under Oxlint and ESLint 10. PR #79 today only adds the CI step (7 additions, 6 deletions), so this layer finishes the same PR.
- L3 (2026-10-25, T1): `npm install -D -E oxlint@1.89.0 @oxlint/plugins@1.89.0 github:ikabeee/eslint-plugin-readable-code#v0.1.0`. The lockfile resolves the plugin as `git+ssh://…#4f4377c`; the kit's CI installs the same entry and passed, so `npm ci` clones it over HTTPS for a public repo. RED: with the preset, Oxlint reported 4 `readable-code(stepdown-order)` errors, `parseSiteUrl` above `parseEnv` in `src/shared/lib/env.ts` and `subscribe`, `getSnapshot`, `getServerSnapshot` above `usePrefersReducedMotion`. GREEN: callees moved below their callers; the hook's `const` arrows became `function` declarations. `env` stays last on purpose: it runs at module load and reads `DEVELOPMENT_SITE_URL`, so it must come after the constants. Checks: `npm run lint` 0, `npm run lint:oxlint` 0 (21 files, 154 rules), `npm run typecheck` 0, `npm test` 4 suites / 13 tests, `npm run format:check` clean. Docs: `AGENTS.md` (stack, commands, style rule), `ci.yml` header, `UPSTREAM.md` integration, `srs.md` RNF-34.
- L4 (2026-10-25, T2): T1 is commit `acc73b0`. RED: a probe with `// const legacy = values.map(...)` passed `eslint --stdin` (exit 0). GREEN: after adding `{ rules: { "sonarjs/no-commented-code": "error" } }` below `sonarjs.configs.recommended`, the probe fails with `2:3 Remove this commented out code` (exit 1) and `npm run lint` on the repo exits 0. No doc change beyond the config comment: `AGENTS.md` already describes ESLint as the SonarQube rules.
