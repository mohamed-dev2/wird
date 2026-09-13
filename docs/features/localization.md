# Localization feature

Authoritative docs: `docs/LOCALIZATION.md` (reference) and
`docs/HOW_TO_ADD_A_LANGUAGE.md` (tutorial).

- Dictionary: `app/lib/strings.ts` (AR/EN flat keys; AR is source of
  truth for user-facing wording).
- Service: `app/lib/i18n.ts` (`useT`, direction map); the `Lang` type
  itself lives in `app/components/wird-store.tsx` (see TD-8 in
  `docs/TECH_DEBT.md` for why).
- Direction: app root is `lang="ar" dir="rtl"`; inline LTR rendering via
  logical CSS properties (enforced by `scripts/check-css.mjs`).

**CI guarantees:** full AR/EN key parity is enforced by `docs:check`;
missing keys render as the key name during development so gaps surface
immediately.
