# Data inventory (source of truth for the Privacy Policy)

Every personal-data field in Wird. All storage is client-side
`localStorage` (per-profile `p_<id>_` prefix except device-global keys);
processing is on-device; third-party sharing is **none** except the
explicit opt-in content fetches in the last rows. Legal basis where
applicable: user-initiated local processing (no accounts, no tracking);
see `PRIVACY_POLICY.md` and `docs/ADAPTIVE.md` for consent surfaces.

Conventions: Retention "until deleted" = persists until wipe / profile
delete / surgical reset. Export "backup" = included in user-initiated
backup files/QR/LAN unless excluded. Deletion = via Account, `/recovery`
surgical reset, or full wipe (plus diagnostics clear for forensic stores).

## Daily practice (auto-reset envelopes)

| Field                                                                                                                                                                     | Purpose                                         | Sensitivity                                 | Retention / deletion                    | Export |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------- | --------------------------------------- | ------ |
| `wird-done-v2`, `wird-quran-pages-v2`, `wird-tasbeeh-v2`, `wird-salawat-v2`, `wird-fast-v2`, `wird-forget-v2`, `wird-reflection-v2`, `wird-partial-v2`, `wird-snoozed-v2` | today's counts/texts                            | private (reflection text: highly_sensitive) | daily rollover; history merge for pages | backup |
| `wird-adhkar-groups-v1`, `wird-lastseen-v1`, `wird-notify-day-v1`                                                                                                         | adhkar state, last-open day, 1/day reminder cap | private                                     | rolling / overwrite                     | backup |

## Catalogs, goals, plans (persistent)

| Field                                                                                                                                                                         | Purpose                                       | Sensitivity         | Retention / deletion                                        | Export                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| `wird-customs-v1`, `wird-duas-v1`, `wird-goals-v1`, `wird-intention-v1`, `wird-qada-v1`, `wird-breaker-v1`, `wird-challenges-v1`, `wird-ramp-v1`, `wird-friday-plan-v1`       | user content + goals                          | private             | until deleted                                               | backup                                    |
| `wird-quran-bookmark-v1`, `wird-quran-mem-v1`, `wird-quran-font-v1`, `wird-quran-en-v1`, `wird-reciter-v1`, `wird-tafsir-src-v1`                                              | reader prefs + marks                          | private             | until deleted                                               | backup                                    |
| `wird-hadith-fav-v1`, `wird-hadith-read-v1`, `wird-paths-v1`, `wird-paths-custom-v1` (sensitive), `wird-dreams-v1` (sensitive), `wird-kids-v1`, `wird-pledges-v1` (sensitive) | library state                                 | private/sensitive   | until deleted                                               | backup                                    |
| `wird-history-v1` (sensitive), `wird-reviews-v1` (private), `wird-adhkar-log-v1` (private, 180-day cap), `wird-guide-log-v1` (sensitive, 30 entries)                          | history + adaptive memory                     | see class           | history unbounded by days (human-bounded); guide-log capped | backup                                    |
| `wird-remind-v1` (boolean prayer-reminder toggle)                                                                                                                             | prayer reminder on/off                        | private             | until deleted                                               | backup                                    |
| `wird-recovery-plans-v1` (sensitive), `wird-private-plans-excluded-v1`                                                                                                        | self-management plans + backup-exclusion flag | sensitive / private | until deleted; pruned detail >730d, setbacks kept           | backup unless excluded                    |
| `wird-vault-v1` (highly_sensitive), `wird-recovery-v1` (sensitive verifiers only, never phrases)                                                                              | encrypted reflections; PIN-reset verifiers    | see class           | until deleted                                               | backup (verifiers; vault ciphertext only) |

## Device-global preferences and identity

| Field                                                                                                                                 | Purpose                               | Sensitivity | Retention / deletion | Export |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------- | -------------------- | ------ |
| `wird-profiles-v1`, `wird-active-profile`                                                                                             | local profiles (name/avatar/PIN hash) | private     | until deleted        | backup |
| `wird-theme-v1`, `wird-lang-v1`, `wird-reminders-v1`, `wird-mosque-v1`, `wird-prayer-times-v1`, `wird-autolock-v1`, `wird-daymode-v1` | preferences                           | public      | until deleted        | backup |
| `wird-pinlock`, `wird-pinlock-*`                                                                                                      | lockout counters                      | private     | until deleted/unlock | backup |
| `wird-unlocked` (sessionStorage)                                                                                                      | unlock session flag                   | private     | tab session only     | never  |
| `wird-travel-v1`                                                                                                                      | hidden profile ids                    | private     | until deleted        | backup |
| `wird-privacy-names-v1`, `wird-analytics-optout-v1`, `wird-personalize-v1`, `wird-safe-mode-v1`                                       | privacy/adaptation/boot prefs         | private     | until deleted        | backup |
| `wird-last-backup-v1`, `wird-export-log-v1` (kind/timestamp/count only)                                                               | backup memory + consent log           | private     | until deleted        | backup |

## Forensic / operational (no user content by design, except quarantine raws)

| Field                                     | Purpose                  | Sensitivity                          | Retention / deletion                                         | Export                                         |
| ----------------------------------------- | ------------------------ | ------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------- |
| `wird-quarantine-v1` (last 20, 4KB raws)  | corrupt-record forensics | internal (raws may carry user bytes) | until cleared; survives wipe (explicit clear in data-health) | emergency only; diagnostics export scrubs raws |
| `wird-health-v1` (last 50, metadata only) | event log                | internal                             | until cleared                                                | diagnostics (metadata)                         |

## Optional network fetches (opt-in, no personal data sent)

| Data                                 | Trigger                         | Sent                         | Received                  | Disable                   |
| ------------------------------------ | ------------------------------- | ---------------------------- | ------------------------- | ------------------------- |
| Hadith editions (`cdn.jsdelivr.net`) | opening a full book / EN toggle | book id only                 | edition JSON (SW-cached)  | stay offline / don't open |
| Tafsir (`api.quran.com`)             | opening a non-bundled tafsir    | source id + surah:ayah       | passage (SW-cached)       | use bundled Jalalayn      |
| Audio (`everyayah.com`)              | playing recitation              | reciter id + surah/ayah      | MP3 stream (never cached) | don't play                |
| WebRTC LAN                           | transfer card                   | AES-GCM backup to own device | same                      | don't use                 |

No other data leaves the device. Ever. Verified by `docs/NETWORK.md`,
`app/lib/privacy.ts`, CSP, and CI gates.
