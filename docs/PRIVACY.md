# Privacy model

Wird is **100% on-device**. This file states exactly what stays, what can
leave, and through which user action — so any future change can be checked
against it. The user-facing policy with rights, retention, and contacts
is `../PRIVACY_POLICY.md` (also served in-app at `/privacy`).

## Never leaves the device except by explicit user action

Habit history, Quran progress and bookmarks, memorization marks, adhkar
counts, duas, goals, challenges, pledges, reflections, gratitude, mood,
reviews, fasting and qada records, profiles and PIN hashes, recovery
verifiers, absence history, guide log, quarantine and health logs,
analytics results, deen journey records (levels, quests, reflections).

There are no analytics SDKs, no tracking pixels, no crash reporters phoning
home, no AI APIs, no accounts, no servers. `grep console\.` over `app/`
must stay empty (CI-linted culture, review-enforced).

## What CAN leave, and only when the user initiates it

| Action                 | Leaves the device                       | Notes                                            |
| ---------------------- | --------------------------------------- | ------------------------------------------------ |
| Plain backup export    | All `wird-*` data as JSON               | User-saved file                                  |
| Encrypted backup       | Same, AES-GCM + PBKDF2-120k             | Password lives in memory only                    |
| QR transfer            | Encrypted+gzip manifest                 | Camera-scanned, PIN-protected                    |
| LAN transfer           | Same payload                            | Serverless WebRTC, same Wi-Fi                    |
| Emergency export       | Recoverable data + corruption report    | From `/recovery`                                 |
| Diagnostics export     | Counts + quarantine/health (no content) | From data-health card                            |
| Share image            | Stats the user chose to share           | Stats only — never reflections, mood, or history |
| Tafsir/audio/CDN fetch | Nothing personal (anonymous GETs)       | Quran text, tafsir, reciter MP3s                 |

## Boundaries that must hold

- Reflections and the night journal are excluded from statistics by
  design (`night.journalNote`) and must never enter exports, shares, or
  analytics inputs.
- Deleting a profile purges its quarantine raws too (they can hold up to
  4KB of that profile's data).
- Names are hidden on lock/login screens when enabled (Account → privacy
  → `wird-privacy-names-v1`); PIN fields opt out of autocomplete and
  spellcheck.
- The tab blurs its content while hidden (`body.tab-hidden`), so task
  switchers and screen shares show nothing legible — without locking the
  session (transfer copy-paste keeps working).
- Transfer codes auto-clear from the clipboard after 60s.
- Trivial PINs (1234, repeats, runs) are rejected at set-time.
- Plain export and wipe re-verify the profile PIN inline when one is set.
- Recovery verifiers are per-profile salted; legacy unsalted hashes still
  verify (backward compatible, never downgraded).
- Plain backups carry a tamper-evident checksum (`integrity`); imports
  reject mismatches before touching storage (encrypted backups rely on
  GCM auth instead). The checksum is NOT cryptographic — it catches
  accidents and casual edits, documented as such in code.
- The import pre-flight names how many profiles a backup contains.
- Quarantine and health logs auto-expire entries older than 30 days on
  write (forensics, not a shadow archive).
- Personalization can be paused (`wird-analytics-optout-v1`): no guide
  log is written.
- Voice logging was REMOVED (not disabled): browser speech recognition
  sends audio to vendor cloud servers, which cannot stay private. The
  microphone is denied by `Permissions-Policy`.
- Duress PIN (optional, off by default): a second PIN that opens a shared
  blank decoy profile. Explained in full before setting; must differ from
  the real PIN; never counts against lockout; real data stays locked.
- Reflection vault (optional, strongly discouraged in UI): AES-GCM with
  session-only keys; a forgotten passphrase = permanent loss, stated
  upfront; setup demands an explicit warning confirm + a prior backup.
- Recovery phrases are shown once, never logged, never persisted (only
  the verifier), and never grant access by themselves.
- Analytics inputs never leave; the only analytics artifact that can
  leave is the optional counts-only summary inside a user-initiated
  diagnostics/emergency export.
- Backup/restore is whole-device by design; imports never merge across
  profiles silently (async imports abort if the active profile changes
  mid-decrypt).

## Verifying

- `npm audit` clean; 5 runtime deps (`next react react-dom qrcode jsqr`).
- Trace any new network call: only CDN/API allowlisted fetches (Quran
  data, tafsir, audio) plus same-origin bundle fetches are acceptable.
- Trace any new storage key: it must be named in `DOCUMENTATION.md` §4
  (`docs:check` enforces this in CI).
