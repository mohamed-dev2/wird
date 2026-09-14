# Testing guide

## Gates (run in this order)

```bash
npm run typecheck   # strict TS + noUncheckedIndexedAccess
npm run lint        # eslint --max-warnings 0
npm run format:check
npm run test        # vitest run (unit, 246 tests)
npm run test:e2e    # playwright (production server, serial --workers=1 pinned in script)
npm run build
npm run docs:check  # keys + routes + AR/EN parity + links + inventory + quality + version stamp
npm run comments:check  # 2+ line purpose header in every source file
npm run css:check  # logical properties (RTL) + !important budget
npm audit
```

## Unit tests (`app/lib/__tests__/`)

Pure logic only — no DOM, no storage beyond in-memory mocks:

| File | Covers |
|---|---|---|
| `prayer` | day-arc fractions incl. overnight wrap, next-prayer agreement |

| `vault`                       | setup/unlock/lock/disable, generic failures, no plaintext residue                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `schema`                      | envelopes, quarantine, salvage, future versions, quota, caps, migration idempotence                  |
| `crypto-restore`              | manifest, dry-run, two-phase zero-write rejection, rollback, restore-twice convergence               |
| `crypto-security`             | round-trip, wrong password, GCM tamper, malformed payloads                                           |
| `daily`                       | midnight rollover, multi-day absence, legacy shapes, monotonic `recordDay`                           |
| `isolation`                   | namespacing, adoption, id uniqueness, quarantine purge                                               |
| `fuzz`                        | seeded: validators/reads/writes never throw                                                          |
| `transfer`                    | chunking, duplicates, order, contamination, bounds                                                   |
| `companion`                   | 26 states, ranking, fatigue/once-ever, rotation, core                                                |
| `content`                     | verse refs exist in bundle, hadith resolve, theme coverage                                           |
| `guidance-safety`             | auto-collected AR+EN copy: no revelation/ruling/shame/heart/medical/causation markers                |
| `analytics`                   | 20-test BM suite over a synthetic 4-month dataset + pipeline test                                    |
| `history/coach/recovery/demo` | legacy suites for core logic                                                                         |
| `private-plans`               | run math, history-preserving resets, neutral copy, generic reminders, schema round-trip              |
| `net`                         | bounded fetch: timeout/500/DNS/corrupt rejection; breaker open/half-open/close, fast-fail            |
| `storage-adapter`             | async seam: memory adapter CRUD, StorageLike wrapper, throwing stores → rejections                   |
| `analytics-perf`              | 5-year/1826-day history: full analytics surface inside per-call budgets                              |
| `catalog`                     | tafsir slugs + full-book ids locked; both languages present on every entry                           |
| `personalize`                 | settings defaults/normalization, schema round-trip                                                   |
| `notify`                      | tone-key matrix, historic copy lock, fatigue matrix, suggestion-copy safety scan                     |
| `adaptive`                    | challenge-advice matrix, co-occurrence math + gates, insight emission                                |
| `privacy-firewall`            | recovery import/key scan: only documented modules touch plan data                                    |
| `legal-compliance`            | license/notice/SPDX/affiliation, dep audit, no-SDK/cookie/age-keys, URL allowlist, routes, inventory |
| `safe-mode`                   | `?safe=` parsing, SSR default, registry contract                                                     |
| `section-error`               | static error mapping + content-free unique diagnostic ids                                            |
| `reliability`                 | storage probe classes, readiness verdicts, preview agreement, large-data budgets                     |
| `audit`                       | route inventory, internal-link + push resolution, sitemap/SW-shell consistency, static secret scan   |

Conventions: seeded PRNGs (reproducible), synthetic histories built from
day offsets off a fixed `TODAY`, window functions fed through `shiftDay`
(DST-safe by construction — tested across US spring-forward).

## E2E (`e2e/`, Playwright, production server)

- `smoke.spec.ts` — today persists, routes render, theme/lang persist, tilt.
- `transfer.spec.ts` — transfer card, recovery phrase, QR snapshot.
- `recovery.spec.ts` — `/recovery` health, corruption survival +
  quarantine, A/B profile isolation across switches and reloads.
- `companion.spec.ts` — fresh start, 10-day gentle return (working
  action), 95-day deep restart with tawbah path, no-shame word scan.
- `analytics.spec.ts` — insights layers with seeded data, honest empty
  state.
- `private-plans.spec.ts` — plan lifecycle (create → check in → setback
  with history preserved across reload), quick exit to neutral home,
  URL/title leak scan. Neutral fixtures only ("Private Plan A").
- `offline.spec.ts` — external traffic blocked + full browser offline
  (`context.setOffline`): core flows, bundled Quran search, private plans,
  calm tafsir/hadith failures with retry, true-offline restart with data
  intact and writable, library regressions (no duplicate Nawawi button,
  Ahmed/Darimi chips, Tazkirul source, localized fav label). See
  `docs/offline-architecture.md`.
- `personalize.spec.ts` — fatigue notice after seeded absence with pause
  resolution; personalization toggles persist across reload.
- `reliability.spec.ts` — safe mode parks optional systems while core
  tracking works; exiting restores everything; 3-year history renders
  insights; wipe downloads a rescue snapshot before erasing.
- `legal.spec.ts` — terms/privacy render versioned bilingual documents
  with cross-links; small-screen + offline reload covered.
- `audit.spec.ts` — core journey touches loopback hosts only; unicode
  check-in round-trip; back/forward/refresh/duplicate-tab integrity;
  calm 404 renders + recovers. Machine inventory: `npm run audit:manifest`
  regenerates `audit/*.json` (see `MASTER_AUDIT.md`).

Rules learned the hard way:

1. **Strict helpers**: every spec gets a fresh browser context, so
   `ensureProfile` MUST find the gate — assert it (30s), never silently
   skip. A silent skip turns a slow first paint into a confusing failure
   ten steps later.
2. **Serial on weak machines**: `npx playwright test --workers=1`.
   Parallel browsers on a loaded box produce timeout flakes that look
   like app bugs (proven innocent via storage dumps — see git history).
3. **Bilingual selectors**: the app defaults to Arabic; `/recovery` follows
   the browser locale. Accept both (`/نص|text/`).
4. **Seeded data must be realistic**: review entries need `items` (the
   schema quarantines shape violations — by design).
5. **Build-gated**: the webServer runs `npm run build` first, so e2e spec
   type errors fail the run before any browser opens.

## Adding tests

- New `wird-*` key → schema entry + round-trip case + docs §4.
- New user state → `companion.test.ts` matrix row (presence + primary).
- New copy → automatically covered by `guidance-safety` if prefixed
  `cm|tw|ret|an|goals` (verify with a run).
- New insight rule → BM dataset case in `analytics.test.ts` (both the
  firing case AND a below-threshold case proving it stays silent).
