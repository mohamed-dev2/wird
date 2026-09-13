# Documentation index

Every doc in this folder, one line each. The root `README.md` and
`DOCUMENTATION.md` link to the most important ones.

## Project basics

- `../README.md` — project README (what this is, quick start).
- `../DOCUMENTATION.md` — user-facing doc: all routes, every storage key
  (must be updated on schema change).
- `../CHANGELOG.md` — chronological changelog.
- `../CONTRIBUTING.md` — contribution workflow + rules.
- `../GOVERNANCE.md` — RFC-style decision process (open-source standard).

## Engineering & architecture

- `ARCHITECTURE.md` — high-level architecture, layers, module map.
- `COMPONENTS.md` — component map, prop contracts, state ownership.
- `DOMAIN_MODELS.md` — canonical data shapes + persistence matrix.
- `API.md` — internal API/contract surface (storage, engines, i18n).
- `VERSIONING.md` — versioning, schema migrations, deprecation policy.
- `PERFORMANCE.md` — performance model + what to profile.
- `ERROR_HANDLING.md` — every failure mode and the agreed degradation.

## Privacy, security, network

- `PRIVACY.md` — high-level privacy statement (user-facing).
- `PRIVACY_ARCHITECTURE.md` — how privacy is enforced structurally
  (sensitivity classes, local-first design).
- `NETWORK.md` — exhaustive network-request matrix.
- `../SECURITY.md` — threat model, vulnerabilities, disclosure.

## Features & content

- `features/README.md` — feature-doc index (analytics, coach, return
  system, quran, hadith, adhkar, goals/habits/review, storage, privacy,
  security, localization, accessibility, testing).
- `ANALYTICS.md` — insight rules, thresholds, confidence.
- `COMPANION.md` — companion/return-system states + coach behavior.

## Guides (step-by-step)

- `HOW_TO_ADD_A_FEATURE.md` — build a new feature end-to-end.
- `HOW_TO_ADD_A_LANGUAGE.md` — add/update a UI language.
- `HOW_TO_ADD_RELIGIOUS_CONTENT.md` — add sourced religious content.

## Other

- `TESTING.md` — testing strategy + how to run tests.
- `ACCESSIBILITY.md` — a11y baseline, audits, known gaps.
- `LOCALIZATION.md` — i18n design + rules.
- `adr/` — Architecture Decision Records:
  - `adr/ADR-000-template.md` — template for writing a new ADR
  - `adr/ADR-001.md` — local-first storage
  - `adr/ADR-002.md` — no cloud AI / no telemetry
  - `adr/ADR-003.md` — analytics architecture
  - `adr/ADR-004.md` — privacy model
  - `adr/ADR-005.md` — Quran data architecture
  - `adr/ADR-006.md` — localization strategy
- `../GOVERNANCE.md` — decision process, ADR workflow, roles.

## Maintenance rules

- Update `DOCUMENTATION.md` §4 whenever a storage key is added/removed.
- Update `NETWORK.md` + `lib/privacy.ts` whenever a request is added.
- Update `CHANGELOG.md` on every user-visible change.
- Keep this index in sync when adding/renaming docs.
