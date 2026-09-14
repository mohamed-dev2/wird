# Changelog

Follows the shipped commits on `main` (newest first). Only user-visible
or architecture-level changes are listed.

## Unreleased

- Deen journey (STEP 10, ADR-007): five voluntary tracking levels
  (fard → mustahabb → makruh awareness → character → refinement) at
  `/deen` with prayers, quests, good-deeds library, scoreless haram/
  speech reflections, streaks, combos, chest, achievements, and full
  gamification toggles. Wird XP is app activity only (idempotent
  ledger); no sin counters, leaderboards, or faith scores; per-profile
  `wird-deen-v1` on existing local storage; dictionary now 1295 keys.
- `LIMITATIONS.md`: honest boundaries incl. STEP 10 deen limits.
- Master audit (STEP 9): `MASTER_AUDIT.md` (100-item map with
  local-first scoping, statuses, severities), `AUDIT_REPORT.md` (real
  gate numbers: 246 unit + 45 e2e green, 0 vulns), `AUDIT_BASELINE.md`,
  machine inventory in `audit/` via `npm run audit:manifest`; calm
  bilingual 404 (`app/not-found.tsx`); static audit tests (routes,
  links, sitemap/SW, secret scan) + audit e2e (network allowlist,
  unicode round-trip, navigation integrity, 404); incident templates in
  `docs/RELIABILITY.md`; fixed duplicated doc blocks; dictionary now
  979 keys.
- Legal architecture (STEP 8): Apache-2.0 license (word-verified),
  wird-gamma copyright, NOTICE, SPDX on new routes; versioned bilingual
  Terms + Privacy Policy as docs AND live `/terms` + `/privacy` routes
  (offline-capable, sitemap-listed, mobile-tested); data inventory,
  classification, retention, content-rights, safety, and compliance-matrix
  docs; Library sources attribution in-app; policy↔code consistency tests;
  canonical site `https://wird-gamma.vercel.app/` everywhere.

- Reliability deep layer (STEP 7, 7.14–7.34): storage probe + readiness
  verdict (actually writes, never "healthy because running"); wipe now
  downloads a rescue snapshot first; preview↔restore agreement asserted;
  disaster-scenario matrix, backup taxonomy, deletion tiers, release and
  feature rollback paths, shutdown/job model, resource-bound table, and
  large-dataset suites (2000-record validation, 500-key restore,
  7000-record search, 3-year-history e2e) in `docs/RELIABILITY.md`.

- Reliability layer (STEP 7): route + global + section error boundaries
  with content-free diagnostics; safe mode (skips companion, deep
  analytics, QR scan/LAN; bannered, `?safe=1` linkable, error-screen
  entry); per-host circuit breakers on CDN loads; restore-twice
  convergence + rollback tests; `docs/RELIABILITY.md` (domains,
  consistency contract, retry/breaker policy, degradation ladder).

- Adaptive intelligence (STEP 6): `wird-personalize-v1` control center
  (master/habits/mood/reminders switches + why-lines, recovery
  test-locked out by firewall); wired reminder tones (gentle/balanced/
  strict, balanced preserves historic copy, notifications now localized);
  fatigue detection with change/pause (never more nudges); challenge
  difficulty suggestions; habit co-occurrence insight (observational
  only); `docs/ADAPTIVE.md` requirement map; plan buttons rebuilt on a
  `pp-btn` system with `private-plans.css` split out of `additions.css`.

- Private plans redesign: stat-card grid, visual journey timeline, usage
  bars, hero urge-timer countdown, milestone/trigger chips, emergency and
  support cards (`pp-` design system, 28 ideas); workspace split into
  focused modules (shell/stats, tracker, timer, care) with memoized
  derivations so timer ticks never re-render siblings.

- Efficiency pass: mirror books download + parse once (shared payload
  for Arabic + EN); Quran/hadith search normalizes once per loaded
  corpus instead of per keystroke; offscreen cards skip rendering
  (`content-visibility`); service-worker runtime caches capped at 120
  entries; subtle cross-document transitions where supported.

- Library content: English translations for all 10 full hadith books
  (lazy per-book `eng-*` editions, AR/EN toggle defaulting to UI language,
  EN-aware search; Arabic never waits on English); Tazkirul Quran added
  (3rd English tafsir — all 7 Arabic API tafsirs were already present);
  removed the broken duplicate Nawawi button (it rendered a raw
  translation key); favorites filter label now localized; 123 new CSS
  ideas (59 library + 64 global, logical props, zero `!important`,
  motion-gated).
- Full Musnad Ahmed (1,374 hadiths, EN, partial: chapters 8–30 absent
  upstream and labeled in UI) + full Sunan al-Darimi (3,406 hadiths,
  Arabic-complete, no upstream English) from a pinned bilingual mirror;
  curated cards now link into both full browsers. Tests: mirror mapping +
  EN-derivation suites, tafsir/full-book catalog locks, offline library
  regressions (duplicate-button gone, Ahmed/Darimi chips, Tazkirul source,
  localized fav label).

- Offline-first architecture (STEP 5): feature classification manifest +
  `docs/offline-architecture.md` (storage, sync boundaries, SW contract,
  time handling, failure behavior, airplane-mode checklist); bounded
  external fetches (`net.ts`, 10s) with failure-matrix tests; async
  `StorageAdapter` seam; service-worker offline shell (precached routes,
  navigation fallback, static cache-first, CACHE `wird-v4`) so relaunches
  work in airplane mode; `offline.spec.ts` (10 tests incl. true-offline
  restart); 5-year analytics perf suite; companion restriction project
  recorded as a separate-repo design (`docs/COMPANION_PROJECT.md`, no code).

- Private self-management plans (STEP 4, optional + discreet): per-profile
  plans in abstinence / reduction / time-limit modes with neutral setback
  flow (resets the current run, never erases history), journey timeline,
  trigger + replacement tracking with observational stats, offline urge
  timer, milestones, usage limits, generic reminders, support section with
  optional verified verse. Local-only; excludable from backups with an
  explicit pre-export warning; `sensitive`-classified; full AR/EN copy.
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
