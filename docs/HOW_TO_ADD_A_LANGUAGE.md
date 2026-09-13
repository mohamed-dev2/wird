# How to add a language

Wird ships with AR + EN. This tutorial walks you through adding a third
language or updating an existing one.

## Prerequisites

- A working local dev server (`npm run dev`).
- Confidence translating religious/app copy accurately.
- Understanding of RTL vs LTR implications (the app root is `ar` + RTL;
  the app does not yet switch root direction dynamically).

## Step-by-step

### 1. Add the dictionary section (`app/lib/strings.ts`)

Find the `EN` object. Add a new parallel object for your language (e.g.
`FR`, `TR`, `MS`) with **every key** from `EN` translated. Use the same
string-interpolation placeholders (`{n}`, `{count}`, etc.).

Notes:

- Religious Arabic text is **never** translated into the dictionary; it
  stays in datasets (Quran/hadith) as literal Arabic. Add English/other
  translation data in the appropriate corpus, not the strings file.
- The dictionary is flat and small (~925 keys); keep it that way.
- Prefix new religious/guidance strings as before (`cm:|tw:|ret:|…`) so
  the `guidance-safety` scan applies to every language.

### 2. Extend the `Lang` type (`app/components/wird-store.tsx`)

Add the new language code to the union (e.g. `"fr"`); then update the
dir map and `useT` in `app/lib/i18n.ts` to select the new dictionary.
(`Lang` lives with the store — see TD-8 in `docs/TECH_DEBT.md`.)

### 3. Add to `scripts/check-docs.mjs` parity logic (if adding a third language)

Currently the parity check compares AR vs EN. If you add a third language,
the simplest fix is to make the parity check compare all N dictionary
objects pairwise (or assert every key appears in every language object).

### 4. Update CI gate (`docs:check`)

`npm run docs:check` must pass before you open the PR. The parity rule
will be the first thing it catches — failing CI means there are missing
keys.

### 5. Add RTL/LTR direction handling

If your new language is LTR, the app will render its Arabic components in
an LTR root correctly via logical CSS properties (`scripts/check-css.mjs`
enforces this), but the overall page will remain RTL-rooted (because
`lang="ar" dir="rtl"` is in `layout.tsx`). Two paths:

- **Acceptable for now:** the new language UI renders inline inside the RTL
  shell (consistent with the current AR/EN behavior).
- **Ideal:** add a `lang` + `dir` attribute change on `<html>` driven by
  the language toggle (a client-side `suppressHydrationWarning`-compatible
  hydration story is needed). This is a larger change; document it in an
  ADR if you pursue it.

### 6. Test every screen

- Run `npm run test` and `npx playwright test --workers=1`.
- Manually toggle the language and visit every route: strings must be
  complete (no key names rendered), and layout must be stable.
- Add a Playwright smoke test that switches to the new language and
  verifies one route renders without missing keys (see the existing
  theme/language e2e for the pattern).

### 7. Submit

Open a PR with:

- The language name and ISO code in the title.
- A note on whether this language is RTL or LTR.
- Confirmation that `npm run docs:check` parity passes.
- Any known missing translations (document them as issues). A language
  should be merged only when **all** keys are present — a partial
  translation is not merged.
