# Changelog

Follows the shipped commits on `main` (newest first). Only user-visible
or architecture-level changes are listed.

## Unreleased

- Per-profile backups: export just the active profile (file/QR/LAN), with
  manifest `scope` stamp; single-foreign-profile imports retarget into the
  current profile after an explicit confirm.
- Export consent log: what left the device, when, how many entries.
- Check-words verification across QR/LAN transfer (both ends), plus
  exponential throttling of decrypt guesses (2s → 30s cap).
- Travel mode: hide profiles behind the profile list; exact-name reveal.
- Panic lock (triple-tap the brand), idle blur, randomized unique export
  filenames.
- ~40 CSS additions (skip link, view transitions, shimmer skeleton, press
  physics, tabular numerals, print cosmetics), full RTL logical-property
  pass with `css:check` gate.
- Voice logging removed (cloud transcription cannot stay private);
  microphone denied by policy.
- Floating choice-list action menus on ayah rows and hadith cards.
- Prayer day-arc visual with overnight support.
- Optional duress PIN (blank decoy), optional discouraged reflection vault.
- Privacy batch: weak-PIN rejection, salted verifiers, PIN re-entry for
  destructive backup actions, backup checksums, log TTL, clipboard
  auto-clear, hidden-tab blur, analytics opt-out.
- Purpose headers in every source file (`comments:check` gate).
- New docs: ARCHITECTURE, COMPONENTS, CONTRIBUTING, CHANGELOG.
- Open-source engineering layer: SECURITY.md (threat model + private
  vulnerability reporting), CODEOWNERS, GOOD_FIRST_ISSUES.md, .env.example
  (no secrets), .vscode workspace (tasks/extensions/settings/launch).
- Docs suite: PRIVACY_ARCHITECTURE, NETWORK (exhaustive request matrix),
  DOMAIN_MODELS, API (internal contracts), VERSIONING (migrations +
  deprecation policy), PERFORMANCE, ERROR_HANDLING, LOCALIZATION,
  ACCESSIBILITY, `docs/adr/` ADR-001…006, `docs/features/` per-feature
  index, how-to guides (feature / language / religious content), directory
  READMEs (`app`, `lib`, `components`, `e2e`, `scripts`,
  `public/data` generated-data marker, `docs` index).
- `app/lib/privacy.ts`: sensitivity classifier (`sensitivityOf`) + single
  source-of-truth network manifest; fixes a `wird-reviews-v1` key typo in
  the classifier's exact-match list.
- `docs:check` extended: internal markdown-link resolver (anchor-aware) +
  docs inventory gate; CI now also runs `format:check`, `comments:check`,
  `css:check`; `diagnose` aggregates all local gates.
- `restoreBackup` marked `@deprecated` (use `restoreBackupSafe`).
- Open-source maturity layer (STEP 3 addition):
  - Reproducible dev environment: `.devcontainer/` (Node 22 + Playwright
    browsers + Firefox), `REPRODUCIBILITY.md` install/lockfile/pin
    conventions, `.nvmrc`/`.editorconfig`/`.gitattributes` documented.
  - Dependency governance: `DEPENDENCIES.md`, CycloneDX-lite SBOM
    (`sbom.wird.json`, `npm run sbom`), `THIRD_PARTY_NOTICES.md`,
    `audit` script wired into `diagnose`.
  - Governance & contributions: `GOVERNANCE.md` roles +
    maintainership-transfer policy, DCO + no-CLA statement in
    `CONTRIBUTING.md`, contributor `CONTRIBUTOR_LEVELS.md`,
    `MAINTAINER_HANDOVER.md`, issue templates (bug / feature /
    documentation / accessibility / localization / security /
    performance) + `pull_request_template.md`, `GOOD_FIRST_ISSUES.md`
    kept, `.env.example` (no secrets) verified.
  - Maintainability gates: `boundaries:check` (lib↔components, schema
    foundation, online-only reach, privacy↔CSP hostname sync),
    `metrics` (oversized modules, fan-in, runtime cycles),
    `TECH_DEBT.md` register (TD-1…TD-8).
  - Release engineering & doc quality: `RELEASE.md` (release/PR/revert
    playbooks), `FEATURE_FLAGS.md` policy work, `API.md` five-category
    stability tiers, doc-quality checks in `docs:check` (placeholders,
    `npm run` references, Node-version consistency), `AGENTS.md`,
    `SAFE_CODE_GENERATION.md`, `OPEN_SOURCE_READINESS.md` self-audit.

## v0.1.0 — analytics + companion era

- Advanced local analytics: 8 layered Insights sections, custom ranges,
  heatmap, month/year reviews, milestones, explainable insight rules
  (`docs/ANALYTICS.md`).
- Adaptive companion: 26-state engine, tiered return journeys, tawbah
  path, fatigue-aware single card, verified verse/hadith matching.
- Zero-loss data architecture: versioned schemas, quarantine, atomic
  validated imports, `/recovery` environment.
- 3D tilt with pointer sheen, breathing hero, prayer arc groundwork,
  hide-names anonymity option.
- Docs: README, DOCUMENTATION (18 sections), ANALYTICS, COMPANION,
  PRIVACY, TESTING.
