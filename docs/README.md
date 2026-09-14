# Documentation index

Every doc in this folder, one line each. The root `README.md` and
`DOCUMENTATION.md` link to the most important ones.

## "I want to…" — find by intent

| intent                                             | go to                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| run Wird locally                                   | `../README.md` (Quick start) · `REPRODUCIBILITY.md`               |
| install on a fresh machine deterministically       | `REPRODUCIBILITY.md`                                              |
| understand the high-level architecture             | `ARCHITECTURE.md`                                                 |
| understand what lives in each folder               | `../AGENTS.md` (repo map)                                         |
| add a feature                                      | `HOW_TO_ADD_A_FEATURE.md` + `../AGENTS.md`                        |
| fix a bug                                          | the bug template + `ERROR_HANDLING.md` (failure modes)            |
| add a language                                     | `HOW_TO_ADD_A_LANGUAGE.md` + `LOCALIZATION.md`                    |
| modify religious content                           | `HOW_TO_ADD_RELIGIOUS_CONTENT.md` + `SAFE_CODE_GENERATION.md`     |
| improve accessibility                              | `ACCESSIBILITY.md`                                                |
| work on storage / schema                           | `features/storage.md` + `DOMAIN_MODELS.md` + `VERSIONING.md`      |
| work on analytics / insights                       | `features/analytics.md` + `ANALYTICS.md`                          |
| work on the companion / return system              | `features/coach.md`, `features/return-system.md` + `COMPANION.md` |
| work on adaptation / personalization               | `ADAPTIVE.md` + `app/lib/personalize.ts`                          |
| work on private self-management plans              | `features/private-recovery.md`                                    |
| contribute security fixes                          | `../SECURITY.md` + `features/security.md`                         |
| audit what the app sends over the network          | `NETWORK.md` + `../app/lib/privacy.ts`                            |
| validate a release                                 | `RELEASE.md` + `TESTING.md`                                       |
| use Wird offline / understand the offline contract | `offline-architecture.md`                                         |
| understand the sync/blocking policy                | `offline-architecture.md` + `COMPANION_PROJECT.md`                |
| decide a big architectural change                  | `../GOVERNANCE.md` + `../docs/adr/`                               |
| create a fork                                      | `../README.md` + (when public) GitHub fork button                 |
| find beginner work                                 | `../GOOD_FIRST_ISSUES.md` + `CONTRIBUTOR_LEVELS.md`               |

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
- `../PRIVACY_POLICY.md` — versioned policy: what/why/where/rights/contact.
- `../TERMS_OF_USE.md` — versioned terms: service, content, availability, limits.
- `../DATA_CLASSIFICATION.md` — PUBLIC → HIGHLY SENSITIVE levels + rules.
- `../DATA_INVENTORY.md` — every field: purpose, sensitivity, retention, export.
- `../DATA_RETENTION.md` — shortest-practical retention per dataset.
- `../CONTENT_RIGHTS.md` — non-code content sources, licenses, review flags.
- `SAFETY.md` — youth audit + parent-access/safety roadmaps.
- `COMPLIANCE_MATRIX.md` — requirement → implementation → test → status.
- `PRIVACY_ARCHITECTURE.md` — how privacy is enforced structurally
  (sensitivity classes, local-first design).
- `NETWORK.md` — exhaustive network-request matrix.
- `offline-architecture.md` — offline-first contract: classification
  manifest, storage, sync boundaries, SW behavior, failure modes, testing.
- `COMPANION_PROJECT.md` — separate restriction-companion design record
  (not in this codebase).
- `../SECURITY.md` — threat model, vulnerabilities, disclosure.

## Features & content

- `features/README.md` — feature-doc index (analytics, coach, return
  system, quran, hadith, adhkar, goals/habits/review, storage, privacy,
  security, localization, accessibility, testing).
- `ANALYTICS.md` — insight rules, thresholds, confidence.
- `COMPANION.md` — companion/return-system states + coach behavior.
- `ADAPTIVE.md` — personalization engine, requirement map, privacy controls.
- `RELIABILITY.md` — failure domains, consistency contract, breakers, safe mode.

## Guides (step-by-step)

- `HOW_TO_ADD_A_FEATURE.md` — build a new feature end-to-end.
- `HOW_TO_ADD_A_LANGUAGE.md` — add/update a UI language.
- `HOW_TO_ADD_RELIGIOUS_CONTENT.md` — add sourced religious content.

## Other

- `TESTING.md` — testing strategy + how to run tests.
- `ACCESSIBILITY.md` — a11y baseline, audits, known gaps.
- `LOCALIZATION.md` — i18n design + rules.
- `../MASTER_AUDIT.md` — audit methodology + 100-item map (statuses,
  severities, evidence). `../AUDIT_REPORT.md` — this run's real results.
  `../AUDIT_BASELINE.md` — frozen numbers for future audits.
  `../audit/` — machine inventory, regenerated by
  `npm run audit:manifest`.
- `adr/` — Architecture Decision Records:
  - `adr/ADR-000-template.md` — template for writing a new ADR
  - `adr/ADR-001.md` — local-first storage
  - `adr/ADR-002.md` — no cloud AI / no telemetry
  - `adr/ADR-003.md` — analytics architecture
  - `adr/ADR-004.md` — privacy model
  - `adr/ADR-005.md` — Quran data architecture
  - `adr/ADR-006.md` — localization strategy
- `../GOVERNANCE.md` — decision process, ADR workflow, roles.

## Engineering operations

- `REPRODUCIBILITY.md` — reproducible environment, lockfile, Dev Container,
  OS-specific notes.
- `DEPENDENCIES.md` — dependency governance + supply-chain policy.
- `RELEASE.md` — release pipeline, artifact integrity (SHA-256), SBOM.
- `VERSIONING.md` — versioning, migrations, deprecation.
- `SAFE_CODE_GENERATION.md` — generated vs editable-source boundaries.
- `TECH_DEBT.md` — prioritized technical-debt register.
- `CONTRIBUTOR_LEVELS.md` — contribution levels 1–6.
- `MAINTAINER_HANDOVER.md` — condensed knowledge for a future maintainer.
- `FEATURE_FLAGS.md` — feature-flag policy (none registered today).
- `OPEN_SOURCE_READINESS.md` — clean-room health check + self-audit.
- `../AGENTS.md` — orientation for AI coding tools (and humans).

## Maintenance rules

- Update `DOCUMENTATION.md` §4 whenever a storage key is added/removed.
- Update `NETWORK.md` + `lib/privacy.ts` whenever a request is added.
- Update `CHANGELOG.md` on every user-visible change.
- Keep this index in sync when adding/renaming docs.
