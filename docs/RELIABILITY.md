# Reliability architecture (STEP 7)

When something goes wrong, Wird fails safely, preserves user data,
explains what happened, recovers when possible, and never pretends that
something succeeded when it did not.

Pipeline: **Detect → Contain → Preserve → Recover → Verify → Inform →
Learn.** A failure in one subsystem must not destroy unrelated
functionality (analytics down ≠ tracking down ≠ data lost).

This document is the reliability layer only. It does not repeat the
open-source prep (STEP 3), recovery system (STEP 4), offline design
(STEP 5), or adaptive engine (STEP 6) — it protects all of them, and
points at them where they already do the job.

## Failure domains (7.2) and their bulkheads

| Domain                                        | Isolation mechanism                                                          | Failure looks like                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Route rendering                               | `app/error.tsx` per-route screen + `app/global-error.tsx` last resort        | calm screen + reset + safe-mode entry + `/recovery` link, never blank |
| Widget (companion, analytics layers, readers) | `SectionError` boundary (`app/components/section-error.tsx`)                 | inline recovery card + Try-again + content-free `#errorId`            |
| Storage records                               | schema validation + quarantine + health log (`app/lib/schema.ts`)            | corrupt bytes quarantined (raw kept), never silently dropped          |
| Backup import                                 | two-phase `restoreBackupSafe` + snapshot rollback (`app/lib/crypto.ts`)      | all-or-nothing; mid-failure restores prior state and reports          |
| External content                              | bounded fetch (`net.ts`) + per-host circuit breakers + SW cache              | calm error + manual retry; open breakers fail fast without hammering  |
| Reminders                                     | permission-gated, silent on denial; fatigue pauses instead of nagging        | nothing fires, nothing crashes                                        |
| Transfers                                     | chunk sessions, PIN throttling, exponential backoff, abort on profile switch | explicit errors, staged commits only                                  |
| Multi-tab                                     | no auto-merge; explicit reload banner                                        | banner, never silent overwrite                                        |
| Quota                                         | per-write validation + quota notices + emergency export path                 | named banner, rescue before reset                                     |

## Consistency contract (7.6–7.8)

| Operation           | Guarantee                                     | Notes                                                               |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| Single record write | atomic (validate → write → verify)            | `writeRecord`; quota returns `{ok:false}` + notice, never partial   |
| Backup restore      | atomic via snapshot rollback                  | `restoreBackupSafe`; idempotent — applying twice converges (tested) |
| Daily record merge  | monotonic, idempotent                         | `recordDay` never loses yesterday to an empty today                 |
| Schema migration    | idempotent, offline                           | migrate-on-read; re-running is a no-op (tested)                     |
| QR/LAN assembly     | staged (verify → decrypt → validate → import) | nothing commits before preview + validated restore                  |
| Guide-log write     | best-effort, capped                           | suppressed under opt-out / master-off; loss is acceptable by design |
| CDN loads           | best-effort, bounded, non-retrying            | user-initiated manual retry (no auto-retry loops anywhere)          |
| Decrypt guesses     | throttled, exponential, capped                | `backoffDelay` (deterministic schedule, tested)                     |

Idempotency keys are stable record ids (`dayId`, `full-<book>-<num>`,
`{__wird:{v}}` envelopes) — retries converge instead of duplicating.

## Retry, timeout, breaker policy (7.9–7.11)

- **Timeouts**: every external call goes through `fetchWithTimeout`
  (10s default). Same-origin bundles ride the service worker. Nothing
  waits indefinitely; timeouts land in the existing calm error states.
- **Retries**: user-initiated loads retry by explicit user action (Retry
  buttons) — no background retry loops exist. Decrypt guesses use capped
  exponential backoff. Unknown failures are surfaced, never retried blindly.
- **Circuit breakers** (`net.ts`, one per CDN host, threshold 5 /
  cooldown 30s): repeated failures short-circuit to instant rejection so
  a broken endpoint costs nothing; one trial call probes recovery.
- Failure classes: temporary (timeout/DNS/500 → calm retry UI),
  permanent (404/validation → message, no retry offered),
  user-action-required (permission/quota/pin → explicit next step).

