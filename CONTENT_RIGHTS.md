# Content rights register

Non-code content in Wird: what it is, where it came from, what rights
apply, and what is still awaiting professional review. Classical texts
are public domain as works; specific digital editions, translations, and
recordings carry their own rights — recorded honestly below, never
assumed away.

| Content                                                        | Creator / source                                                                 | License / status                                                                                      | Attribution                                 | Modification / redistribution            | Restrictions                                   |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| Uthmani mushaf (`public/data/quran-uthmani.min.json`)          | reviewed dataset (exact upstream edition to be confirmed at professional review) | classical text public domain; digital edition rights **under review**                                 | none in-app yet — gap, see below            | generated artifact, do not hand-edit     | review before redistributing outside this app  |
| ClearQuran English (`en-clear.min.json`)                       | ClearQuran edition data                                                          | third-party translation, **rights under review** (non-commercial use assumed pending verification)    | Library sources block (in-app)              | do not hand-edit                         | review before any new use                      |
| Jalalayn tafsir (`ar-jalalayn.min.json`)                       | classical (Al-Mahalli / Al-Suyuti, d. 1459/1505)                                 | public domain work; transcription **under review**                                                    | Library sources block                       | do not hand-edit                         | —                                              |
| Nawawi selections (`lib/data/hadith.ts`, `ar-nawawi.min.json`) | Imam al-Nawawi (d. 1277); English renderings as curated                          | public domain work; EN renderings **under review**                                                    | Library sources block                       | curated source only, reviewer sign-off   | never machine-translate                        |
| Curated hadith selections (11 books)                           | classical collections; EN as curated                                             | public domain works; EN renderings **under review**                                                   | Library sources block                       | curated source only                      | never generate                                 |
| Full-book editions (`hadith-api`, fawazahmed0)                 | open API, MIT-licensed code+data packaging                                       | MIT (upstream)                                                                                        | Library sources block + THIRD_PARTY_NOTICES | lazy CDN, SW-cached                      | follow upstream availability                   |
| Ahmed/Darimi mirror (`AhmedBaset/hadith-json@v1.2.0`)          | community mirror of Sunnah.com data (pinned tag)                                 | Sunnah.com-sourced, **terms review required**; partial (Ahmed ch. 8–30 absent); Darimi Arabic-only    | Library sources block + feature doc         | pinned tag only, never auto-follow       | re-verify on any tag change                    |
| Online tafsirs (`api.quran.com`)                               | Quran.com API resources                                                          | API terms apply, **review required**; all slugs verified live                                         | Library sources block                       | on-demand, cached                        | non-commercial assumption pending verification |
| Reciter audio (`everyayah.com`)                                | EveryAyah recitations                                                            | free streaming, **terms review required**                                                             | Library sources block                       | streamed, never cached/stored            | do not redistribute streams                    |
| BIP-39 wordlist                                                | SatoshiLabs BIP-39                                                               | public domain                                                                                         | —                                           | —                                        | —                                              |
| Fonts (Alexandria, DM Sans via `next/font/google`)             | Google Fonts, OFL-licensed                                                       | SIL Open Font License (self-hosted at build, no runtime font CDN)                                     | OFL met via self-hosting                    | —                                        | —                                              |
| App icon / brand visuals (`public/icon.svg`, hero art)         | project-created (wird-gamma)                                                     | Apache-2.0 with the code; trademark rules in GOVERNANCE.md                                            | —                                           | —                                        | trademark ≠ copyright                          |
| User content (goals, notes, reflections, plans)                | the user                                                                         | **user-owned**; app claims no ownership, takes only the local-processing permission needed to operate | —                                           | user edits/deletes anytime               | never used for any other purpose               |
| Curated learning paths / adhkar groupings                      | project-curated                                                                  | Apache-2.0 with the code                                                                              | —                                           | reviewer sign-off for religious accuracy | —                                              |

Rules (enforced by review, not just written here):

- New religious text requires source + reviewer sign-off
  (`docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md`); machine translation and
  generation of religious content are hard blocks.
- AI-generated explanations must be labeled as such and never presented
  as source material (none exist in the app today — this rule is
  preventive).
- "Under review" rows must clear professional review before any
  production launch statement about rights (see COMPLIANCE_MATRIX.md).
- Original vs translation vs explanation vs user reflection are visually
  separated everywhere they appear (companion blocks, reader, cards).
