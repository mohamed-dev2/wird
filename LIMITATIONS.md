# Limitations

Honest boundaries of what Wird does, knows, and promises. Nothing here
is a silent gap: each item states the limit, why it exists, and what
would remove it. Effective 2026-09-14; STEP 10 items marked **(STEP 10)**.

## Platform and data

- **Device clock is trusted.** Day identity, streaks, and rollover derive
  from the device clock. Travel, timezone changes, or a wrong clock can
  distort streaks and day records. There is no server clock to consult,
  and inventing one would be surveillance-adjacent
  (`docs/offline-architecture.md`).
- **Storage quota.** `localStorage` holds roughly 5–10 MB (less on some
  mobiles). Near-quota datasets fail loudly with a user-visible message;
  exports are the only backup path.
- **At-rest protection boundary.** Local data is plaintext-equivalent
  under OS disk encryption. Only the optional reflection vault is
  encrypted at rest — and a forgotten vault passphrase means permanent
  loss, by design. Profile PIN + OS lock screen are the documented
  boundary (`SECURITY.md`).
- **Backups in user hands.** Exported files, screenshots, and OS-level
  backups are outside the app's control; "delete" removes app storage,
  not copies the user made.
- **Forensic remnants.** Quarantine raws (up to 4 KB each) survive a wipe
  by design and need the explicit data-health clear.

## Verification and review

- **Chromium-only CI.** Automated tests run on Chromium. Safari/Firefox
  and screen-reader passes (VoiceOver/TalkBack) need an owner device
  pass pre-release (`docs/ACCESSIBILITY.md`).
- **No memory soak in CI.** Long-session behavior is review-based, not
  soak-tested (`docs/RELIABILITY.md`).
- **Professional review pending.** Legal (privacy, PDPL, minors,
  licensing, terms), mushaf edition confirmation, translation rights,
  tafsir/audio terms — all open items, not closed claims
  (`docs/COMPLIANCE_MATRIX.md`, `CONTENT_RIGHTS.md`).
- **Religious-content certification.** The app traces content to sources
  and grades; it cannot theologically certify anything. Scholar review
  is an owner action, not a CI property.

## Product scope

- **No third language.** AR/EN only; a third language needs direction +
  root plumbing (TD-1).
- **No OS-level enforcement.** Website/app blocking lives in the
  separate companion project, never in Wird
  (`docs/COMPANION_PROJECT.md`).
- **Deprecated restore path.** `restoreBackup` remains beside
  `restoreBackupSafe` until the next major (TD-2).
- **SBOM is manual.** Generation is a script, not a CI release job (TD-5).
- **Reproducibility is toolchain-pinned.** Byte-for-byte builds hold
  within `package-lock.json` + Node 22, not across tool versions.
- **Quran reader screen-reader navigation.** No virtual-cursor mode yet
  (TD-3). e2e stays serial on weak machines (TD-4).

## STEP 10 — Deen levels, deeds, gamification

- **Levels are tracking depth, not rank.** Deen Levels 1–5 describe which
  categories the user chose to track. They are not faith rank,
  righteousness, closeness to Allah, or divine reward — the UI and copy
  say so, and tests assert the banned phrasing never ships.
- **XP is application progress.** Wird XP measures in-app activity only.
  The app never calculates hasanat, divine reward, faith percentages, or
  religious scores; no leaderboard, no sin counter, no "faith streak".
- **Catalog classifications are summaries, pending review.** The
  mustahabb / makruh-awareness / haram-awareness entries follow
  widely-taught summaries and carry per-item sources, but they await the
  religious-content reviewer sign-off like all curated content
  (`CONTENT_RIGHTS.md`). Rows are flagged, not certified.
- **Schools differ.** Fiqh classifications vary between frameworks; the
  learning cards say so, and per-item school notes mark where variance
  is known. Nothing is presented as the only possible framework.
- **Personal goals are not rulings.** Time, speech, and eating discipline
  items are personal-development goals unless individually sourced as
  otherwise. The data model separates verified classification from
  personal goal / habit / general advice, and tests enforce it.
- **Streaks measure recorded days.** A streak counts days the user
  recorded the tracked action — including through device-clock limits
  above. Ending a streak is never punished; return copy is shame-free.
- **Reflection notes are short and structured.** Deen reflections use
  fixed options plus short optional notes (not open journaling); the
  dataset is `sensitive`-classified, firewall-guarded, and never enters
  analytics, shares, notifications, or exports except user backups.
- **Young-user examples are neutral.** Gaming, scrolling, TV, anger,
  arguments, wasting time, overeating — never adult-only, graphic,
  medical, or diagnostic content. No diagnosis, no outcomes promised.
- **No AI in the Deen system.** No model invents hadith, verses,
  references, rulings, or classifications. Catalogs are curated data;
  reviewer sign-off is required before merge.