## Degradation levels (7.12)

FULL → PARTIAL (an area shows its recovery card) → LOCAL-ONLY (CDN
features parked) → MINIMAL (safe mode: companion, deep analytics, QR
scan, LAN parked) → RECOVERY SCREEN (`/recovery`, independent of the
main store). Core tracking, library bundles, backups, and settings work
at every level above the last; `/recovery` works even when the store
cannot initialize.

## Safe mode (7.13)

Developer/testable degraded boot for when a new feature breaks startup:
device-global `wird-safe-mode-v1` flag, linkable via `?safe=1` (persisted,
URL cleaned), always-bannered, one-click exit. Enter from the error
screen, the banner, or the URL. Covered by `e2e/reliability.spec.ts`
(parks + core-works + exit). It disables non-essentials only — never a
hidden production control, never automatic.

## Crash safety (7.4–7.5)

- State persists per-key on change, so a crash loses at most the
  in-flight keystroke; reload rehydrates from validated storage.
- Interruption coverage: quota/fuzz/mid-restore-abort/rollback suites run
  in CI (`schema`, `crypto-restore`, `isolation`); restore-twice
  convergence is asserted.
- Diagnostics are content-free: random `#id` / Next `digest` only. No
  messages, keys, or records ever reach logs, errors, or reports
  (`console.*` banned in `app/`, error screens never render
  `error.message`).
- Real errors are never hidden to look healthy: recovery cards name the
  failed area; the global screen names the fallback ladder
  (retry → safe mode → recovery environment).

## What to extend (not duplicate)

- New external host → `net.ts` breaker + `NETWORK.md` + `privacy.ts` +
  SW rule + calm UI state + failure-matrix tests (the tafsir/hadith
  pattern).
- New multi-step mutation → classify it in the consistency table above
  and test the unhappy path (quota/failure injection like
  `crypto-restore.test.ts`).
- New widget area → wrap in `SectionGuard` if its failure must not take
  the route with it.

## Broken configuration (7.14)

Configuration here is per-dataset validation, not a global config file
— so malformed config cannot take down startup. Every read validates:
valid → use; recoverable (legacy bare shapes, older versions) → migrate
on read; invalid → fallback default + quarantine the raw bytes; unknown
(future versions) → preserved untouched, never reinterpreted. New writes
are always enveloped and versioned. Resetting one dataset (surgical
reset on `/recovery`) never touches the others, and user data is never
destroyed because a setting failed to parse.

## Corruption model (7.15–7.16)

`scanDatasets` classifies every stored key as `ok | legacy | migrated |
quarantined | future | unknown` — the required Valid / Recoverable /
Invalid / Unknown taxonomy, enforced by `DatasetStatus`. Repair follows
the pipeline strictly: detect (read-path validation) → diagnostic
record (health log) → preserve original (quarantine raw, capped, never
overwritten) → attempt safe repair (migrate/normalize/salvage) →
validate the result → commit only if valid. Blind overwrites of
potentially recoverable data do not exist in this codebase.

## Migrations (7.17–7.18)

- Versions are explicit: every `SCHEMAS` entry carries `version`, every
  write is enveloped `{__wird: {v, updatedAt}}`. No heuristics — the app
  knows exactly what it has.
- Migrations are non-destructive by construction (unknown fields spread
  forward, never stripped), pure, synchronous, and offline. There is no
  "mark complete" flag because there is no migration transaction to
  half-finish: migrate-on-read is idempotent (re-running is a no-op,
  tested), and anything unmigratable quarantines instead of blocking.
- Rule: a migration must never need the network, must never delete
  source data before the migrated form validates, and must keep reading
  the previous shape forever (v0 bare values still read today).

## Disaster scenarios (7.19)

