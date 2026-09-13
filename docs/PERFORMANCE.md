# Performance

Wird is a PWA: initial paint is fast (SSG/SSR static HTML), then storage
hydration is eager. The one requirement that can regress accidentally is
the analytics pipeline on large histories.

## Hydration cost

Static HTML is generated for every route at build time (`next build`;
the "Static" label in the build output). Hydration hydrates React with
near-zero layout shift because every view uses static placeholders and
persists after mount. This is documented, not a performance trick to
optimize blindly (see hydration rule in CONTRIBUTING.md).

## Analytics cost (biggest O(n) surface)

`lib/analytics.ts` is intentionally written as a pipeline of pure
transforms. Hot functions:

- `computeAnalytics`: walks per-range day buckets; complexity is O(range ×
  distinct day count). With a year of data this is a few hundred entries;
  below 1ms on mobile.
- Trend windows: the `windows` array is the dominant factor. Keep the
  default ranges reasonable (30d/90d) and avoid adding an unbounded loop
  inside a compute call.
- Heatmap build: linear in distinct (month, day) keys; memory is one
  object + a sorted list.

**Never O(n²):** the general pattern is "read once, compute metrics once."
If you add a new window/trend, test a synthetic 1000-day record and verify
it completes in single-digit ms. Add a regression note here or in the
function JSDoc if you change the shape.

## History reads

`wird-history-v1` is the largest typical record (one entry per day).
`readFromStorage` deserializes it once per component mount; cache via the
standard `useStoredState` / module-level memo is fine, but no cross-profile
leak. Profile switch forces a full reload so stale caches are impossible.

## Crypto / backup export

Export/import read/write the full dataset; complexity is linear in dataset
size. The `buildBackupFile` / `wrapForEncryption` path is fast and
unit-tested; not a bottleneck. QR chunking and LAN send buffer once and
use bounded-size chunks (`lib/transfer.ts`); QR_MAX_CHUNKS = 600.

## Quota guard

`localStorage` quota varies (5–10 MB, mobile). The schema layer never
pre-allocates; writes are sparse enough that quota errors happen only for
pathological cases. `restoreBackupSafe` rolls back on quota failure (atomic
semantics).

## Lazy loading

Data that is large and not immediately needed is code-split and lazy:

- `lib/hadith-full.ts` (CDN hadith) loads on demand, not on app mount.
- `lib/quran.ts` corpus loads on mount but behind `Suspense`; pages
  `/library`, `/review`, `/insights` do not block on Quran data.
- Tafsir CDN calls are per-ayah, never bulk-fetched.

## What to profile before merging

1. A new metric window/insight on a 500+ day synthetic record.
2. Any new object iteration over `wird-history-v1`.
3. A calendar range spanning >1 year.
4. A profile with near-quota dataset size — verify no "QuotaExceededError"
   in the merge path (test in `schema.test.ts` style).
