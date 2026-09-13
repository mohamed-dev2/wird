# Accessibility

Wird aims for usable (not just compliant) accessibility in Arabic RTL and
English LTR, on touch and desktop.

## Baseline

- **Skip link** on every layout: `#main-content`.
- **Logical CSS properties** throughout (`margin-inline`, `padding-block`,
  `inset-block-end`, etc.); `scripts/check-css.mjs` enforces this for
  new code.
- **`prefers-reduced-motion: no-preference`** gate on all animations; the
  `motion: none` utility class in `app/additions.css` disables all
  animation globally.
- **Focus-visible** styling on all interactive elements (blue ring, high
  contrast).
- **Keyboard navigation:** every view is reachable and operable by Tab.
  Custom components (`modal`, `companion`, `profile-scope`) use the
  appropriate ARIA roles/attributes.
- **Screen-reader announcements:** status toasts (`backup-msg`) are visible
  to assistive tech; loading/skeleton states use `aria-busy` where
  appropriate.
- **High contrast / forced-colors:** `app/additions.css` preserves
  readable structure via `forced-color-adjust: none` on key components.
- **Print stylesheet:** strips chrome, secrets, and visual effects; only
  document content is printable.

## What to audit before merging

- Run axe / WAVE on every route, especially `/account`, `/library`,
  `/insights`.
- Verify focus order: interactive → status → informational.
- Confirm every image has either `alt` or `aria-hidden` (emoji icons in
  Wird are decorative and marked `aria-hidden`).
- Test with zoom to 200%+ (logical properties must keep layout stable).

## VRAM / contrast notes

The token palette is documented in `app/tokens.css`. If a color is added
that carries meaning (success, warning, danger), the meaning must also be
encoded in text/shape (`never color-only`), and a `forced-colors` fallback
must be checked.

## Known limitations

- The Quran reader is text-heavy and currently does not implement
  `aria-activedescendant` virtual cursor navigation; it is usable via
  arrow keys and scroll but not optimized for screen-reader linear reading
  of the full mushaf. This is documented as an area for future work.
- Voice/transcription has been removed (ADR-002); speech-to-text is not
  part of the current accessibility surface.

## Testing resources

- Playwright a11y specs live in `e2e/`; add a new route's smoke test with
  `@axe-core/playwright` assertions (see the existing smoke specs for the
  pattern).
- `app/additions.css` documents every a11y-layer rule with a
  comment header.
