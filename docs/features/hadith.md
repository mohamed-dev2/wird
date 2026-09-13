# Hadith library

Bundled curated hadith collections + full-book CDN fallbacks.

- Core modules: `app/lib/data/hadith.ts` (curated selections), `app/lib/hadith-full.ts`
  (full-book loader, CDN + module-level cache).
- UI: `app/components/library/hadith-library.tsx`, `components/library/hadith-full.tsx`.
- Network boundary: `cdn.jsdelivr.net` full-edition fetches (opt-in, see
  `docs/NETWORK.md` and `lib/privacy.ts`).

**Key behaviors:**

- Curated selections ship inline and are always available offline.
- Full-book editions load on demand and cache for the session; the UI
  falls back to the curated set if the network call fails.
- Hadith text is Arabic with curated English translations; it is never
  machine-translated or generated.

**Religious-content rules:** see `docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md`.
Source attribution and a reviewer sign-off are required before merging.
