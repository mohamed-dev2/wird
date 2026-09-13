# Hadith library

Bundled curated hadith collections + full-book CDN fallbacks.

- Core modules: `app/lib/data/hadith.ts` (curated selections),
  `app/lib/hadith-full.ts` (full-book loader + lazy English-edition
  loader, CDN + module-level cache).
- UI: `app/components/library/hadith-library.tsx`,
  `app/components/library/hadith-full.tsx` (AR/EN toggle, EN-aware
  search).
- Network boundary: `cdn.jsdelivr.net` full-edition fetches, Arabic
  (`ara-*`) and English (`eng-*`) from the same verified upstream
  (opt-in, see `docs/NETWORK.md` and `lib/privacy.ts`).

**Key behaviors:**

- Curated selections (41 entries incl. Nawawi 8, with Musnad Ahmed and
  Sunan al-Darimi selections) ship inline with full EN + grades and are
  always available offline.
- Full-book editions (12 books) load on demand and cache for the session;
  English translations load lazily per book only when the EN toggle is on
  (Arabic readers never pay for them; a blocked/missing EN edition
  degrades to Arabic-only, never an error). The UI falls back to the
  curated set if the network call fails.
- Musnad Ahmed + Sunan al-Darimi come from a pinned bilingual mirror
  (`AhmedBaset/hadith-json@v1.2.0`, Sunnah.com-derived, same jsDelivr
  host): Ahmed is PARTIAL (chapters 8–30 absent upstream — labeled in the
  UI), Darimi is Arabic-complete with no upstream English (EN toggle
  shows Arabic-only). Numbering follows each source's in-book numbers and
  is stable per the pinned tag; favorites/reads survive updates.
- Hadith text is Arabic with curated or upstream English translations; it
  is never machine-translated or generated.
- Entry explanations (`meaning`/`meaningEn`) exist only where a reviewed
  source provided them — new explanations are never invented (sacred
  content rule).

**Religious-content rules:** see `docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md`.
Source attribution and a reviewer sign-off are required before merging.
Upstream changes (new tags, renumbering) must be re-verified, never
auto-followed: the mirror tag is pinned on purpose.
