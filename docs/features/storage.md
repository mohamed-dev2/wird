# Storage (zero-loss schema)

The versioned validation/quarantine/migration layer under every local key.

- Core module: `app/lib/schema.ts` (imports nothing project-internal).
- Feature logic: `app/lib/wird.ts` (`loadFromStorage`/`saveToStorage`),
  `app/lib/use-stored-state.ts` (hydration-safe React state).
- Backup/restore/transfer: `app/lib/crypto.ts`.
- Versioning + migration policy: `docs/VERSIONING.md`.

**The contract:**

1. New writes are enveloped `{ __wird: { v, updatedAt }, d }`; legacy bare
   values still read and migrate on read (never rewritten in place).
2. Read path: parse → unwrap → future-version guard (preserve untouched,
   serve fallback) → migrate → validate → normalize-salvage → quarantine.
3. Quarantine entries carry the original bytes and a 30-day TTL.
4. Restore is atomic: preview first, rollback on any write failure, never
   write nothing over something.

**Rules for contributors:** every new key needs a schema entry, a
DOCUMENTATION.md §4 row, and a round-trip + quarantine test; schema.ts
must never gain imports (keep it the foundation: `npm run typecheck`
guards against accidental cycles only loosely — CI review is the backstop).
