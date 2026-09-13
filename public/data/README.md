# public/data/ — GENERATED DATA — DO NOT EDIT BY HAND

The files in this directory are **derived/generated artifacts**, produced
from reviewed sources by external tooling (the producing pipeline lives
outside this repo today). Do not hand-edit them in a PR:

- Any change to this data must go through the **source** pipeline and be
  documented in the same PR (see `docs/SAFE_CODE_GENERATION.md`).
- Until that pipeline is in-repo, treat a data change as a
  content-change requiring the religious-content review process.

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
