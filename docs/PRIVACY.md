# Privacy model

Wird is **100% on-device**. This file states exactly what stays, what can
leave, and through which user action — so any future change can be checked
against it.

## Never leaves the device except by explicit user action

Habit history, Quran progress and bookmarks, memorization marks, adhkar
counts, duas, goals, challenges, pledges, reflections, gratitude, mood,
reviews, fasting and qada records, profiles and PIN hashes, recovery
verifiers, absence history, guide log, quarantine and health logs,
analytics results.

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
