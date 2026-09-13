# How to add a religious content source

Religious text is handled with higher scrutiny than other features. The
goal is **correct, attributable, reviewed** content — never machine-
generated or unattributed.

---

## Requirements before opening a PR

1. **Source attribution.** Every new source must be named, with a stable
   reference (published book, verified API, scholarly edition).
2. **Accuracy.** Arabic text is **never machine-translated or AI-
   generated** by this project. Translations must come from a known,
   reputable translator/edition with explicit permission or public-domain
   status.
3. **Review.** A PR adding a new hadith edition or tafsir must include a
   note on who reviewed the Arabic source and what was verified (e.g.
   "checked against sunnah.com references for edition X; 3 of 500 hadith
   validated; no discrepancies found").

## What belongs in `app/lib/data/` and `public/data/`

- **`public/data/*.min.json`**: generated corpus files (mushaf, tafsir,
  translation). These are **build artifacts** — do not hand-edit; update
  the generation pipeline and re-run instead (see `public/data/README.md`).
- **`app/lib/data/*.ts`**: curated catalogs (surah metadata, hadith
  selections, learning paths, Arabic topic trees). TypeScript source is
  the source of truth; JSON is a derived output.

## Step-by-step: adding a new hadith edition

1. Find a clean, reliable digital source (API, public-domain JSON, or
   verified book scan).
2. Add a row to the appropriate catalog (e.g. `hadith-library.ts` /
   `hadith-full.ts` cache list) with `id`, `name`, `source`, and
   `attribution` fields.
3. Add the CDN allowlist entry in `next.config.ts` CSP if the content is
   fetched at runtime (not bundled); update `lib/privacy.ts` NETWORK_ACCESS
   with the new domain and reason.
4. Update `docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md` (this file) with the
   source used.
5. Add a unit test that fetches one representative document from the
   source (when network tests are allowed in CI) or snapshot a locally-
   saved representative fixture (preferred, for deterministic CI).
6. Run `npm run docs:check` (storage keys), `npm run test`, and open the PR.

## Step-by-step: adding a new tafsir

Same as hadith above, with the additional requirement that the Arabic
text is presented as-is (do not reformat line breaks, strip diacritics,
or normalize away tashkil unless there is a documented readability reason
accepted in code review). Update `tafsir.ts` sources list.

## Never do

- Paste religious text without source metadata.
- Add hadith without attribution and chain/scholar reference (even if
  abbreviated).
- Auto-translate Arabic into other languages using machine translation.
- Add content that claims a chain/authority that cannot be independently
  verified from the source name.
- Mix denominational/scholarly opinions without documenting the origin
  and scope.

## Review process

A PR adding religious content must be labeled `religious-content` and
merged only after:

1. Source attribution + accuracy are documented in the PR description.
2. The `guidance-safety` scan passes (new user-facing religious strings
   must be sourced, not generated).
3. A maintainer (or designated subject-matter reviewer listed in
   CODEOWNERS) approves the source + transcription accuracy.

## Testing philosophy

The app deliberately avoids making religious judgments. Tests for religious-
content features verify:

- Correct fetching/bundling (data arrives, is parsed, is not corrupted).
- Attribution metadata is present and matches the source.
- UI rendering of Arabic + translation is complete and not truncated.

Tests do **not** assert theological correctness or denominational
alignment — that is beyond the scope of this project's test suite.
