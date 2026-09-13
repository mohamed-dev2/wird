# Versioning, migrations, and deprecation

This document explains how Wird versions schema, storage, public API
surface, and handles changes without breaking existing users.

## Version scheme

`package.json` follows SemVer (`0.x.y`). The `0.x` range is appropriate
because the storage schema is still being established and the app is
not a library. Once public API/stable-storage is defined the project will
move to `1.x` with stronger backward-compatibility promises.

- Patch (`x.y+1`): content updates, doc fixes, pure additions to
  `docs/` or tests.
- Minor (`x+1.y`): new features that are backward-compatible at the
  storage level (new keys + schemas, never deleting old ones).
- Breaking (`next major`): removal of `@deprecated` APIs, migration of
  `Schema.version` on existing datasets, or changes that alter the shape
  of a backup manifest that other tools consume.

## Schema versioning (zero-loss contract)

Every dataset in `lib/schema.ts` is keyed by its `wird-*` name and carries
its own independent version. Lifecycle:

1. New dataset → `S(1, is…Like, fallback, { migrate?, normalize? })`.
   Version starts at `1`.
2. Shape change on the **same** `wird-*` key → bump `Schema.version`
   inside the same entry, never delete the key. `migrate` receives old
   `d` and returns new `d`.
3. On read: future-version values are preserved **untouched** in
   quarantine; the app serves the fallback, and the original bytes are
   there if a rollback is needed.

### What a migration looks like

`old { day, value }` → `new { day, value, meta }`:

```ts
"mykey-v1": S(
  2,
  (v) => isObj(v) && isStr((v as { meta?: unknown }).meta),
  () => ({ day: "", value: 0, meta: "" }),
  { migrate: (v: any) => ({ ...(v as object), meta: (v as { meta?: string }).meta ?? "" }) },
)
```

Migrations must **spread old data** (`{ ...old, newField }`). They must
never drop existing fields; if a field becomes unused, keep it with a
meaningful default to avoid silent data loss.

### When is a new key needed vs. migrating an old one?

- New feature behavior → new `wird-*` key.
- Same data, different shape → bump version + add `migrate` on the
  existing key. Never delete the key; never rename it.
- Renaming is allowed only if a compatibility alias is added for one
  release (see `@deprecated` below).

### Tests

Every migration has at least:

- A round-trip test (old shape → migrate → validate → back).
- A quarantine test (future version content quarantined, not lost).

See `app/lib/__tests__/schema.test.ts`, `crypto-restore.test.ts`.

## Backup format

`buildBackupFile` emits `EncryptedBackupPayload` v2, stamped with:

- `appVersion` — `package.json` version at export time.
- `scope` — `{ kind: "device" }` or `{ kind: "profile" }`.
- `datasets` — manifest of validated entries (auditable inventory).

Backup format changes (e.g. adding `scope`) are additive and include a
fallback path in `parseBackupFile`; new fields are ignored by old clients
when not needed. Backup format breaks require a major version bump and
documented migration for any third-party parsers (if any exist).

## Public TypeScript surface (`docs/API.md`)

Functions marked "pure / no side effects" in API.md are the stable
contracts for subsystem replacements. Everything else is internal and
may change within a minor release if the docs update. Deprecated
functions carry a `@deprecated` JSDoc tag stating:

- **what** is deprecated
- **when** (version or rationale)
- **replacement**
- **removal target version**

Example: `restoreBackup` (crypto.ts) → replacement `restoreBackupSafe`
→ removal target "next major".

## Deprecation policy

1. A `@deprecated` JSDoc tag is added in the _minor_ release where the
   function/key is superseded.
2. The deprecated item remains available through the rest of that minor
   and the entire next minor.
3. Removal is done in the _major_ release **after** the deprecation
   minor. CI/docs:check must be updated for any key removal.
4. Storage keys are **never deleted**; at most they stop being written.
   Quota cost is documented and accepted rather than breaching the
   zero-loss contract.

## Breaking change checklist

- [ ] Bump `package.json` version to new major.
- [ ] Update CHANGELOG.md **Breaking** section.
- [ ] Remove deprecated code after migration window.
- [ ] Add/update schema migration if the removed item had storage.
- [ ] Run `npm run diagnose` + `npx playwright test --workers=1`.
- [ ] Note any consumer (third-party tools consuming backup JSONs)
      in the release notes.
