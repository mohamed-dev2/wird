# Contributing

## Workflow

1. Branch from `main`, keep PRs small and single-purpose.
2. Conventional commits (`feat:`, `fix:`, `docs:`, `style:`, `test:`) —
   enforced by commitlint + husky.
3. Run the gates before pushing: typecheck → lint → format → test →
   build → e2e → docs:check → comments:check → audit (see docs/TESTING.md).

## Non-negotiables

- **No new runtime dependencies** without removing one or a written
  justification. The 5-dep footprint (`next react react-dom qrcode jsqr`)
  is a privacy + performance feature, not an accident.
- **No `console.*` in `app/`** — logs can leak user content.
- **No network calls** except allowlisted CDN/API fetches (Quran data,
  tafsir, audio) and same-origin bundles. No analytics, no tracking.
- **Storage rules** (docs/ARCHITECTURE.md): datasets go through the
  schema layer; new `wird-*` keys get a schema entry + §4 docs (CI
  enforces both); never delete/rename keys — migrate on read.
- **Copy rules**: every user-facing string needs AR+EN keys (parity is
  CI-enforced); religious text comes from datasets only, never generated;
  guidance copy must pass `guidance-safety` (prefix new keys `cm|tw|ret|
an|goals` to be auto-scanned).
- **Hydration rule**: no storage reads during render; static fallbacks
  first, mount effects after. The e2e hydration listener fails on mismatch.
- **Reduced motion + RTL**: every animation needs a `no-preference` gate;
  every position needs a logical property.

## Adding things (checklists)

- **New route**: directory + §2 docs row (docs:check enforces).
- **New storage key**: schema entry + §4 docs + round-trip test.
- **New user state**: `companion.test.ts` matrix row (presence + primary).
- **New insight rule**: BM dataset case in `analytics.test.ts` — the firing
  case AND a below-threshold case proving it stays silent.
- **New CSS**: logical properties (css:check enforces), theme vars only,
  motion gate, never color-only meaning.
