# Third-party notices

This file lists all third-party components, their licenses, and
attribution requirements. It is generated from `package.json` + runtime
data and must be updated when dependencies change.

## Runtime dependencies

| package       | version | license | homepage                                                                    |
| ------------- | ------- | ------- | --------------------------------------------------------------------------- |
| next          | 16.3.4  | MIT     | https://github.com/vercel/next.js                                           |
| react         | 19.3.0  | MIT     | https://react.dev                                                           |
| react-dom     | 19.3.0  | MIT     | https://react.dev                                                           |
| qrcode        | 1.5.4   | MIT     | https://www.npmjs.com/package/qrcode                                        |
| jsqr          | 1.4.0   | MIT     | https://www.npmjs.com/package/jsqr                                          |
| @types/qrcode | 1.5.6   | MIT     | https://www.npmjs.com/package/@types/qrcode (types-only; stripped at build) |

## Dev dependencies

| package                         | version | license    | purpose                     |
| ------------------------------- | ------- | ---------- | --------------------------- |
| @playwright/test                | 1.63.0  | Apache-2.0 | e2e testing                 |
| @types/node                     | 22.20.2 | MIT        | TypeScript types            |
| @types/react                    | 19.3.0  | MIT        | TypeScript types            |
| @types/react-dom                | 19.3.0  | MIT        | TypeScript types            |
| @commitlint/cli                 | 21.2.2  | MIT        | commit message linting      |
| @commitlint/config-conventional | 21.2.2  | MIT        | commit convention           |
| eslint                          | 9.39.2  | MIT        | code linting                |
| eslint-config-next              | 16.3.4  | MIT        | Next.js ESLint rules        |
| prettier                        | 3.9.6   | MIT        | code formatting             |
| typescript                      | 5.9.3   | Apache-2.0 | type checking / compilation |
| vitest                          | 5.0.0   | MIT        | unit testing                |
| husky                           | 9.1.7   | MIT        | git hooks                   |
| lint-staged                     | 17.5.0  | MIT        | staged file linting         |

## Data files (bundled)

| file                     | source                          | license                  | notes                  |
| ------------------------ | ------------------------------- | ------------------------ | ---------------------- |
| `quran-uthmani.min.json` | Open-source Uthmani mushaf data | Public domain / CC0      | reviewed corpus        |
| `en-clear.min.json`      | Clear Quran translation         | CC BY-SA 3.0             | attributed translation |
| `ar-jalalayn.min.json`   | Jalalayn tafsir                 | Public domain            | classical tafsir       |
| `ar-nawawi.min.json`     | Nawawi 40 hadith                | Public domain            | classical hadith       |
| `bip39-en.txt`           | BIP-39 wordlist                 | MIT (CC0-1.0 equivalent) | standard wordlist      |

## Quran / Hadith content licensing

All Quran text is sourced from reviewed open datasets. Hadith content is
sourced from verified digital editions (CDN fallbacks from
`fawazahmed0/hadith-api` — MIT). Translation licensing is verified
per-edition (see `docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md`).

## Fonts

The project uses system fonts (no bundled fonts). No font licensing
is required.

## Icons / assets

All icons are inline SVG or emoji. No external icon libraries or
licensed assets are used.

## How to update this file

1. Run `npm ls --all --json` for current versions.
2. Check each new/changed package's license on npmjs.com.
3. Update the table above.
4. Run `npm run docs:check` (no automated check on this file — human
   review required).