| Scenario                    | Detection                                | Impact               | Recovery                                                                                                                        | Data loss?                                                | Told how                        |
| --------------------------- | ---------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------- |
| App crash (render)          | boundary / error screens                 | one area or route    | reset, safe mode, `/recovery`                                                                                                   | none (per-key persistence)                                | calm screen, no loss claims     |
| Storage corruption          | read-path validation                     | single dataset       | quarantine + salvage + fallback                                                                                                 | only truly unparseable bytes (kept as quarantine raws)    | health counts on `/recovery`    |
| Failed migration            | validation after migrate                 | dataset falls back   | previous shape still reads; quarantine                                                                                          | none                                                      | diagnostics                     |
| Bad release                 | user report / CI                         | varies               | Vercel instant rollback to prior deployment; `?safe=1` mitigation; fix-forward release                                          | none (storage is forward/backward tolerant within majors) | release notes                   |
| Broken dependency           | audit / e2e / breaker trips              | CDN feature degrades | breaker cooldown + cached copies; pin swap in a patch                                                                           | none (local data untouched)                               | calm retry UI                   |
| Server/network outage       | fetch rejection                          | CDN features park    | SW cache + bundled fallbacks; retries are user-initiated                                                                        | none                                                      | calm error states               |
| Auth outage                 | n/a — no accounts, no server auth        | —                    | —                                                                                                                               | —                                                         | —                               |
| Sync conflict               | n/a — no sync, no auto-merge             | —                    | explicit reload banner                                                                                                          | impossible by design                                      | banner                          |
| Accidental deletion         | user report                              | dataset/profile gone | pre-wipe rescue snapshot (auto-downloaded); backups; quarantine survives wipes                                                  | only if user also deleted backups                         | wipe confirms say so explicitly |
| Invalid configuration       | schema validation                        | dataset defaulted    | surgical reset; original quarantined                                                                                            | none                                                      | `/recovery` statuses            |
| Unexpected browser behavior | hydration/pageerror listeners (fail e2e) | varies               | error screens + safe mode                                                                                                       | none                                                      | calm screens                    |
| Device restart              | —                                        | process gone         | relaunch rehydrates from validated storage; in-memory-only state (vault keys, transfer sessions) intentionally does not survive | by design: session secrets                                | documented where each lives     |

## Backup taxonomy (7.20–7.22)

- **Primary**: live `localStorage` datasets (authoritative truth — stated here, enforced by schema tests).
- **Backup**: user-initiated files/QR/LAN (versioned manifest + integrity checksum).
- **Recovery snapshot**: per-operation rollback copies (restore), quarantine raws (forensics), and the automatic pre-wipe emergency download.
- **Export**: diagnostics/emergency files (counts + recoverable data, integrity-reported).
- **Cache**: SW runtime caches, module fetch caches, memoized derivations — never treated as backups, never restored from.
- **Derived analytics**: computed views (heatmaps, trends, insights) — never authoritative, recomputed from primary.
- Backups are verified, not theoretical: `previewRestore` dry-runs classification before a byte is written, and the preview↔restore agreement is asserted in CI (applied + skipped always equals previewed total).
- Point-in-time recovery = the automatic pre-wipe rescue snapshot + user backups + per-operation rollback. No scheduled daemon snapshots (no background processes exist to run one); no dangerous recovery controls are exposed — wipe is double-confirmed and still leaves a rescue file.

## Deletion semantics (7.23)

Three honest tiers, each explicit in UI: **surgical reset** (one dataset
→ fallback; quarantine kept for forensics) · **profile delete** (profile
keys + its quarantine raws purged; health entries carry no payload and
stay) · **full wipe** (everything except quarantine/health, double
confirmed, rescue snapshot downloaded first). We promise recovery only
where the mechanism exists; the wipe dialog says plainly that without a
backup there is no undo.

## Release + feature rollback (7.24–7.25)

- Every release is a Vercel deployment: rollback is one click to the
  prior deployment; storage tolerates version skew (envelopes +
  future-version preservation), so rollback never corrupts data. Never
  assume newest is correct — pin, verify (`diagnose` + e2e + audit),
  then promote.
- Risky features park independently without a flag bureaucracy:
  safe mode disables companion card, analytics deep layers, and QR
  scan/LAN transfer individually-addressable in one place
  (`useSafeMode` call sites). No megasystem of flags; the flags doc
  (`FEATURE_FLAGS.md`) stays empty until a flag earns its keep.

