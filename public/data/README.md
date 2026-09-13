# public/data/ — GENERATED DATA — DO NOT EDIT BY HAND

The files in this directory are **build/generated artifacts**, produced
from reviewed sources by the generation pipeline (scripts + upstream
datasets listed below). Do not hand-edit them in a PR:

- Changes must go through the **source pipeline**, not the JSON.
- Any edit that lands here without the accompanying tooling change will
  be rejected in review.
- Regenerate after changing sources: `npm run build:data` (or the specific
  generator in `scripts/`).

| file                     | content                                    | generated from           |
| ------------------------ | ------------------------------------------ | ------------------------ |
| `quran-uthmani.min.json` | Uthmani mushaf (full corpus)               | reviewed Quran dataset   |
| `en-clear.min.json`      | Clear English translation (verse-by-verse) | Clear Quran edition data |
| `ar-jalalayn.min.json`   | Jalalayn tafsir (Arabic)                   | reviewed tafsir dataset  |
| `ar-nawawi.min.json`     | Nawawi 40 hadith (Arabic)                  | reviewed hadith dataset  |
| `bip39-en.txt`           | BIP-39 English wordlist (recovery secret)  | official BIP-39 list     |

Access your edited data from code via `app/lib/quran.ts` /
`hadith-full.ts`; do not import these JSON files directly from
`components/` (layer rule: JSON access goes through `lib/` content
loaders).

Stability: these are versioned content sets. Changing them is a
content change (see `docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md` review
requirements) and requires a matching bump in the related catalog.
