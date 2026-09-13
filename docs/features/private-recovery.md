# Private plans (STEP 4) — anonymous self-management system

Optional, privacy-first self-management inside Wird for users who want to
privately work on reducing or stopping a behavior they personally find
difficult to control — or any ordinary personal goal (e.g. "gaming ≤ 90
minutes/day"). The app **never diagnoses**; the user decides what to work on.

- Route: `/private-plans` (deliberately unlisted from nav/sitemap; reached
  from Account → privacy, or by direct navigation).
- Core module: `app/lib/private-plans.ts` (pure, framework-free, unit-tested).
- Views: `app/components/views/private-plans.tsx` (list/create),
  `app/components/views/private-plan-detail.tsx` (plan workspace).
- Copy: `pp.*` keys in `app/lib/strings.ts` (AR/EN parity enforced).

## Contract (what the system promises)

- **Optional & discreet**: no onboarding, no advertising, no "do you have
  an addiction" prompts. Discreet mode (default) shows generic names
  ("Private Plan A") outside an opened plan.
- **No identity**: works through the existing local profile system. No
  name, email, phone, or account required. No label required either.
- **Local-first & offline**: plans, counters, history, triggers,
  replacements, notes, milestones — all on-device, all offline (including
  the urge timer).
- **No telemetry/ads/AI**: no analytics SDK on these screens, no
  advertising use, no cloud AI. The companion/analytics engines never read
  plan data; plan data never enters share cards, dashboards, or widgets.
- **Reset ≠ erase**: a setback restarts the _current run_ only. Runs,
  longest/average/total stats, and the journey timeline are preserved.
- **Neutral language**: "Your current run restarted. Your previous progress
  remains in your history." Never "you failed / ruined everything / back to
  zero". Milestones say "N days completed in your current plan" — never
  "you defeated your addiction".
- **Observational analytics only**: "appears in N of your recorded
  setbacks", "helped A of U times in your records". Never causal or medical
  claims ("X causes your behavior", "strategy Y is effective treatment").
- **Not treatment**: UI and docs call this _private self-management_. Not a
  diagnosis, not medical treatment, not a substitute for professional help.
  No instructions for obtaining/producing/dosing/concealing drugs — the
  feature tracks and supports, never facilitates. Medical emergencies are
  directed to local emergency numbers, never handled in-app.

## Data model (`wird-recovery-plans-v1`, per-profile, schema v1)

One plan: id, optional name/category, mode (`abstinence` | `reduction` |
`time-limit`), start day, discreet + reminder flags, reasons, triggers,
replacements, milestones (default 1/3/7/14/30/60/90, customizable),
daily/weekly minute limits, setback days (+ optional trigger/note/next per
setback), check-ins, usage logs, trigger logs, strategy logs (with
helped true/false/null), optional trusted-person name, Islamic-support flag.

- Dated detail records prune after 730 days on save; **setback days are
  history and are never pruned**.
- Second key: `wird-private-plans-excluded-v1` (device-global boolean).
  When on, `collectBackup()` (file, QR, LAN) and `buildEmergencyExport()`
  skip private-plan datasets. Plain/encrypted file exports additionally ask
  for explicit confirmation whenever plans exist and are not excluded
  (`pp.exportWarn`).

## Flows

- **Create**: name/category optional (blank → "Private Plan A/B/…"),
  mode + optional limits. Nothing is shared, ranked, or sent.
- **Check in**: one tap per day + optional note.
- **Setback**: optional trigger ("Prefer not to say" always offered),
  optional note, optional next action → affirmation → history preserved.
  The trigger is stored once (in that setback's metadata) so statistics
  count it exactly once.
- **Urge timer**: 5/10/20/custom minutes, fully offline; afterwards an
  optional "did waiting help?" records a strategy observation.
- **Emergency box**: leave this screen (→ neutral home), open the timer,
  back to plans. Quick exit exists on every screen of the feature.
- **Reminders**: per-plan opt-in, permission only on explicit enable, text
  is fixed and generic ("Private plan / Your private plan is ready for
  today's check-in.") — no names, counts, or categories, fired at most once
  per session-day. Default off.
- **Support**: optional trusted-person _name only_ (Wird never contacts
  anyone), emergency-number note, optional verified-verse toggle (resolved
  at runtime from the bundled Quran via `content.ts`; renders nothing when
  unresolvable — same authenticity rule as everywhere else).
- **Delete**: explicit confirm spelling out the honest limit — removed from
  app storage; copies outside the app (disk, OS backups, exported files)
  are outside the app's control.

## Privacy engineering (threat model → mitigation)

| Threat                                          | Mitigation                                                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Someone borrowing the device / shoulder-surfing | discreet names, generic reminders, quick exit, existing profile PIN + auto-lock gate the route                   |
| Notification preview / lock screen              | fixed generic text, no counts/categories; default off                                                            |
| Browser history / URL leakage                   | no query params, no sensitive path segments, generic document title                                              |
| Logs / crash reports                            | zero `console.*` in `app/` (lint rule); generic error strings (`pp.saveFail`, `pp.exportWarn` carry no category) |
| Exported backup opened by someone else          | exclusion toggle + pre-export explicit warning                                                                   |
| Screenshots / app switcher                      | quick exit; discreet list (no details without opening)                                                           |
| Malicious extension with storage access         | out of scope per `SECURITY.md` (same as all local data); plans are `sensitive`-classified in `privacy.ts`        |
| Developer debugging                             | no fixtures/seed/demo data for this feature anywhere (tests + e2e use "Private Plan A" only)                     |
| Compromised device / forensic access            | out of scope per `SECURITY.md`; deletion limits stated honestly in the confirm dialog                            |

Honest promise (what we claim, exactly): _private-plan data is designed
to remain local by default and is not transmitted to external services by
this feature; backups/transfers include it only when the user exports and
has not excluded it._ No "100% anonymous/unhackable" claims anywhere.

At rest, plans use the same `localStorage` envelope/quarantine guarantees
as other `sensitive` datasets (dreams, pledges, history). There is no
per-plan passphrase: forgetting secrets must never lock users out of
their own history, and the profile PIN + OS lock screen are the
documented protection boundary (`SECURITY.md` assumptions).

## Accessibility & localization

- Full AR/EN copy (`pp.*`, parity-gated), RTL via logical properties and
  existing classes (no new CSS), keyboard-operable controls,
  `aria-pressed` toggles, `aria-live` affirmations/timer.
- Accessibility labels stay generic in discreet mode.

## Tests

- Unit (`app/lib/__tests__/private-plans.test.ts`, 29 tests): run math,
  history-preserving resets, milestones, idempotent check-ins, usage
  clamps, trigger/strategy stats, validation/pruning, schema round-trip
  with salvage, key-matcher forms, exact neutral copy, generic reminders,
  banned shaming-vocabulary scan.
- E2E (`e2e/private-plans.spec.ts`): create → check in → setback (history
  preserved across reload), quick exit to neutral home, URL/title leak
  scan. Neutral fixtures only.

## Deliberately not built (future work, not silent gaps)

- Home-screen "today's action" line (would need a generic, detail-free
  card — designed, not wired).
- OS-level website/app blocking (only via transparent platform mechanisms;
  never surveillance — 4.29–4.31 forbid anything else).
- Device-authentication gate beyond the existing profile PIN (platform
  APIs differ; PIN + auto-lock is the current boundary).
