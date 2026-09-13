# Localization

Wird's default language is Arabic (RTL). English is supported via a
flat typed dictionary. This document is the reference; the tutorial is
`docs/HOW_TO_ADD_A_LANGUAGE.md`.

## Design

- Dictionary lives in `app/lib/strings.ts`: one AR object + one EN object
  with identical key sets. Parity is CI-enforced (`docs:check`).
- `Lang` type (`"ar" | "en"`) drives direction and rendering.
  `useT()` (from `app/lib/i18n.ts`) returns a localized string by key.
- The HTML root is `lang="ar" dir="rtl"`. English UI renders inline via
  `useT()` without changing the root attributes. Logical CSS properties
  (`scripts/check-css.mjs`) make LTR languages feasible without a layout
  rewrite.
- Religious text (Quran, hadith, adhkar) stays in canonical Arabic; curated
  English translations are **data**, not app copy. They are never merged
  into the dictionary.

## Rules

1. Every user-facing AR key must have a matching EN key (and vice versa).
2. New guidance/companion strings must be prefixed `cm:|tw:|ret:|an:|goals`
   and pass the `guidance-safety` scan.
3. Interpolation uses `{param}` syntax (never template literals in
   user-facing output).
4. Placeholders are marked in the UI with `aria-label` or `(…)` so
   screen readers don't produce ungrammatical output.
5. Pluralization is currently handled by key strategy (e.g. `count` suffix,
   separate keys per count class). Document the chosen strategy when adding
   a new pluralization pattern.
6. Never localize brand/app names; keep `وِرد` / `Wird` as-is across
   languages.

## Where to find the string for a UI element

Search `strings.ts` for the key (the `eyebrow` / `aria-label` / visible
text convention makes keys discoverable). In React, the translation is
rendered by `useT()("key")` or by the `t("key")` alias if destructured
from context.

## Missing-key detection

If a key is missing in the EN object (or vice versa) `docs:check` fails
the build. In development, the key name itself is rendered — a visible
signal during development that a string needs adding.

## Adding a new language

See `docs/HOW_TO_ADD_A_LANGUAGE.md` for the step-by-step tutorial.

## Extending to more than two languages

The current architecture assumes two languages (AR + EN) because the
dictionary is flat and the root is AR+RTL. Extending to a third language
would require:

1. A `languages: Record<Lang, string[]>` or equivalent for the third
   language.
2. A `dir: Record<Lang, "ltr" | "rtl">` map.
3. Updating `useT` to accept a dynamic `Lang` context.
4. Ensuring CI parity covers all three.

This is a documented, acknowledged future improvement — not a bug.
