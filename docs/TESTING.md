# Testing guide

## Gates (run in this order)

```bash
npm run typecheck   # strict TS + noUncheckedIndexedAccess
npm run lint        # eslint --max-warnings 0
npm run format:check
npm run test        # vitest run (unit, ~100+ tests)
npm run test:e2e    # playwright (production server, serial)
npm run build
npm run docs:check  # keys + routes + AR/EN parity
npm audit
```

## Unit tests (`app/lib/__tests__/`)

Pure logic only — no DOM, no storage beyond in-memory mocks:

| File                          | Covers                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `schema`                      | envelopes, quarantine, salvage, future versions, quota, caps, migration idempotence   |
| `crypto-restore`              | manifest, dry-run, two-phase zero-write rejection, rollback                           |
| `crypto-security`             | round-trip, wrong password, GCM tamper, malformed payloads                            |
| `daily`                       | midnight rollover, multi-day absence, legacy shapes, monotonic `recordDay`            |
| `isolation`                   | namespacing, adoption, id uniqueness, quarantine purge                                |
| `fuzz`                        | seeded: validators/reads/writes never throw                                           |
| `transfer`                    | chunking, duplicates, order, contamination, bounds                                    |
| `companion`                   | 26 states, ranking, fatigue/once-ever, rotation, core                                 |
| `content`                     | verse refs exist in bundle, hadith resolve, theme coverage                            |
| `guidance-safety`             | auto-collected AR+EN copy: no revelation/ruling/shame/heart/medical/causation markers |
| `analytics`                   | 20-test BM suite over a synthetic 4-month dataset + pipeline test                     |
| `history/coach/recovery/demo` | legacy suites for core logic                                                          |

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
