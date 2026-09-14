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

## Legal: your contributions (Apache-2.0 inbound, DCO, no CLA)

Wird is Apache-2.0-licensed (`LICENSE`, copyright "wird-gamma"). Contributing
an inbound contribution means:

- You license your contribution under the project's Apache License 2.0
  (this includes the express patent license — do not contribute code
  you know you have no right to license).
- You retain copyright over your own work; the project copyright line
  names the project holder and you do not need to sign a CLA.
- Third-party material stays under its own license with attribution
  intact: never strip copyright notices, never relicense others' code as
  Apache-2.0, never vendor a dependency by copy-paste when `npm`
  suffices.

We use the **Developer Certificate of Origin (DCO)** model: every commit
signed with `git commit -s` (or a PR with commits so signed) certifies
that you are legally entitled to contribute the code under Apache-2.0.
The DCO text is only the inbound-offer; the **outbound** license
is Apache-2.0 and never imposes signed commits on redistribution.

- No CLA, no permission forms — the process must stay accessible to
  students and first-time contributors.
- If you contribute a patch authored by someone else, add their
  attribution (`Co-authored-by:` trailer) so copyright remains traceable.
- First-time contributors: ask in the issue thread (`good first issue`
  labels in `GOOD_FIRST_ISSUES.md`) before starting work.

## What you must never submit

Pirated code, unlicensed datasets, copyrighted images without permission,
copied proprietary source, restricted educational material, unlicensed
religious translations, private credentials, leaked source code, or
third-party religious text presented as your own. Religious content
additionally needs the review in `docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md`
— when in doubt, open an issue first instead of a PR.

## Contribution levels (see docs/CONTRIBUTOR_LEVELS.md)

You do not need to understand every subsystem to be useful:

1. **Docs** — fix a typo, improve a guide, extend `docs/features/`.
2. **UI/content** — layout, copy, curated content.
3. **Tests** — add coverage, fix flaky specs.
4. **Features** — new capabilities behind the standard checklist.
5. **Architecture** — layer changes, new subsystems (write an ADR).
6. **Core infrastructure** — schema, storage, security, release tooling.

Pick a level that matches your confidence; review is the same standard
at every level (AI-assisted code included — see AGENTS.md).

## Issue & pull-request templates

- Report a bug or request a feature? Use the GitHub issue templates in
  `.github/ISSUE_TEMPLATE/` (bug, feature, docs, accessibility,
  localization, security, performance).
- Opening a PR? Fill out `.github/pull_request_template.md` — it asks "what
  could break", "privacy/accessibility/localization/offline", "migration
  needed", "docs needed". Answering honestly is how small changes stay
  safe.
