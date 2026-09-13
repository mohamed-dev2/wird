# app/lib/data/

Curated, versioned content that ships with the app (O(1) lookups, no
network). This is **source content**, not generated output.

| file                                       | content                                                  |
| ------------------------------------------ | -------------------------------------------------------- |
| `wird.ts`                                  | catalog sections/habits (Arabic; versioned with the app) |
| `quran.ts`                                 | surah metadata + corpus index                            |
| `hadith.ts`                                | curated hadith selections                                |
| `adhkar.ts`                                | daily remembrance groups                                 |
| `goals.ts` / `challenges.ts` / `habits.ts` | feature catalogs                                         |
| `dream.ts` / `qada.ts` / `kids.ts`         | feature datasets                                         |

**Rules:**

- This directory is for **curated** content reviewed for accuracy and
  sourcing (see `docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md` for religious
  content).
- Generated/build artifacts live in `public/data/`, NOT here.
- Changing a catalog entry that affects rendering must have a unit test
  (e.g. every habit id has a translation key — `docs:check` enforces
  coverage).
