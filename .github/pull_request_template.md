## What changed?

One or two sentences. Link the issue if any.

## Why?

The motivation; "because the template said so" is not one.

## What could break?

Be specific: storage keys, hydration, privacy, transfer flows, offline,
anything that silently regresses.

## How was it tested?

```bash
npm run diagnose      # typecheck + lint + format + docs + comments + css + boundaries + unit
npm run test:e2e      # npx playwright test --workers=1 (serial)
npm run build
```

List what you ran and what passes.

## Checklist (tick only if really checked)

- [ ] **Privacy**: no new data leaves the device; if a network request
      was added/changed, NETWORK.md + lib/privacy.ts are updated.
- [ ] **Accessibility**: keyboard/focus okay, reduced-motion gate, logical
      CSS properties.
- [ ] **Localization**: every new user-facing string has AR + EN keys
      (docs:check enforces parity).
- [ ] **Offline**: feature works with no network; any load has a fallback.
- [ ] **Migration**: if storage changed, schema entry + DOCUMENTATION §4 +
      test; never delete old data.
- [ ] **Docs**: the relevant docs/feature files + CHANGELOG are updated.

> AI-generated code is fine — but it is reviewed and tested exactly like
> human-written code (see AGENTS.md). Do not skip the checklist because
> you didn't write the code.
