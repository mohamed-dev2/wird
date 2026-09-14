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
