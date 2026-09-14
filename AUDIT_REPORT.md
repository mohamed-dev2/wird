# Audit Report — STEP 9 run (2026-09-14)

Methodology: `MASTER_AUDIT.md`. Inventory: `audit/` (regenerate with
`npm run audit:manifest`). Every number below was produced by executing
the command shown, on this machine, in this run. Nothing is projected.

## Environment

- Host: Windows, Node v24.19.0 (repo pins Node 22 for CI/prod; local
  run used 24 — no version-sensitive failures observed, CI remains the
  reference), Playwright 1.63.0 (Chromium).
- Commit at audit start: `26ef4ac` (2026-09-14). Version `0.1.0`.

## Gate results (all executed this run)

| Gate                | Command                                                                   | Result                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Typecheck           | `npm run typecheck` (`tsc --noEmit`, strict + `noUncheckedIndexedAccess`) | clean                                                                                                                      |
| Dead code (one-off) | `tsc --noEmit --noUnusedLocals --noUnusedParameters`                      | clean, no output                                                                                                           |
| Lint                | `npm run lint` (`eslint . --max-warnings 0`)                              | 1 warning found + fixed (`dirname` unused in new test) → clean on re-run                                                   |
| Format              | `npm run format:check`                                                    | 7 files reformatted with Prettier → clean on re-run                                                                        |
| Docs                | `npm run docs:check`                                                      | all green (70 storage keys, 9 routes documented, 979-key parity, 61-file links, 54-file inventory, Node 22, version stamp) |
| Comments            | `npm run comments:check`                                                  | all source files documented                                                                                                |
| CSS                 | `npm run css:check`                                                       | logical properties clean (`!important`: 18, waived: 17 — unchanged)                                                        |
| Boundaries          | `npm run boundaries:check`                                                | R1..R4 compliant (65 files)                                                                                                |
| Unit                | `npm run test`                                                            | **32 files, 246 tests, all pass**                                                                                          |
| E2E                 | `npm run test:e2e` (prod `next start`, `--workers=1`)                     | **45 tests, all pass (2.0 min)**                                                                                           |
| Deps                | `npm run audit` (`--audit-level=moderate`)                                | **0 vulnerabilities**                                                                                                      |
| Build               | `npm run build`                                                           | clean, 15 static routes                                                                                                    |
| Outdated (info)     | `npm outdated`                                                            | majors held deliberately: `@types/node` 26, eslint 10, TS 7, `eslint-config-next`/`next` 16.3.5, `lint-staged` 17.5.1      |

## Findings (with severity + disposition)

1. **P2 cosmetic — FIXED:** `ADAPTIVE.md` indexed twice in
   `docs/README.md`. Removed the duplicate.
2. **P2 trust — FIXED:** no `app/not-found.tsx`; unknown routes hit the
   framework default. Added a calm bilingual 404 (`nf.title`/`nf.home`,
   +2 key pairs → 979 keys, parity green) with unit + e2e coverage.
   (First version missed `"use client"` and broke prerender — caught by
   `npm run build`, fixed, build green.)
3. **P1 gate — FIXED:** new test file shipped one lint warning
   (`dirname` unused) and 7 files needed Prettier. Fixed; lint + format
   re-run clean. Process note: new files must be run through
   `npx prettier --write` + `npm run lint` before commit (already the
   husky pre-commit path — this run bypassed it by staging manually).
4. **P3 roadmap — ACCEPTED:** check-in notes are stored (byte-exact,
   unicode-safe, tested) but never displayed in any view. No data at
   risk; surfacing belongs to the plan-timeline roadmap.
5. **Non-finding — documented:** e2e unicode note loses a trailing
   space on fill; no `trim()` exists in the plans note path (verified by
   search) — browser input trivia, pinned in the test comment.
6. **Non-finding — documented:** git-history pickaxe hits for `sk-` /
   `password:` are CSS `mask-*` substrings and PIN UI code; the precise
   static secret scan runs in-suite and is clean.
7. **Held deliberately:** dependency majors (see table) — exact pins
   per policy; adoption is an owner decision, not drift.

## Regression map (past bugs → the test that would catch a return)

- Prayer-boundary over-count → `prayer-window` boundary tests.
- Arabic shaping corruption → mojibake guard in dictionary tests.
- Serial-PIN bypass → lockout unit + e2e tests.
- Import with invalid manifest writing partial data → two-phase
  zero-write rejection tests.
- New this audit: missing 404 → `audit.test.ts` (existence) +
  `e2e/audit.spec.ts` (renders + recovers); broken internal link →
  link-resolution test; stale SW shell → sitemap/SW consistency test;
  secret added to source → secret-scan test; non-allowlisted host
  touched on a core journey → loopback-only e2e test; unicode storage
  corruption → byte-exact note round-trip test.

## Limitations (honest, not waived)

- Browsers: Chromium only in this run. Safari/Firefox + VoiceOver/TalkBack
  need an owner device pass pre-release (`docs/ACCESSIBILITY.md`).
- Production (Vercel) verification not run from here — owner pre-deploy
  checklist: confirm `wird.app` canonical + `www` redirect, HSTS active,
  CSP header present in prod (dev/HMR intentionally omits it),
  `/terms` + `/privacy` reachable, SW updates on redeploy, QR transfer
  across two real devices.
- No 30-minute memory soak in CI; timer/listener hygiene is
  review-based (`docs/RELIABILITY.md`).
- Religious-content process audited (sourcing, grades, review flags);
  theological certification needs qualified reviewers, not CI.

## Verdict

Ship the audit commit. No P0/P1 open. Two P2s fixed with tests, one P3
roadmapped, limitations owned with checklists.
