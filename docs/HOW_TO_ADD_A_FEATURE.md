# How to add a feature

Step-by-step for a contributor adding a new user-visible capability.

## 1. Understand the data boundary

- Will this feature read/write localStorage?
- Is the data sensitive (document it in `lib/privacy.ts` + DOCUMENTATION.md
  §4).
- Will it make a network request? If yes, update `docs/NETWORK.md` +
  `lib/privacy.ts` + the CSP in `next.config.ts`.

## 2. Define the types

Create the type in the owning `lib/*` module (or a new one if the feature
has a clear boundary). Use strict types (`noUncheckedIndexedAccess` is on;
avoid `any` — see CONTRIBUTING.md).

## 3. Add persistence if needed

- Add a `Schema` entry in `lib/schema.ts` (name the key `wird-*`, version
  1).
- Write a fallback default and a validator; add a migration if the feature
  starts behind an existing key.
- Document the key in DOCUMENTATION.md §4 (**CI will fail** if you
  forget).
- Add a round-trip test in `schema.test.ts` (valid shape + quarantine of
  unknown).

## 4. Add the UI

- Prefer a tab view in `components/views/*` (thin, props-driven) or a new
  component in `components/*` if reused across routes.
- Use `useStoredState` for local state; follow the hydration rule (no
  storage reads during render).
- Follow the copy rules: AR+EN keys for every user-facing string; add
  them in `strings.ts` (parity gate runs on every CI).

## 5. Add accessibility

- Every interactive element: `aria-label` or visible label.
- Logical CSS properties only.
- Add `prefers-reduced-motion: no-preference` around any animation.
- If the feature is a new route: add a `#main-content` target and verify
  the skip link still works.

## 6. Add tests

- **Unit test:** pure logic goes to `lib/__tests__/yourfeature.test.ts`.
- **E2E:** basic render + one happy-path interaction in `e2e/yourfeature.spec.ts`.
  E2E runs against the prod build (`next build`), not dev mode.
- If the feature is an insight rule or companion state, add both the
  firing case **and** a below-threshold/silent case.

## 7. Add documentation

- Update `docs/ARCHITECTURE.md` (layers) if the feature changes the
  dependency graph.
- Add/update a feature doc in `docs/features/` (see
  `docs/features/README.md` for the template).
- If the feature introduces a new failure mode, document it in
  `docs/ERROR_HANDLING.md`.

## 8. Update navigation and PR

- Update the navigation in `Shell` or the relevant route page if
  necessary.
- Run `npm run diagnose` locally; fix whatever fails.
- Write a conventional-commit PR title (`feat:`, `fix:`, `docs:`…).
  The husky hook enforces the format.

## Before you merge

- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run test` (unit)
- `npm run test:e2e -- --workers=1` (e2e — serial on this machine is stable)
- `npm run build`
- `npm run docs:check`
- `npm run comments:check`
- `npm run css:check`
- `npm audit --audit-level=moderate`
