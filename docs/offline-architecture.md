# Offline architecture (STEP 5)

> **The internet is an enhancement, not a dependency.** A user should be
> able to wake up, open Wird, track their day, read local content, review
> progress, manage habits, use private recovery tools, and view analytics —
> even if the internet completely disappears.

Wird is offline-_first_, not online with an offline mode. There is no
server, no database, no account system: the data flow is always
`USER ACTION → LOCAL DOMAIN LOGIC → LOCAL STORAGE → UI UPDATE`, and
network use (three allowlisted content endpoints) is secondary, lazy, and
bounded. See `docs/NETWORK.md` for the exhaustive request matrix and
`app/lib/privacy.ts` `NETWORK_ACCESS` for the machine-readable manifest.

## Feature classification manifest (5.2)

Classes: **OFFLINE** (never touches network) · **OFFLINE-FIRST**
(local core, optional online enhancement) · **OPTIONAL ONLINE** (needs
network for its payload, fails calmly otherwise). **Nothing in Wird is
ONLINE REQUIRED.** The single bootstrap exception: the very first visit
needs connectivity once to receive the PWA bytes; every launch after that
works offline (service-worker shell, §Service worker).

| Feature                                                                                                    | Class           | Without internet                                                          | Unavailable part                   | How the UI communicates it                                           |
| ---------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| Home / navigation / tabs                                                                                   | OFFLINE         | fully usable                                                              | —                                  | —                                                                    |
| Habits, goals, streaks, daily tracking                                                                     | OFFLINE         | fully usable                                                              | —                                  | —                                                                    |
| Reflections, gratitude, mood                                                                               | OFFLINE         | fully usable                                                              | —                                  | —                                                                    |
| Reviews, night context                                                                                     | OFFLINE         | fully usable                                                              | —                                  | —                                                                    |
| Analytics + coach + companion                                                                              | OFFLINE         | pure local computation over local history                                 | —                                  | honest empty states when evidence is thin (not network-related)      |
| Quran tracking (pages, bookmarks, mem marks)                                                               | OFFLINE         | fully usable                                                              | —                                  | —                                                                    |
| Bundled Quran text + EN + Jalalayn tafsir                                                                  | OFFLINE-FIRST   | fully usable from cache/bundle                                            | first fetch needs one online visit | calm loader, then content                                            |
| Online tafsirs (9 sources)                                                                                 | OPTIONAL ONLINE | everything else works                                                     | that tafsir text                   | calm error + retry (`qr.tafsirFail`), no crash, 10s bound (`net.ts`) |
| Reciter audio (12 reciters)                                                                                | OPTIONAL ONLINE | ayah-follow state resets silently                                         | the stream                         | player stops, no error storm (`play().catch`)                        |
| Curated hadith selections + Nawawi                                                                         | OFFLINE         | fully usable (in-memory dataset)                                          | —                                  | —                                                                    |
| Full 9-book hadith browser                                                                                 | OPTIONAL ONLINE | search/favs of loaded books work                                          | uncached book editions             | calm failed card + retry (`hf.failT/S`), 10s bound                   |
| Adhkar, duas, paths, dreams                                                                                | OFFLINE         | fully usable                                                              | —                                  | —                                                                    |
| Reminders                                                                                                  | OFFLINE         | local `Notification` + service worker, permission only on explicit action | —                                  | denial degrades to silent                                            |
| Timers (Quran session, urge timer)                                                                         | OFFLINE         | fully usable (`setInterval`, no network)                                  | —                                  | —                                                                    |
| Private plans (counters, check-ins, setbacks, history, milestones, triggers, strategies, notes, analytics) | OFFLINE         | fully usable                                                              | —                                  | —                                                                    |
| Settings, localization, RTL, accessibility                                                                 | OFFLINE         | fully usable                                                              | —                                  | —                                                                    |
| Export / import / delete / wipe                                                                            | OFFLINE         | fully local files + atomic validated restore                              | —                                  | sensitive-export warnings unchanged                                  |
| QR / LAN transfer                                                                                          | OFFLINE         | fully local transport (no STUN, no server)                                | —                                  | —                                                                    |
| PIN / recovery phrase / vault                                                                              | OFFLINE         | fully local crypto                                                        | —                                  | —                                                                    |
| Storage migration on update                                                                                | OFFLINE         | pure sync migrate-on-read (`schema.ts`)                                   | —                                  | —                                                                    |
| Diagnostics / emergency export                                                                             | OFFLINE         | counts + local files                                                      | —                                  | —                                                                    |

