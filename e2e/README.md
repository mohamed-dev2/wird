# e2e/

Playwright end-to-end tests. They run against the **production build**
(`next build`), never dev mode.

- Run: `npm run test:e2e` → `npx playwright test --workers=1` (serial is
  pinned in the script; the suite is flaky under parallel workers).

Conventions:

- One spec per major flow. Current specs: `smoke` (today, routes,
  theme/lang, tilt, ayah menu, prayer arc), `transfer` (transfer card,
  recovery phrase, QR snapshot), `recovery` (`/recovery` health,
  corruption survival, profile isolation), `companion` (fresh start,
  10-day return, 95-day restart), `analytics` (insights layers, empty
  state), `private-plans` (plan lifecycle, quick exit, leak scan),
  `offline` (external blocked + full browser offline: core flows, bundled
  search, plans, calm CDN failures, true-offline restart),
  `personalize` (fatigue notice + pause, settings persistence),
  `reliability` (safe-mode parks + core-works + exit).
- Offline simulation: `page.route` aborting non-loopback hosts (external
  cut, localhost alive) for degraded-network flows; `context.setOffline`
  (browser-wide, SW-tested) for airplane-mode flows. Fresh context per
  test, so offline state never leaks between tests.
- Every spec ends with a hydration-listener assertion (no content
  mismatch between SSR HTML and client render).
- Recovery checkbox is targeted by name `/أؤكد أنني كتبتها/` (Arabic
  regex name) — do not match on text content.
- New feature → new smoke spec + basic interaction test
  (`docs/HOW_TO_ADD_A_FEATURE.md`, step 6).

Structure: `playwright.config.ts` decides baseURL (127.0.0.1:3119 prod
server, built first via `npm run build`); specs share an
`ensureProfile` helper that creates a fresh profile per test.
