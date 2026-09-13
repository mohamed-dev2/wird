# وِرد — Full Documentation

> **Living document.** It is verified on every push by `npm run docs:check`
> (see [Keeping docs fresh](#keeping-docs-fresh)). Last reviewed: 2026-09-13.

Wird is a daily Islamic habits tracker — Next.js 16 + React 19, **100% on-device**.
No database, no accounts server, no analytics beacon. Everything lives in the
browser's `localStorage` (per profile), with export / QR / LAN / recovery-word
tools to move between devices.

- Stack: Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5.9 (strict) · ESLint 9 flat · Prettier · Vitest · Playwright
- Runtime deps: `next`, `react`, `react-dom`, `qrcode`, `jsqr` — nothing else.
- Node 22 (`.nvmrc`). Package manager: npm, exact versions (`.npmrc`).

## Contents

1. [Quick start](#1-quick-start)
2. [Routes (pages)](#2-routes-pages)
3. [Features by route](#3-features-by-route)
4. [Data & storage](#4-data--storage)
5. [Profiles, login & recovery](#5-profiles-login--recovery)
6. [Moving to another device](#6-moving-to-another-device)
7. [Internationalization & themes](#7-internationalization--themes)
8. [Library data (Quran / Hadith / paths)](#8-library-data)
9. [Security model](#9-security-model)
10. [Quality gates (tests, lint, CI)](#10-quality-gates)
11. [Deployment](#11-deployment)
12. [Troubleshooting](#12-troubleshooting)
13. [Keeping docs fresh](#keeping-docs-fresh)
14. [Adaptive companion](#14-adaptive-companion)
15. [Analytics methodology](docs/ANALYTICS.md)
16. [Companion decisions](docs/COMPANION.md)
17. [Privacy model](docs/PRIVACY.md)
18. [Testing guide](docs/TESTING.md)
19. [Architecture](docs/ARCHITECTURE.md)
20. [Components](docs/COMPONENTS.md)
21. [Contributing](CONTRIBUTING.md)
22. [Changelog](CHANGELOG.md)
23. [Domain models](docs/DOMAIN_MODELS.md)
24. [Internal API](docs/API.md)
25. [Versioning & migrations](docs/VERSIONING.md)
26. [Performance](docs/PERFORMANCE.md)
27. [Error handling](docs/ERROR_HANDLING.md)
28. [Localization](docs/LOCALIZATION.md)
29. [Accessibility](docs/ACCESSIBILITY.md)
30. [Privacy architecture](docs/PRIVACY_ARCHITECTURE.md)
31. [Network access](docs/NETWORK.md)
32. [Architecture decision records](docs/adr/)
33. [Features index](docs/features/README.md)
34. [How to add a feature](docs/HOW_TO_ADD_A_FEATURE.md)
35. [How to add a language](docs/HOW_TO_ADD_A_LANGUAGE.md)
36. [How to add religious content](docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md)
37. [Governance](GOVERNANCE.md)
38. [Reproducibility](docs/REPRODUCIBILITY.md)
39. [Dependency governance](docs/DEPENDENCIES.md)
40. [Release engineering](docs/RELEASE.md)
41. [Feature flags](docs/FEATURE_FLAGS.md)
42. [Technical debt register](docs/TECH_DEBT.md)
43. [Contributor levels](docs/CONTRIBUTOR_LEVELS.md)
44. [Maintainer handover](docs/MAINTAINER_HANDOVER.md)
45. [Open-source readiness](docs/OPEN_SOURCE_READINESS.md)
46. [Safe code generation](docs/SAFE_CODE_GENERATION.md)
47. [Offline architecture](docs/offline-architecture.md)
48. [Companion project (design record)](docs/COMPANION_PROJECT.md)

## 1. Quick start

```bash
npm ci             # exact lockfile (never npm install on a fresh clone)
npm run dev        # http://localhost:3000 (Turbopack)
npm run build      # production build (also prerenders /opengraph-image, /robots.txt, /sitemap.xml)
npm run start      # serve the production build
npm run lint       # eslint . --max-warnings 0 (flat config)
npm run typecheck  # tsc --noEmit (strict + noUncheckedIndexedAccess)
npm run test       # vitest run (unit)
npm run test:e2e   # playwright test (spins up production server)
npm run format     # prettier --write .
npm run docs:check # verify this file matches the code (keys + routes)
npm run boundaries:check # architectural boundary gates (lib↔components, schema, online-only, privacy↔CSP)
npm run metrics # maintainability report (oversized modules, fan-in, runtime cycles)
npm run sbom # regenerate sbom.wird.json (CycloneDX-lite)
npm run clean      # wipe .next + tsbuildinfo (run after major upgrades)
```

Conventional commits are enforced (`feat:`, `fix:`, `style:` …) via commitlint +
husky pre-commit (lint-staged) + commit-msg hooks.

## 2. Routes (pages)

| Route            | File                 | Purpose                                                                  |
| ---------------- | -------------------- | ------------------------------------------------------------------------ |
| `/`              | `app/page.tsx`       | Today: hero, habits, rescue plan, goals, night review                    |
| `/calendar`      | `app/calendar/`      | 30-day month grid, Friday plan                                           |
| `/insights`      | `app/insights/`      | Real stats, balance radar, coach brief, Hijri year                       |
| `/review`        | `app/review/`        | End-of-day checklist (tri-state) + score + mood                          |
| `/library`       | `app/library/`       | Tabs: Adhkar · Quran · Hadith · Paths · Dreams                           |
| `/account`       | `app/account/`       | Profile, backup, transfer, reminders, times, theme                       |
| `/recovery`      | `app/recovery/`      | Last-resort recovery: inspect, emergency export, restore, surgical reset |
| `/private-plans` | `app/private-plans/` | Optional private self-management plans (discreet, unlisted from nav)     |

Shared chrome (sidebar, bottom nav, header, zikr dock, login gate) lives in
`app/components/shell.tsx`; all state in `app/components/wird-store.tsx`
(`WirdProvider` + `useWird()`). Views that need props live in
`app/components/views/`.

## 3. Features by route

**Today (`/`)** — hero ring (live %), day-mode pills, focus card, quick tools,
rescue plan (one-now, Quran timer session, daily dua), ramp card, intention
card, Friday card, favorites, don't-forget, tawbah, moment grid (next prayer
countdown, intention, tasbih counter), filterable habit cards, extras grid,
Quran callout, adhkar tags, dua card, goals + challenges + pledges, night
reflection (persisted textarea), tiered return screen after ≥3 absent days
(short/gentle/journey/deep-restart + optional tawbah path for ≥14 days),
adaptive companion card (one ranked guidance + verified verse/hadith, see
§14), kids quests, qada / fasting / breaker cards, Ramadan banner in Ramadan.

**Review (`/review`)** — auto-built checklist from today's real data plus six
heart-check items; tri-state (done/partial/missed); mood + gratitude; weighted
score saved immutably per day (`wird-reviews-v1`, merged into history);
one-line night context for strong/low/return days (see §14).

**Insights (`/insights`)** — period pills (1–365d buckets), weekly bars, 4
metrics, coach brief (at-risk → neglect → pace → lift + praise), 6-axis
balance radar (SVG), 30-day strip, Hijri year-in-review card, share-as-image,
plus the analytics layers (see §15): overview with personal baselines,
14/30-day trends with evidence, habit comparison + per-habit best/weakest
windows, weekday patterns (min samples), streak intelligence (avg run/break),
Quran + memorization recency, adhkar trends, goal/challenge/pledge stats,
reflection/gratitude/mood metadata (no diagnoses), return analytics
(continuations, rebuild speed, break shortening), smart insights with
why-lines, GitHub-style heatmap with faith disclaimer, month + year reviews,
milestones, and a custom date range. Nothing renders without evidence.

**Library (`/library`)** — Adhkar groups with per-item counters; Quran reader
(full Uthmani text offline, EN translation toggle, 11 tafsirs incl. offline
Jalalayn, 12 reciters with ayah-follow audio, search, bookmarks, memorized
marks); Hadith (curated selections with EN + full 12-book browser with lazy EN translations: chapters,
search, jump-to-number, pagination, read/fav/copy); learning paths (8 sciences
× 4 levels, custom books); dream board.

**Account (`/account`)** — profile hero, working settings accordion, new-day
reset, backup (plain/encrypted/import/wipe), cross-device transfer (QR/LAN/
recovery), demo mode, reminders + prayer times, appearance (theme/lang/
auto-lock), profile manager.

**Private plans (`/private-plans`)** — optional, discreet self-management
plans (abstinence / reduction / time-limit) with a neutral setback flow,
urge timer, triggers, replacements, milestones, and a journey timeline.
Local-only, excludable from backups, generic reminders; see
`docs/features/private-recovery.md`.

## 4. Data & storage

All state persists in `localStorage` under `wird-*` keys. Daily keys reset
automatically (`{day, …}` envelope checked against today's `dayId()`).
Per-profile keys are prefixed `p_<profileId>_` (see §5); the backup collector
understands both shapes.

Daily (auto-reset): `wird-done-v2`, `wird-quran-pages-v2`, `wird-tasbeeh-v2`,
`wird-fast-v2`, `wird-forget-v2`, `wird-reflection-v2`, `wird-partial-v2`,
`wird-snoozed-v2`, `wird-salawat-v2`, `wird-adhkar-groups-v1`, `wird-lastseen-v1`,
`wird-notify-day-v1`.

Persistent: `wird-customs-v1`, `wird-duas-v1`, `wird-goals-v1` (entries may
carry additive `created`/`done`; older goals without them read as unknown),
`wird-intention-v1`, `wird-daymode-v1`, `wird-qada-v1`, `wird-breaker-v1`,
`wird-challenges-v1`, `wird-ramp-v1`, `wird-friday-plan-v1`,
`wird-quran-bookmark-v1`, `wird-quran-mem-v1` (new marks carry `@dayId`
recency suffixes; bare legacy marks still match), `wird-quran-font-v1`,
`wird-quran-en-v1`, `wird-reciter-v1`, `wird-tafsir-src-v1`,
`wird-hadith-fav-v1`, `wird-hadith-read-v1`, `wird-paths-v1`,
`wird-paths-custom-v1`, `wird-dreams-v1`, `wird-kids-v1`, `wird-pledges-v1`,
`wird-history-v1`, `wird-reviews-v1`, `wird-remind-v1`,
`wird-adhkar-log-v1` (per-day group counts, capped 180 days),
`wird-recovery-plans-v1` (per-profile private self-management plans —
sensitive; excludable from backups, see `docs/features/private-recovery.md`).

Device-global (never namespaced): `wird-profiles-v1`, `wird-active-profile`,
`wird-theme-v1`, `wird-lang-v1`, `wird-reminders-v1`, `wird-mosque-v1`,
`wird-prayer-times-v1`, `wird-autolock-v1`, `wird-recovery-v1`,
`wird-pinlock`, `wird-pinlock-*`, `wird-unlocked` (sessionStorage),
`wird-quarantine-v1`, `wird-health-v1`, `wird-last-backup-v1`,
`wird-guide-log-v1`, `wird-privacy-names-v1`, `wird-analytics-optout-v1`,
`wird-vault-v1`, `wird-travel-v1` (hidden-from-extra-eyes profile IDs),
`wird-export-log-v1` (what-left-the-device consent log, capped),
`wird-private-plans-excluded-v1` (private-plans backup exclusion flag)
(diagnostics, see below).

Helpers: `loadFromStorage` / `saveToStorage` (`app/lib/wird.ts`, profile-aware),
`useStoredState` (`app/lib/use-stored-state.ts`, hydration-safe), `nsKey`
(`app/lib/profiles.ts`). State initializes with static fallbacks so SSR HTML
matches, then hydrates stored values on mount — never read storage during
render (see `docs/adr` decision in git history: hydration fix).

Integrity layer (`app/lib/schema.ts`, zero-loss contract):

- Every dataset has a versioned `Schema` { version, validate, normalize?,
  migrate?, fallback } in `SCHEMAS`. Validators never strip unknown fields;
  migrations must spread old data.
- New writes are enveloped `{ __wird: { v, updatedAt }, d }`; legacy bare
  values still read as v0 and are never rewritten in place.
- Read path: parse → unwrap → future-version guard (preserve untouched,
  serve fallback) → migrate → validate → normalize-salvage → quarantine.
  Malformed records land in `wird-quarantine-v1` (last 20, ~200KB cap) with
  their raw bytes; events append to `wird-health-v1` (last 50).
  Pre-envelope v1 shapes (bare array/number/string under daily keys) migrate
  to `{day:"", …}` (undated legacy); daily loaders show `day:""` as current
  only when the data provably came from storage (`readTrusted`), so
  corruption/missing keys can never masquerade as legacy.
- Write path: validate first; when a collection has salvageable items it
  heals on write (persists the valid subset, quarantines rejects) instead
  of refusing the whole dataset; quota failures return `{ ok:false,
quota:true }` and raise an in-memory notice (a full store cannot persist
  the notice itself).
- Import (`app/lib/crypto.ts`): `previewRestore` dry-runs any backup map;
  `restoreBackupSafe` classifies EVERYTHING first (zero applicable entries
  → rejected before a single write, not even quarantine), then snapshots,
  applies valid, salvages partial, quarantines corrupt, and rolls the
  snapshot back on mid-restore failure. `restoreBackup` keeps its
  `(data) => number` signature for existing callers. Exports are
  manifest-wrapped (`buildBackupFile` → `{ v:2, app, format, appVersion,
exportedAt, encrypted:false, count, datasets:{version,records}, data }`);
  encrypted transfers wrap the same manifest INSIDE the ciphertext
  (`wrapForEncryption`/`unwrapDecrypted`, legacy raw maps still accepted);
  every success stamps `wird-last-backup-v1` (`{at,kind}`) for diagnostics.
  `parseBackupFile` still accepts legacy v1 and raw key maps.
- UI: account page has an import pre-flight confirm (corrupt/salvageable
  counts), double-confirm wipe (quarantine + health survive a wipe), and a
  data-health card (counts, last entries, diagnostics export, log clear).
  The provider shows a quota banner (from drained notices) and a multi-tab
  banner on `storage` events — reload is always explicit, never auto-merge.
- Local diagnostics (`app/lib/diagnostics.ts`, counts only — no personal
  content): profiles, datasets, stored/quarantined/future-version keys, last
  backup, last migration, service-worker and transfer readiness; emergency
  export (`buildEmergencyExport`) with an honest recovered/corrupt/skipped
  report for manual rescue.
- Performance posture: saves stay per-key on change (no full-store
  serialization per interaction); validation is O(dataset) with tiny
  datasets; backup encryption, QR chunking, gzip, and emergency export run
  on demand from explicit buttons only; quarantine/health are capped lists.

Download filenames (not storage, also matched by the checker):
`wird-backup-*`, `wird-backup-enc-*`, `wird-diagnostics-*`,
`wird-emergency-*`.

## 5. Profiles, login & recovery

- Profiles: name + avatar + optional 4–8 digit PIN (`app/lib/profiles.ts`); ids
  are `crypto.randomUUID()` (timestamp ids could collide across devices on
  import). Registry, verifiers, and demo seeds all flow through the schema
  layer; deleting a profile also purges its quarantine raws (health entries
  carry no payload and stay for forensics).
- PINs stored as SHA-256 (`wird-pin:<pin>` domain); 5 wrong tries → 30s lockout.
- Auto-lock timer re-locks after inactivity (configurable, off/5/15/30/60 min).
- Recovery: 12-word BIP39 phrases (`app/lib/recovery.ts`, wordlist bundled at
  `public/data/bip39-en.txt`) reset forgotten PINs; verifiers in
  `wird-recovery-v1`. Tested against the official zero-entropy vector.
  Phrases are shown once on demand, never logged (zero `console.*` in `app/`),
  never in URLs, never persisted (only the verifier, scoped per profile id —
  a phrase for A cannot silently reset B), cleared from state after use, and
  resetting still requires the new PIN (phrase ≠ auth shortcut).
- Switching profile reloads the app so no cross-profile state leaks; every
  async import captures the active profile id first and aborts if it changed
  mid-decrypt, so imports can never commit into the wrong profile.
- Anonymity: optional name-hiding on lock/login screens
  (`wird-privacy-names-v1`, Account → privacy); PIN fields use
  `autocomplete="new-password"` + no spellcheck against autofill and
  shoulder-surfing dictionaries.
- PIN hardening: trivial PINs rejected at set-time; destructive backup
  actions (plain export, wipe) re-verify the profile PIN inline when one
  is set; recovery verifiers are per-profile salted (v1) with legacy
  unsalted (v0) hashes still accepted.
- Duress PIN (optional, explained in UI before setting): opens a shared
  blank decoy profile, counts nothing against lockout, leaves real data
  locked. Must differ from the real PIN.
- Reflection vault (optional, strongly discouraged in UI): AES-GCM
  reflection encryption with session-only keys; forgetting the passphrase
  loses the data permanently by design. See `docs/PRIVACY.md`.
- Catastrophic failure → `/recovery` (independent of the main store):
  storage-health inspection, emergency export, backup restore, per-dataset
  surgical reset, full erase only by typing DELETE.

## 6. Moving to another device

Account → transfer card (`app/components/transfer.tsx`):

1. **Encrypted file** — AES-GCM export/import (also the plain-JSON option).
   Fresh 128-bit salt + 96-bit IV per backup, PBKDF2-SHA256 120k, GCM auth
   rejects tampering; passwords live only in memory, failures are generic
   (`bk.bad` / `tr.badPin` — no crypto internals leak).
2. **QR snapshot** — PIN-encrypted + gzipped manifest envelope as animated
   `WIRD1:i/n:` codes; scanner assembles in any order (`app/lib/transfer.ts`).
   Hardened: structural chunk check (`isSaneChunk`, ≤600 chunks ≈ 1MB —
   bigger must use files), per-session lock (foreign-`n` chunks never mix),
   duplicates collapse, contaminated sets refuse assembly, staged progress
   (verify → decrypt → validate → import), nothing commits before preview +
   validated restore.
3. **Local Wi-Fi pair** — WebRTC DataChannel with manual SDP exchange,
   host-candidates only: no STUN, no server, no internet (`app/lib/lan.ts`).
   Hardened: malformed SDP → pair-code error (not "wrong password"),
   20s connect timeout, bounded LAN payload (≤8 parts, ≤32MB), empty
   payload explained, sessions closed on unmount, validated restore only.
4. **Recovery phrase** — resets PINs; backup files restore content.

## 7. Internationalization & themes

- 926-key AR/EN dictionary (`app/lib/strings.ts`, parity enforced by
  `docs:check`); `useT()` hook + `tr()`; religious/user content stays Arabic.
- `document.dir` flips rtl/ltr; `[dir="ltr"]` CSS mirrors layout.
- Themes light/dark/oled via `data-theme` + `tokens.css`; OS preference
  respected on first run; persisted per device.
- Hijri dates via `Intl` islamic-umalqura; prayer countdowns manual times.

## 8. Library data

- Quran Uthmani (6,236 ayahs), Clear-Quran English, Jalalayn tafsir, BIP39
  wordlist, Nawawi 40: bundled in `public/data/`, lazy-fetched, SW-cached.
- 12 full hadith books + 11 online tafsirs + 12 reciter MP3s: fetched on demand
  from CDN/API (CSP-allowlisted), cached by the service worker afterwards.
- Curated hadith selections + learning paths live in `app/lib/data/` with English
  translations and grades.

## 9. Security model

- `npm audit` clean (CI-gated); 5 runtime deps only.
- Headers (`next.config.ts`): `X-Content-Type-Options`, `X-Frame-Options:
DENY`, strict `Referrer-Policy`, `Cross-Origin-Opener-Policy`,
  least-privilege `Permissions-Policy` (camera/mic/geolocation/payment all denied — voice logging was removed rather than leak audio to cloud STT),
  production-only CSP (script `unsafe-inline` is a documented Next.js
  requirement; fonts self-hosted so no font CDN needed).
- AES-GCM backups (PBKDF2 120k, random salt/IV per backup, GCM tamper
  detection, generic failure messages, passwords never stored/logged),
  PINs hashed, recovery verifiers hashed, no `dangerouslySetInnerHTML`
  (tafsir HTML stripped via detached node).
- Privacy page principle: nothing leaves the device except user-initiated
  transfers/shares; one-tap wipe in Account.

## 10. Quality gates

- `npm run typecheck` (strict + `noUncheckedIndexedAccess`), `npm run lint`
  (`--max-warnings 0`), `npm run format:check`, `npm run docs:check`
  (7 checks), `npm run comments:check`, `npm run css:check`,
  `npm run boundaries:check`, `npm run metrics` (informational report).
- Vitest (172 tests, 22 files): history/coach/recovery/transfer/demo logic plus the reliability
  suites — `schema` (envelopes, quarantine, salvage, future-versions,
  quota, caps, migration idempotence), `crypto-restore` (manifest, dry-run,
  two-phase zero-write rejection, snapshot rollback, salvage),
  `crypto-security` (round-trip, wrong password, GCM tamper, malformed
  payloads, salt/IV freshness, legacy compat), `daily` (midnight rollover,
  multi-day absence, legacy bare shapes, monotonic `recordDay`),
  `isolation` (namespacing, adoption, id uniqueness, quarantine purge),
  `fuzz` (seeded: validators/read/write never throw, valid state
  round-trips), transfer edges (duplicates, order, contamination, bounds),
  `companion` (26 user states, ranking, fatigue/once-ever, rotation, core,
  log caps), `content` (verse refs exist in bundle, legacy refs parse,
  hadith resolve with grade+ref, per-theme coverage), `guidance-safety`
  (auto-collected AR+EN keys: presence, no revelation markers, no
  shame/ruling/heart/medical/causation claims, distinct source labels),
  `analytics` (20-test BM suite over a synthetic 4-month dataset: periods,
  trends, streaks, returns + rebuild days, restart-size evidence, habit
  windows, weekday gating, honest time-of-day null, Quran/mem/adhkar,
  goals/challenges/pledges, gratitude + mood metadata, heatmap relativity,
  month deltas, what-changed, friction, insight gating, milestones, data
  quality, DST safety, volatility, analytics→companion pipeline),
  `prayer` (day-arc fractions incl. overnight wrap, next-prayer agreement),
  `vault` (setup/unlock/lock/disable, generic failures, no plaintext
  residue), weak-PIN + duress round-trips (in `isolation`), salted +
  legacy verifiers (in `recovery`), `private-plans` (run math,
  history-preserving resets, neutral copy, generic reminders, schema
  round-trip).
- Playwright (25 tests, prod server, serial `--workers=1` pinned in
  `npm run test:e2e`): toggles persist, routes render, theme/lang persist,
  tilt vars, transfer QR + recovery flows, `/recovery` health + emergency
  export, corruption survival + quarantine, A/B profile isolation across
  switches and reloads, companion return journeys (fresh start, 10-day
  gentle return with working action, 95-day deep restart with tawbah path,
  no-shame scan), insights layers with seeded data + honest empty state,
  private-plans lifecycle (create → check in → setback with history
  preserved), quick exit, URL/title leak scan, offline suite (external
  blocked + full browser offline: core flows, bundled search, plans,
  calm CDN failures, true-offline restart);
  hydration-error listener fails the run on mismatch.
- CI (`.github/workflows/ci.yml`): `npm ci` → typecheck → lint →
  format:check → unit → Playwright chromium → test:e2e → build →
  docs:check → comments:check → css:check → boundaries:check → metrics →
  audit.
- Supply chain: `npm audit` clean; SBOM (`sbom.wird.json`) + third-party
  licenses (`THIRD_PARTY_NOTICES.md`), all regenerable via `npm run sbom` /
  `npm run audit`. See `docs/DEPENDENCIES.md`.

## 11. Deployment

Vercel recommended (zero config). Set `NEXT_PUBLIC_SITE_URL` to the real
domain so OG/canonical URLs are exact. Any static-capable host works with
`next start`; service worker + manifest ship from `public/`.

## 12. Troubleshooting

- **Old UI after update** → in-app "تحديث متاح" banner (SW `SKIP_WAITING`);
  else hard-refresh, or DevTools → Application → unregister SW on localhost.
- **Dev server weirdness** → `npm run clean`, restart `npm run dev`
  (only one dev server per folder — Next enforces the lock).
- **Build fails on `/_not-found` after upgrades** → stale `.next` cache;
  `npm run clean` first.
- **E2E fails locally** → e2e runs against a production server by design
  (`next dev` HMR sockets break in sandboxes); the server listens on
  127.0.0.1:3119 — ensure that port is free (`npm run dev` itself uses
  :3000).
- **App looks broken / data suspect** → open `/recovery`: storage health,
  per-dataset statuses, emergency export, backup restore, surgical reset.
  Corrupt records are quarantined (`wird-quarantine-v1`), never silently
  emptied — export diagnostics from Account → data-health card before
  resetting anything.
- **"Couldn't save: storage is full"** → export a backup first, then delete
  old data (demo/history); the banner names the failing dataset.
- **Data changed in another tab** → banner offers an explicit reload;
  the app never auto-merges across tabs.

## 13. Keeping docs fresh

`npm run docs:check` (`scripts/check-docs.mjs`, runs in CI) asserts:

1. Every `wird-*` storage key literal in `app/` is named in §4 above.
2. Every route directory under `app/` is named in §2 above.
3. AR/EN dictionary key parity.
4. Every internal markdown link resolves (anchor-aware).
5. Every file under `docs/` is indexed in `docs/README.md`
   (`docs/features/README.md` covers `docs/features/*`).
6. Doc quality: no placeholder or task-marker text, every npm run
   reference names a script that exists in `package.json`, every `Node N`
   mention matches `.nvmrc` (22).
7. Release version stamp: `WIRD_APP_VERSION` (`app/lib/crypto.ts`) equals
   the `package.json` version.

`npm run comments:check` (`scripts/check-comments.mjs`) asserts every
non-test source file opens with a purposeful 2+ line header comment.

When adding a key, route, or feature: document it here in the same PR —
CI fails otherwise.

## 14. Adaptive companion

Local, deterministic, offline guidance layer (`app/lib/companion.ts`,
`app/lib/content.ts`, `app/components/companion.tsx`). No AI service, no network,
no analytics — pure functions over existing history/state, memoized in
components.

- **Engine**: `assessUser()` derives 26 internal states (first use, new
  user, first week, active, consistent, momentum, improving, slipping,
  struggling, quiet, 4 absence depths, returning, rebuilding, strong
  return, repeated restarts, overload, challenge milestone, strong/low/
  recovery day, Friday, Ramadan, post-Ramadan) with personal-baseline
  metrics (never global scores) and high/medium/low confidence. Low
  confidence yields only gentle generic states — never specific claims.
- **Ranking**: return family → today shapes → milestones → trends →
  calendar overlays (Friday/Ramadan merge as one line into the card when
  another state leads). One card maximum on Today; milestones fire once
  ever per identity; repeats are suppressed for 3 days
  (`wird-guide-log-v1`, capped at 30) — the UI shows nothing rather than
  nagging.
- **Content**: verse _references only_ resolve at runtime against the
  bundled Uthmani + Clear-Quran datasets (missing → renders nothing);
  hadith resolve against the curated library with book + grade + ref.
  Quran / Hadith / Wird-suggestion blocks are visually and semantically
  separated; guidance copy is scanned by tests for revelation markers,
  rulings, shame, and heart-claims.
- **Surfaces**: adaptive card on Today (one action: rescue/review/core/
  intention/tawbah/quran/friday), tiered return screen (3/7/14/30/90-day
  copy + optional tawbah fresh-start path for ≥14 days, Friday merge),
  rescue-plan context line, night-review line. Destructive-adjacent actions
  (new-day reset, demo clear) confirm explicitly; reflections/moods never
  leave the device and never enter share images (stats only).
- **Analytics feed**: return cards cite the pre-break steadiest habit and
  small-vs-large restart evidence (`restartSizeEvidence`); rescue lines
  cite evening-vs-morning friction; challenge milestones flow from
  `challengeStats`. See §15 / `docs/ANALYTICS.md`.
- **Safety rules**: no shame, no rulings, no iman/sincerity/acceptance
  claims, no dream interpretation, no medical claims, kids get the same
  gentle copy, prayer times are referenced (never "you missed X" unless
  tracked).