Why nothing is ONLINE REQUIRED: every online payload is an enhancement
(more tafsirs, more books, audio) over a usable local core, never the
foundation. Nothing was classified online-required "because the
implementation was built that way" — the loaders were audited for this
doc; the only network calls in `app/` are the three allowlisted hosts.

## Local storage (5.5)

- **Technology**: synchronous `localStorage` envelopes
  (`{__wird: {v, updatedAt}, d}`), validated on every read.
- **Schema**: `SCHEMAS` registry in `app/lib/schema.ts` (one entry per
  dataset, version 1 throughout); see DOCUMENTATION.md §4 for every key
  and `docs/DOMAIN_MODELS.md` for shapes.
- **Indexes/transactions**: none — datasets are tiny (tens of rows);
  analytics is O(days) with capped windows; the 5-year perf suite
  (`analytics-perf.test.ts`) proves headroom. Deliberate simplicity, not
  a missing feature; see `docs/PERFORMANCE.md`.
- **Migrations**: pure, synchronous, migrate-on-read; legacy bare values
  accepted as v0 and never rewritten in place; future versions quarantine
  instead of dropping. No network anywhere in the upgrade path (5.27).
- **Corruption handling**: quarantine store (last 20, ~200KB) keeps raw
  bytes + health log (last 50); atomic two-phase restore with snapshot
  rollback; `/recovery` surgical tools.
- **Backups**: versioned manifest (`v:2`) with tamper-evident integrity,
  per-profile scoping, private-plan exclusion flag honored by every
  collector (file, QR, LAN, emergency).
- **Deletion**: per-key surgical reset, profile purge (incl. quarantine
  raws), double-confirm full wipe; honest limits stated in UI (disk/OS
  copies are outside app control).
- **Versioning**: `0.x` storage/API still stabilizing; keys never deleted,
  only deprecated (`docs/VERSIONING.md`); `WIRD_APP_VERSION` == package
  version asserted in CI.
- **Encryption**: vault reflections AES-256-GCM/PBKDF2-120k, session-only
  keys; everything else plaintext-under-OS-encryption (documented
  assumption in `SECURITY.md`, never oversold).
- **Limits**: ~5MB localStorage quota; quota failures surface a named
  banner instead of silent loss; emergency export rescues before reset.
- **Seams**: `StorageLike` (sync, current) + `StorageAdapter`
  (`storage-adapter.ts`: async `get`/`set`/`delete`, tested) — a future
  backend changes adapters, never domain logic (`docs/ARCHITECTURE.md`).

## Synchronization boundaries (5.19–5.21, future-proofing without a cloud)

There is **no sync today**, and the architecture keeps it that way until
an explicit opt-in product decision:

- Multi-tab: no auto-merge by design — a `storage`-event banner offers an
  explicit reload. Local data is never silently overwritten, including by
  other tabs.
- If sync is ever added: `LOCAL DATA → SYNC LAYER → OPTIONAL REMOTE`
  with the sync layer a separate module (never fused into domain logic).
- Sync MUST be opt-in, per-dataset, and **private recovery data,
  reflections, mood, and personal notes require their own explicit
  opt-in** — never bundled, never defaulted on.
- Conflict rule (documented now, enforced if built): detect → never
  blindly overwrite local → user-visible safe merge (local-wins default
  for sensitive datasets, both-kept for counters, explicit choice for the
  rest). Sensitive data is never silently overwritten, uploaded, or merged.

## Time handling (5.13)

- Day identity is the **device-local** calendar day (`dayId()`); history
  math is UTC-anchored and DST-tested (`shiftDay`, US spring-forward
  covered); plan math is noon-anchored (no ambiguous hours).
- Midnight rollover, multi-day absence, and legacy undated shapes are
  unit-tested (`daily.test.ts`); monotonic `recordDay` never lets an
  empty today erase yesterday.
- Travel/timezone/device-clock changes: the app trusts the device clock
  (documented limitation — there is no server clock to consult, and
  inventing one would be surveillance-adjacent). Streaks derive from
  recorded day-ids, never from assumed continuity.

## Failure behavior (5.16–5.18)

- External loads go through `net.ts` (`fetchWithTimeout`, 10s default):
  API 500s, DNS failures, refused connections, stalls, and corrupt
  payloads all reject as plain `Error`s (`net.test.ts` covers the matrix).
- Every call site already catches: calm error text + retry, loading
  states that always settle (no infinite spinners), no destructive
  retries, no crash (hydration/pageerror listeners guard every e2e spec).
