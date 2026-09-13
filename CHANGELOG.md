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
