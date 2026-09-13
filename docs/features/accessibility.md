# Accessibility feature

- Authoritative doc: `docs/ACCESSIBILITY.md`.
- Global styles: `app/additions.css` (focus rings, `prefers-reduced-motion`
  rules, forced-colors, print).
- CSS rules are enforced by `scripts/check-css.mjs` (logical properties,
  `!important` audit). Reduced-motion coverage is a code-review rule, not
  an automated gate.

**Key surface:** skip link, logical properties everywhere, keyboard
operability, color-contrast token palette, screen-reader-friendly
announcements (`backup-msg` status), and a print stylesheet that strips
secrets/chrome. See `docs/ACCESSIBILITY.md` for the pre-merge audit
checklist.
