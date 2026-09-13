# Release engineering

Releases are reproducible, verified, and not assembled from memory.

## Release process (source of `git tag`)

```text
version preparation         bump package.json + WIRD_APP_VERSION (must match)
        ↓
full validation             npm run diagnose  (tsc, lint, format, docs, comments, css, unit)
        ↓
e2e                        npm run test:e2e  (npx playwright test --workers=1)
        ↓
security / deps            npm audit  +  npm run sbom
        ↓
documentation              update CHANGELOG.md, docs dates, docs/README.md, README
        ↓
build                      npm run build
        ↓
artifact verification      checksums (see below) + vercel/deploy review
        ↓
release notes              write GitHub release notes from CHANGELOG excerpt
        ↓
tag                        git tag vX.Y.Z && git push origin vX.Y.Z
        ↓
publish                    GitHub Release + (deploy triggers from tag)
```

## Versioning

- SemVer on `package.json` (currently `0.1.0`). `0.x` signals storage
  and API still stabilizing — see `docs/VERSIONING.md`.
- **`WIRD_APP_VERSION` in `app/lib/crypto.ts` must equal `package.json`
  version.** It is stamped into backup manifests; a mismatch breaks
  version detection on import. The CI asserts equality.

## Artifact integrity

Every release publishes a `SHA-256SUMS` file alongside the release notes,
listing the hash of each build artifact (the `.next` build reference
digest, the SBOM file, the source tarball).

Contributor verification (Linux/macOS/WSL):

```bash
shasum -a 256 -c SHA-256SUMS
```

We do not cryptographically sign artifacts yet; therefore the docs claim
only "SHA-256 integrity", never "verified signature". When signing is
added, this paragraph and the verification instructions change together.

## SBOM

Every release runs `npm run sbom`, producing `sbom.wird.json` in the
repo root (during the release) and attaching it to the GitHub Release.
Generation source: `scripts/generate-sbom.mjs`. See `docs/DEPENDENCIES.md`
and `THIRD_PARTY_NOTICES.md` for the human-readable equivalent.

## Reproducible builds

The build is deterministic given the same source revision + locked
dependency tree: the same `package-lock.json` + Node 22 produce the same
compiled output. Known non-determinism:

- **Timestamped artifacts**: Next.js output includes per-build surface
  file hashes (stable), but any embed of build time (none currently) would
  break byte-for-byte reproducibility.
- **npm provenance / OS**: `node_modules` installation may differ in
  metadata across OSes; it does not affect compiled output.
- **Playwright browser downloads**: not part of the app artifact.

Full byte-for-byte reproducibility is not a hard guarantee because
Turbopack does not promise it across tool versions; we guarantee it
**within a pinned toolchain** (`package-lock.json` + `.nvmrc`). This
limitation is documented rather than claimed away.

## Release checklist

- [ ] `package.json` version == `WIRD_APP_VERSION` (asserted by CI)
- [ ] `npm run diagnose` green
- [ ] `npm run test:e2e` (serial) green
- [ ] `npm audit` clean, `npm run sbom` regenerated
- [ ] CHANGELOG updated (current release on top), docs dates current
- [ ] `npm run build` green
- [ ] `SHA-256SUMS` regenerated from build artifacts
- [ ] tag `vX.Y.Z` pushed; GitHub Release notes written from CHANGELOG
