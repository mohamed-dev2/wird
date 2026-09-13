# app/lib/data/

Curated, versioned content that ships with the app (O(1) lookups, no
network). This is **source content**, not generated output.

| file           | content                                                            |
| -------------- | ------------------------------------------------------------------ |
| `hadith.ts`    | curated famous hadith selections with English translations         |
| `paths.ts`     | leveled learning roadmaps per Islamic science (4 levels each)      |
| `surahs.ts`    | Madani-mushaf surah order + names (ayah counts derived at runtime) |
| `topics-ar.ts` | English hadith-topic names mapped to Arabic                        |
| `verses.ts`    | curated return-screen verse references (resolved at runtime)       |

**Rules:**

- This directory is for **curated** content reviewed for accuracy and
  sourcing (see `docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md` for religious
  content).
- Generated/build artifacts live in `public/data/`, NOT here.
- Changing a catalog entry that affects rendering must have a unit test
  (e.g. every habit id has a translation key).