- Save order is local-first always: user action → local save → UI update;
  there is no remote step that can veto or erase a local record.
- Offline UX (5.17): no "YOU ARE OFFLINE" banners. Local actions just
  work; failures name the missing _content_ ("Load failed — check
  connection"), never blame the user or the device.

## Service worker contract (5.14)

`public/sw.js` (CACHE `wird-v4`, no build step):

- Precaches route shells (`/`, `/calendar`, `/insights`, `/review`,
  `/library`, `/account`, `/recovery`, `/private-plans`), manifest, and
  the five `public/data` bundles at install (best-effort).
- Navigations: network-first (fresh shell + instant updates when online),
  falling back to the precached route shell, else `/` — so an offline
  restart launches a usable Today screen with all data intact.
- Same-origin static assets (JS chunks, fonts): cache-first at runtime,
  so the shell boots offline after one online visit.
- `cacheable()` CDN JSON (hadith editions, tafsirs): cache-first, never
  audio streams. Version bumps purge old caches on activate; the in-app
  update banner applies them (`sw-register.tsx`).

## Reminders, security, performance

- **Reminders (5.12)**: bedtime ladder + review nudges + generic
  private-plan check-ins via local `Notification`/SW only. No server is
  involved; plan text stays fixed-generic per Step 4 privacy rules.
- **Offline security (5.24/5.25)**: local ≠ automatically secure — the
  review lives in `SECURITY.md` (device theft, shoulder-surfing,
  malicious extensions, forensic access) with honest boundaries. Network
  leaks are CI-guarded: no sensitive words in URLs/titles (e2e leak
  scans), zero `console.*` in `app/`, allowlisted-hosts-only fetches.
- **Performance (5.26)**: `analytics-perf.test.ts` runs the full
  history-bound surface over a synthetic 5-year/1826-day dataset inside
  per-call budgets; capped lists (quarantine/health/logs/guide-log)
  bound every other growth vector.

## Testing strategy (5.31) + airplane-mode manual (5.15)

Automated (`e2e/offline.spec.ts`, serial, prod server):

| 5.31 item                     | Covered by                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| First launch offline          | Documented limit: first visit needs connectivity once (PWA bytes); after that, the restart test below covers launch |
| Navigation offline            | all 8 routes load with external blocked                                                                             |
| Create/complete habit offline | toggle + reload persistence, external blocked                                                                       |
| Create goal offline           | private-plan create/check-in/setback flow offline (= goal-type coverage on the same storage path)                   |
| Analytics offline             | insights route renders offline; 5-year perf suite covers the engines                                                |
| Quran tracking offline        | pages/tracking are local writes (habit-toggle path); bundled search asserted offline                                |
| Recovery tracking offline     | full private-plan lifecycle offline + restart persistence                                                           |
| Search offline                | bundled Quran search asserted with external blocked                                                                 |
| Restart offline               | **true airplane test**: `context.setOffline(true)` → reload → Today renders, data intact, writes work               |
| Migration offline             | pure-sync migrate-on-read has no network step (`schema.test.ts`); restart test exercises the read path              |
| Export/delete offline         | local-only by construction; round-trips covered in `crypto-restore`/`transfer` suites                               |

Manual airplane-mode checklist (Wi-Fi + data OFF, from a warm install):

1. Kill the app, reopen → Today loads with yesterday's data.
2. Toggle habits, check in a plan, write a review → all save.
3. Open library Quran search + Jalalayn tafsir → work.
4. Open an online tafsir / full hadith book → calm error + retry, no crash.
5. Re-enable network → everything still correct (no sync exists; nothing to conflict).

## Developer tooling (5.30) and visibility (5.34)

No hidden production controls — the existing surfaces compose the
offline lab: Playwright `page.route` blocking + `context.setOffline`
(used by `offline.spec.ts`), demo-mode seeded data, `/recovery`
(storage health, per-dataset reset, quarantine inspection, emergency
export), `schema.test.ts` migration/fuzz suites, `npm run diagnose`
(all gates), `npm run metrics` (size/fan-in/cycles), and Account →
data-health diagnostics export (counts only). Connectivity state needs
no inspector: the app never branches on it except the three documented
loader catch paths.

## No duplicate codebase (5.33)

One application, shared domain logic (`app/lib`, pure + tested). Network
state affects only infrastructure behavior (loader catch paths, SW
fallback) — there is no "online version" and "offline version" of any
feature.
