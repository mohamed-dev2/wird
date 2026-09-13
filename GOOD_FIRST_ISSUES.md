# Good first issues

Wird is intentionally small and heavily documented — ideal for first
contributions. Every area below lists realistic, self-contained starter
work. Labels to add when filing: `good first issue` + one area label.

## UI (pure presentational)

- Icon/svg polish (theme-var-only colors, reduced-motion gate).
- Empty-state copy improvements (AR + EN together).
- Micro-interactions that don't affect layout (safe-area, selection,
  focus glow) — see `app/additions.css` for the pattern and
  `scripts/check-css.mjs` for the rules.

## Accessibility

- Run axe/WAVE on each route; fix findings (focus order, labels,
  contrast) and add a Playwright `a11y` spec using the existing runner
  (see docs/ACCESSIBILITY.md for the motion/logical-property gates).
- Audit the `skip-link` + keyboard navigation on `/account` and
  `/insights`.

## Localization

- Add a third language end-to-end (see docs/HOW_TO_ADD_A_LANGUAGE.md);
  the dictionary is a flat AR/EN key map (`app/lib/strings.ts`) plus
  `Lang` type + `dir` handling in `i18n.ts`.
- Map untranslated religious placeholders (Arabic-only content is a
  documented choice; write up where glossary could help).

## Tests (highest value, lowest risk)

- One more quarantine/recovery edge case for `schema.test.ts`
  (unlisted v9 future version, deeply nested array salvage).
- One backoff/throttle unit test asserting the exact schedule.
- One e2e proving the export consent log renders on the Account page.

## Documentation

- Extend an ADR or a feature doc with an "operations" paragraph.
- Fix a broken internal link — `npm run docs:check` now fails on them.
- Add a worked example to docs/API.md for a subsystem you read.

## Performance

- Profile `/insights` on a 1000-day synthetic history; document hot paths
  in docs/PERFORMANCE.md and add a regression test for the hot function.
- Audit `analytics.ts` trend windows for accidental O(n²) (see the
  complexity notes already in the file).

## Analytics

- A new explainable insight rule: add the firing case AND a
  below-threshold case to `analytics.test.ts` (gate: no silent rules).
- A calendar heat legend for a new aggregation.

## Storage

- A new versioned dataset with migrate-on-read (see DOCUMENTATION.md §4
  and docs/features/storage.md) plus round-trip + quarantine tests.

## Security (read-only review tasks)

- Reproduce the threat model in SECURITY.md against a fresh checkout and
  file "gaps" issues — no code expected, just evidence.
- Review `lib/privacy.ts` `sensitivityOf()` mapping against DOCUMENTATION.md
  §4 and open a PR updating either side.

## Meta

- Improve `npm run docs:check` messages or add a `vscode` task you used.
- Translate the README summary into Arabic (correct the existing one).
