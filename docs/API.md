# Internal API / contracts

Public-ish interfaces a contributor will call or implement. "Public" here
means _safe to call from features and views_ — there is no external API
server. Full source is the ground truth; this doc records the contracts so
you know what is stable, what each call does to storage, and what it is
allowed to do (privacy).

Layer rules (docs/ARCHITECTURE.md): `lib/*` never imports
`components/*`; `schema.ts` imports nothing project-internal; components
touch storage only through the named modules.

## Storage adapter surface

| signature                                           | input             | output                        | errors                  | side effects                                             | privacy                                         |
| --------------------------------------------------- | ----------------- | ----------------------------- | ----------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| `loadFromStorage<T>(key, fallback)` (`lib/wird.ts`) | profile-aware key | validated value or `fallback` | never throws            | none (read)                                              | reads through schema → quarantine on corruption |
| `saveToStorage(key, value)`                         | key + value       | —                             | throws on quota/failure | schema-enveloped write, updates `{__wird:{v,updatedAt}}` | writes with day-guard for daily keys            |
| `useStoredState<T>(key, fallback)`                  | key + default     | `[value, setter]`             | —                       | hydration-safe setter                                    | never reads during render (hydration rule)      |
| `readQuarantine()/readHealth()`                     | —                 | entries / snapshot            | returns `[]`/snapshot   | none                                                     | —                                               |

## AnalyticsEngine (`lib/analytics.ts`, pure)

| fn                         | input                     | output                                               | complexity                                                   |
| -------------------------- | ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| `computeAnalytics(params)` | windows/ranges + datasets | `AnalyticsSnapshot` (day/trend/heatmap/… normalized) | documented per window; linear in windows, see PERFORMANCE.md |
| `getTrend(metric, period)` | metric id + period        | normalized {prev, curr, deltaClass, honestLabel}     | O(window)                                                    |
| `suggestMilestones` …      | history                   | milestone list                                       | O(distinct values)                                           |

Errors: all signatures are defensive (return neutral/null on bad shapes —
callers render "not enough data" honestly rather than guessing). Side
effects: none. Privacy: pure local transform, nothing leaves.

## CoachEngine / companion (`lib/coach.ts`, `lib/companion.ts`)

| fn                             | contract                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `coachBrief(snapshot, dayRec)` | input analytics+day → `CoachState` + short brief string (ids, not raw text, resolved via i18n) |
| `companionState(params)`       | input history/alerts/absence → `CompanionState` (26-state)                                     |

Errors: null-safe on missing history (a fresh user gets a "beginning" not
statistics — e2e asserts this). Side effects: the _guide component_ writes
to `wird-guide-log-v1` (capped); the engine itself is pure. Rules: copy
must pass the `guidance-safety` scan; religion verbs in datasets only.

## Storage engine / backup (`lib/crypto.ts`)

| fn                                                           | contract                                                                                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `collectBackup(scope?)` / `collectBackupFor(profileId)`      | gather all (or one profile + globals) keys → `Record<string,string>`                                                                             |
| `buildBackupFile(data, scope)`                               | → manifest v2 `{v:2,app,format,count,datasets,scope,data}`                                                                                       |
| `restoreBackupSafe(data)`                                    | → `RestoreReport` {applied, skipped, quarantined, rolledBack, details}; atomic with rollback; throws `"no valid wird keys"` when nothing applied |
| `previewRestore(data)`                                       | dry run → counts, touches nothing                                                                                                                |
| `encryptBackup(pass, payload)` / `decryptBackup(pass, text)` | AES-256-GCM envelope; auth covers integrity                                                                                                      |
| `verifyBackupIntegrity(data)`                                | plain-backup tamper detect (checksum)                                                                                                            |
| deprecated `restoreBackup(data)`                             | → applied count only; **use `restoreBackupSafe`**                                                                                                |

Side effects: `restoreBackupSafe` writes storage + quarantine when
corrupt entries exist (never deletes). Privacy: quarantined content
respects the 30-day TTL; profile remap only after explicit confirm.

## Repository-ish modules

- `lib/quran.ts` — `loadQuran()` / `loadEnglish()` (same-origin corpus),
  `searchAyahs`, `ayahKey(surah,ayah)`; pure search (linear over mushaf).
- `lib/hadith-full.ts` — CDN-backed hadith edition loader with
  module-level cache; **network** (NETWORK.md row).
- `lib/tafsir.ts` — bundled Jalalayn (`/data/ar-jalalayn.min.json`) +
  optional Quran.com tafsir fetch (**network**, user opt-in).
- `lib/audio.ts` — `ayahAudioUrl(reciter, surah, ayah)` (**network**,
  opt-in playback).
- `lib/recovery.ts` — wordlist, mnemonic↔entropy, salted verifier
  create/check, `saveVerifierSalted`. Never stores words.
- `lib/vault.ts` — `setupVault/unlockVault/lockVault/readVaultText/
writeVaultText/disableVault`; AES-GCM-256; forgetting passphrase is
  irreversible loss (stated to the user during setup).
- `lib/transfer.ts` — pure chunk/encode/checksum helpers
  (`chunkPayload`, `encodeChunk`/`decodeChunk`, `assembleChunks`,
  `payloadChecksumWords`, `backoffDelay`). No storage, no side effects.
- `lib/lan.ts` — WebRTC offer/answer helpers (no STUN/TURN), bounded
  payload sizes, local-transfer only.
- `lib/notify.ts`, `lib/share.ts` — explicit allowlists: notifications
  (user consent) and share payloads (aggregates only, no raw records).

## LocalizationService (`lib/i18n.ts` + `lib/strings.ts`)

- `useT()` → `(key, params?) → string` (AR/EN, `{n}` interpolation).
- `Lang` type drives direction; new languages = new dictionary section +
  `Lang` union (docs/HOW_TO_ADD_A_LANGUAGE.md).
- Parity + key freshness are CI gates (`docs:check`).

## Error policy (shared by all contracts)

- Storage unavailable → functions return safe fallbacks; `useStoredState`
  degrades to in-memory so the app still renders.
- Corrupt record → quarantine, app continues (see docs/ERROR_HANDLING.md).
- Missing translation key → key name is returned (visible in dev, caught
  by parity gate before release) — never a crash.
- Invalid Quran/hadith reference → null result + "not found" UI state.
- Migration failure → schema keeps original bytes in quarantine and
  serves fallback; never silently discards.

## Stability / deprecation

See docs/VERSIONING.md. Contracts above marked "pure"/"no side effects"
are the ones a subsystem-replacement PR should preserve; anything else
may change with a documented deprecation window.