## Health, readiness, shutdown, jobs (7.26–7.31)

- Health checks that actually probe: `probeStorage()` writes + deletes
  a transient key (never "healthy because running");
  `summarizeReadiness()` composes storage + future-version +
  quarantine-capacity into a verdict with named notes. Surfaced through
  the existing per-dataset statuses (same numbers, no new screen).
- Liveness vs readiness: liveness = routes render; readiness = storage
  writable + no foreign versions + quarantine headroom. Boot never
  blocks on failed checks — the app degrades to explicit messaging.
- Shutdown: nothing to flush — every mutation persists synchronously at
  write time; session-only state (vault keys, transfer sessions, timer
  handles) is intentionally ephemeral, and transfer components close
  sessions on unmount.
- Background jobs: none exist (no queues, workers, or daemons). The
  closest things — hourly SW update checks, mount-evaluated reminder
  ladder (idempotent via the 1/day key), in-tab timers — cannot
  duplicate, loop forever, or conflict: single-flight per mount,
  day-keyed, tab-scoped. If a job system ever appears, it inherits this
  section's rules (queued/running/completed/failed/cancelled/retrying,
  retry-safe-only, watchdog on stuck tasks).

## Resource + performance protection (7.32–7.34)

Bounded by construction (graceful failure past every bound):

| Vector           | Bound                                       | Overflow behavior                                |
| ---------------- | ------------------------------------------- | ------------------------------------------------ |
| Quarantine       | 20 entries, 4KB raws                        | oldest drops (raws are forensics, datasets safe) |
| Health log       | 50 entries                                  | oldest drops                                     |
| Guide log        | 30 entries, 3-day suppression               | repeats suppressed, then dropped                 |
| Export log       | 50 entries                                  | oldest drops                                     |
| Plans lists      | 5000 setbacks max, 730-day detail retention | pruned on save                                   |
| Adhkar log       | 180-day window                              | rolls off                                        |
| QR transfer      | 600 chunks (~1MB)                           | refuses with explicit error (use files)          |
| LAN transfer     | 8 parts, 32MB                               | refuses with explicit error                      |
| CDN fetch        | 10s timeout + breaker (5 fails / 30s cool)  | instant calm failure                             |
| SW runtime cache | 120 entries                                 | oldest evicted                                   |
| Storage quota    | 5–10MB device                               | named banner + emergency export path             |

Histories/reviews grow one record per day max (human-bounded, tiny);
custom lists are user-created and small. Performance is asserted, not
hoped: `analytics-perf` (5-year budgets), large-dataset suites
(2000-record validation, 500-key restore, 7000-record search), and the
3-year-history e2e prove realistic scale. A feature that freezes the app
fails these gates the same as a crash.

## What to extend (not duplicate)

- New external host → `net.ts` breaker + `NETWORK.md` + `privacy.ts` +
  SW rule + calm UI state + failure-matrix tests (the tafsir/hadith
  pattern).
- New multi-step mutation → classify it in the consistency table above
  and test the unhappy path (quota/failure injection like
  `crypto-restore.test.ts`).
- New widget area → wrap in `SectionGuard` if its failure must not take
  the route with it.

## Appendix: incident timeline + postmortem templates (audit §44–46)

Local-first means most "incidents" are user-side (corrupt profile,
failed transfer, stuck SW). Copy the timeline while debugging; file the
postmortem for anything that touched user data or needed a release.

Timeline (fill during the incident):

```text
date/time (UTC):
reporter + device/browser:
symptom (user words):
repro (exact steps):
scope (one profile / all profiles / one device):
data at risk? (yes/no + which keys):
mitigation given to the user:
root cause (after):
fix + test that locks it:
```

Postmortem (within a week for data-touching incidents):

```text
title + date:
severity (P0/P1/P2) + why:
what happened (3 lines max):
why it wasn't caught (which gate was missing):
fix (code + test file):
docs updated:
follow-ups (owner + date):
```
