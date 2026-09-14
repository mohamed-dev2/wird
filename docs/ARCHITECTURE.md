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
    → lib/private-plans.ts       self-management plans (pure + storage helpers)
    → lib/deen.ts                deen journey state + logic (pure + storage helpers)
    → lib/deen-catalog.ts        deen content catalogs (no user data, key refs only)
    → lib/net.ts                 bounded fetch for optional-online loaders
    → lib/storage-adapter.ts     async persistence seam (see below)
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

## Storage seams (replaceable persistence)

Two boundaries, one direction — domain logic never touches a storage
primitive directly:

- `StorageLike` (`schema.ts`): the synchronous seam all current code
  uses (`getItem`/`setItem`/`removeItem`/`length`/`key`). `localStorage`
  in production, in-memory fakes in tests.
- `StorageAdapter` (`storage-adapter.ts`): the async seam
  (`get`/`set`/`delete` promises) for future platforms (sync engines,
  native ports, test harnesses). `storageLikeAdapter()` wraps any
  `StorageLike`; `memoryAdapter()` is self-contained. Tested, not a stub.

Rule 3 above (centralized persistence) is what makes both seams hold:
a future backend changes the adapters, never the domain modules. The
offline contract built on this lives in `docs/offline-architecture.md`.
