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
- Full-book editions (10 books) load on demand and cache for the session;
  English translations load lazily per book only when the EN toggle is on
  (Arabic readers never pay for them; a blocked/missing EN edition
  degrades to Arabic-only, never an error). The UI falls back to the
  curated set if the network call fails.
- Hadith text is Arabic with curated or upstream English translations; it
  is never machine-translated or generated.
- Entry explanations (`meaning`/`meaningEn`) exist only where a reviewed
  source provided them — new explanations are never invented (sacred
  content rule).

**Coverage gap (honest):** full Musnad Ahmed and Sunan al-Darimi texts
are not offered by the verified CDN source (its index lists 10
collections), and no keyless reputable alternative exists — so the
full-book browser cannot include them today. Their curated selections
remain. Revisit only with a reviewed, keyless source (CSP + privacy
manifest updates required).

**Religious-content rules:** see `docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md`.
Source attribution and a reviewer sign-off are required before merging.
