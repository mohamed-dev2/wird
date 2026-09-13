# Dependency governance

Dependencies are part of the architecture. Every dependency must be
justified, documented, and maintained.

## Current dependency list

| package     | version | purpose                                       | replaceable  | license | why it exists     |
| ----------- | ------- | --------------------------------------------- | ------------ | ------- | ----------------- |
| `next`      | 16.3.4  | React framework (SSG/SSR, routing, Turbopack) | no           | MIT     | routing + build   |
| `react`     | 19.3.0  | UI library                                    | no           | MIT     | rendering         |
| `react-dom` | 19.3.0  | DOM renderer                                  | no           | MIT     | browser rendering |
| `qrcode`    | 1.5.4   | QR code generation (canvas + SVG)             | yes (custom) | MIT     | backup QR export  |
| `jsqr`      | 1.4.0   | QR code decoding from image data              | yes (custom) | MIT     | backup QR import  |

**Total runtime dependencies: 5.** (@types/qrcode is a types-only
package that ships zero runtime code and is stripped from the bundle.)

This is intentional.

## Dependency policy

1. **No new runtime dependencies** without removing one or a written
   justification in the PR description. The 5-dep footprint is a privacy
   - performance feature.
2. **Dev dependencies** are acceptable for tooling (lint, test, build)
   but must not leak into runtime bundles.
3. **No large packages** for small operations. If a dependency exists
   only for one utility function, implement it locally instead.
4. **No native/C++ addons** unless absolutely necessary (none currently).
5. **Every dependency** must have a compatible open-source license
   (MIT/Apache-2.0/BSD-3 preferred).

## How to evaluate a new dependency

Before adding any dependency, document:

- **Why** it exists (what problem it solves).
- **What** functionality depends on it (which features break without it).
- **Whether** a native implementation would be simpler and smaller.
- **License** compatibility (must be OSI-approved, no copyleft in runtime).
- **Bundle impact** (check with `next build` before and after).
- **Maintenance status** (last publish date, open issues, bus factor).
- **Security history** (known CVEs, disclosure process).
- **Transitive dependency count** (fewer is better).

## Supply-chain safety

| action                    | when              | how                                                           |
| ------------------------- | ----------------- | ------------------------------------------------------------- |
| lock deps                 | always            | `save-exact=true` in `.npmrc`; `package-lock.json` committed  |
| install deterministically | fresh clone       | `npm ci` (never `npm install`)                                |
| audit                     | every CI run      | `npm audit --audit-level=moderate`                            |
| update deps               | manually, in a PR | `npm update` (patch/minor) or `npm install pkg@x.y.z` (major) |
| test after update         | always            | full gate stack (`npm run diagnose` + `npx playwright test`)  |
| check bundle impact       | major updates     | `next build` before/after; compare output size                |
| review transitive deps    | major updates     | `npm ls --all` to inspect tree changes                        |

## Upgrading a dependency

1. Create a branch: `chore/deps/upgrade-<name>`.
2. Update the package: `npm install <name>@<version>`.
3. Run `npm run diagnose` and `npx playwright test --workers=1`.
4. Check bundle size: `npm run build` (compare output lines).
5. If the upgrade is major, update `docs/DEPENDENCIES.md` row (version,
   notes).
6. If the upgrade changes behavior, add a test or update docs.

## Abandoned dependency policy

A dependency is considered abandoned if:

- no release in >18 months
- no maintainer response to security issues for >6 months
- critical open issues with no triage

When a dependency is abandoned:

1. Document the risk in `docs/TECH_DEBT.md`.
2. Evaluate alternatives (including native implementation).
3. If the dependency is low-risk (e.g. only used for QR encoding), keep
   it with a documented note.
4. If the dependency is high-risk (e.g. crypto, auth), replace it.

## Transitive dependency monitoring

`npm audit` runs on every CI build and catches known vulnerabilities in
transitive dependencies. For deeper inspection:

```bash
npm ls --all              # full tree
npm ls --all --json       # machine-readable
```

## License compliance

All runtime dependencies use MIT or equivalent permissive licenses. The
full list is in `THIRD_PARTY_NOTICES.md`. If a new dependency uses a
different license, it must be reviewed before merging.
