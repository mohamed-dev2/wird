# Domain models

The canonical shapes for Wird's core concepts. Where a field is free-form
user input it is validated (`is…Like` guards in `lib/schema.ts`), never
trusted. Multi-word tables: DOCUMENTATION.md §4. Sensitivity classes are
resolved at runtime by `lib/privacy.ts` `sensitivityOf()`.

Legend for columns: **req** required, **user** user-controlled, **der**
derived (computed, never persisted), **sens** sensitivity class, **pers**
persisted.

## Profile (`app/lib/profiles.ts`)

| field           | req | user | der                          | sens        | pers                             |
| --------------- | --- | ---- | ---------------------------- | ----------- | -------------------------------- |
| `id`            | ✓   | —    | random, not user chosen      | `private`   | ✓ (`p_<id>_` → all profile keys) |
| `name`          | ✓   | ✓    | —                            | `sensitive` | ✓ (`wird-profiles-v1`)           |
| `avatar`        | ✓   | ✓    | —                            | `private`   | ✓                                |
| `pinHash`       | ?   | ✓    | salted SHA-256 (not the PIN) | `sensitive` | ✓                                |
| `duressPinHash` | ?   | ✓    | salted SHA-256               | `sensitive` | ✓                                |
| `created`       | ✓   | —    | set once at creation         | `private`   | ✓                                |

Profile switch/logout triggers a deliberate full page reload so no
cross-profile state survives in memory (ADRs/ARCHITECTURE).

## DayRecord (`app/lib/history.ts`)

| field   | req | user | der                                     | sens      | pers                  |
| ------- | --- | ---- | --------------------------------------- | --------- | --------------------- |
| `day`   | ✓   | —    | key (local day id)                      | `private` | ✓                     |
| `ids`   | ✓   | —    | merged monotonically from habit toggles | `private` | ✓ (`wird-history-v1`) |
| `pages` | ✓   | —    | Quran-pages max per day                 | `private` | ✓                     |
| `score` | ?   | —    | derived adherence score                 | `private` | ✓                     |
| `mood`  | ?   | ✓    | today's mood choice                     | `private` | ✓                     |

## Daily activity envelopes (`wird-*-v2`, `app/lib/schema.ts`)

`{ day, value }` (numeric: `tasbeeh`, `salawat`, `quran-pages`),
`{ day, text }` (textual: `fast`, `reflection`), `{ day, ids }` (lists:
`done`, `partial`, `snoozed`, `forget`). All carry a `day` anchor used to
detect and reset stale daily state. `reflection` is `highly_sensitive`.
Legacy bare values migrate on read without rewriting storage.

## Habit / Section (`app/lib/wird.ts`)

`Habit { id, title, detail?, points, optional? }` inside fixed
`Section[]` (catalog — always Arabic, versioned with the app). `points`
drives per-day score. Custom user habits reuse the same `Habit` shape in
`wird-customs-v1` (`private`). NEVER combine the two: catalog habits are
content, customs are data.

## Goal / Challenge / Pledge / Dream / Qada / Kid

| model                              | shape (curated subset)                  | sens        |
| ---------------------------------- | --------------------------------------- | ----------- |
| `Goal` (`wird-goals-v1`)           | `{ title, detail, created?, done? }`    | `private`   |
| `Challenge` (`wird-challenges-v1`) | `{ id, title, points, count, target… }` | `private`   |
| `Pledge` (`wird-pledges-v1`)       | `{ id, text, checks: string[] }`        | `sensitive` |
| `Dream` (`wird-dreams-v1`)         | user diary entries                      | `sensitive` |
| `Qada` (`wird-qada-v1`)            | make-up prayer plan records             | `private`   |
| `Kid` (`wird-kids-v1`)             | per-child progress                      | `private`   |

Also `wird-quarantine-v1` (failed/corrupt entries pending 30-day TTL —
content preserved, never silently dropped) and `wird-export-log-v1`
(consent log entries `{ at, kind, count }`).

## Recovery verifier (`app/lib/recovery.ts`)

`VerifierRecord = { v: 1; salt; hash }` (new, salted) **or** a bare legacy
hash string (verified for backward compatibility, written over on re-key).
The words themselves are never stored — only the verifier.

## Companion / coach states (runtime only — never persisted)

`CompanionState` (26-state adaptive engine) and `CoachState` types live in
`app/lib/companion.ts` / `app/lib/coach.ts`. They are **derived** from
history + persistence forms each render; the only persisted companion data
is the guide-log (which guidance was shown, capped/aged).

## Discriminated unions used

- `BackupScope = { kind: "device" } | { kind: "profile" }` (backups/imports).
- `ExportKind = "file-plain" | "file-enc" | "qr" | "lan" | "emergency" | "diagnostics"`.
- `RestoreReport` swaps `restoreBackup`'s single number for a discriminated
  per-key result (`applied | applied-salvaged | applied-unknown | skipped`).

## Rules

1. Never store derived data unless it has a documented cache/aging
   story (only `score`/`mood` on DayRecord are accepted derivations).
2. `highly_sensitive` records (vault/reflections) must stay out of
   diagnostics exports; the vault is additionally encrypted at rest.
3. Adding a field to any `is…Like` guard triggers a schema **migration**
   (see docs/VERSIONING.md), and migrations must spread old data — the
   zero-loss contract.
