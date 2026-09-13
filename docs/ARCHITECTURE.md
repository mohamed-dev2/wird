# Architecture

Wird is a Next.js App Router PWA. All persistence is synchronous
`localStorage` behind a validation layer; there is no server, no database,
no API layer at all.

## Layers (depend downward only)

```
routes (app/*/page.tsx)          thin: assemble + render
  → components/views/*           tab views (props-driven, one concern each)
  → components/*                 shell, store, transfer, companion, library/*
    → lib/companion.ts           adaptive guidance (pure)
    → lib/analytics.ts           behavioral intelligence (pure)
    → lib/content.ts             verified-content index (refs only)
    → lib/coach.ts               insights brief (pure)
    → lib/history.ts             day records + windows (pure)
    → lib/wird.ts                catalogs + storage helpers
      → lib/profiles.ts          ids, namespacing, PIN hashing
      → lib/schema.ts            validation/migration/quarantine (imports nothing)
    → lib/crypto.ts              backups + atomic import (imports schema only)
    → lib/diagnostics.ts         health snapshots (read-only)
    → lib/vault.ts               optional reflection encryption
    → lib/strings.ts             AR/EN dictionary (imports Lang type only)
```

## Hard dependency rules

1. `lib/*` never imports from `components/*` (only the `Lang`/`Theme`
   types, which are type-only and erased at runtime).
2. `schema.ts` imports nothing project-internal — it is the foundation.
3. Components never touch `localStorage` for datasets directly; they go
   through `loadFromStorage` / `saveToStorage` / `useStoredState`, or the
   named module that owns the key (`profiles`, `recovery`, `vault`).
4. No new runtime dependencies without replacing an old one — the bundle
   stays tiny by policy (see CONTRIBUTING.md).
5. No `console.*` in `app/` (privacy: logs could leak content into
   crash reports and shared devtools).

## State lifecycle

Static fallbacks render SSR-identical HTML → mount-once effect hydrates
→ per-slice effects persist when mounted. Profile switch/logout reloads
the page on purpose: no cross-profile state can survive in memory.

## Storage map

See DOCUMENTATION.md §4 for every key. Rules: daily keys reset via
`{day, …}` envelopes checked against `dayId()`; per-profile keys are
prefixed `p_<id>_` (except the documented device-global set); new writes
are enveloped `{__wird: {v, updatedAt}, d}`; legacy bare values migrate
on read, never rewritten in place.
