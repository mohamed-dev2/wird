# e2e/

Playwright end-to-end tests. They run against the **production build**
(`next build`), never dev mode.

- Run: `npm run test:e2e` → `npx playwright test`.
- **Serial is required on this machine** (`--workers=1`); the suite is
  stable serial and flaky parallel.

Conventions:

- One spec per major flow (`transfer`, `isolation`, `companion`, `qr`,
  `hydration`, `schema`, `home`, `library`…).
- Every spec ends with a hydration-listener assertion (no content
  mismatch between SSR HTML and client render).
- Recovery checkbox is targeted by name `/أؤكد أنني كتبتها/` (Arabic
  regex name) — do not match on text content.
- New feature → new smoke spec + basic interaction test
  (`docs/HOW_TO_ADD_A_FEATURE.md`, step 6).

Structure: `playwright.config.ts` decides baseURL/open handles; helpers
live in `fixtures/`.
