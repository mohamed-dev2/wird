# Maintainer handover

This document is the condensed knowledge a future maintainer needs. It is
deliberately short because the rest of the docs repo is the deep
reference. Keep this doc evergreen.

## Who creates this record

The current maintainer. Update it whenever the release procedure, the
dependency set, or a critical constraint changes.

## One-paragraph architecture

A local-first Next.js PWA. All user data lives in the browser's
`localStorage` (namespaced per profile). A schema layer
(`app/lib/schema.ts`) validates, migrates, and quarantines every record
(zero-loss contract). All analytics are pure local transforms
(`app/lib/analytics.ts`). Religious content is bundled data, never
generated. There is no backend: network happens only for content CDNs
(tafsir, hadith) and audio, plus LAN/QR backup transfer (see
`docs/NETWORK.md`).

## Critical constraints (see CONTRIBUTING.md "Non-negotiables")

1. **No new runtime dependencies** without removing one or a written
   justification (currently 5: next, react, react-dom, qrcode, jsqr).
2. **No `console.*` in `app/`** — logs leak user content.
3. **No network calls** beyond the allowlist in `lib/privacy.ts`.
4. **Zero-loss storage**: never delete/rename keys; migrate on read;
   corrupt records go to quarantine (`wird-quarantine-v1`, 30-day TTL).
5. **Hydration rule**: no storage reads during render.
6. **AR/EN string parity** is CI-enforced; religious text only from data.
7. **Every animation** gated on `prefers-reduced-motion`; logical CSS
   properties everywhere.
8. **No AI-generated religious text** and no machine translation of it.

## Release procedure

Full detail in `docs/RELEASE.md`. Short form:

1. Bump `package.json` version **and** `WIRD_APP_VERSION` in
   `app/lib/crypto.ts` (they must stay equal).
2. Run the full gate stack (see docs/TESTING.md).
3. `npm run build` + `npx playwright test --workers=1` (serial).
4. `npm audit`, run SBOM check, update CHANGELOG + reload docs dates.
5. Tag `vX.Y.Z` on `main`, push tag, publish the GitHub Release with the
   changelog excerpt and the SBOM attached.

## Known risks

- **CSP/vendors**: tafsir (api.quran.com), hadith (cdn.jsdelivr.net),
  audio (everyayah.com). If any becomes unavailable, offline fallbacks
  exist; verify `docs/NETWORK.md` notes still match reality.
- **localStorage**: 5–10 MB quota on mobile. Exports are the only
  backup path — keep `wird-export-log-v1` and backup filenames working.
- **Playwright serial**: e2e is only stable with `--workers=1` on this
  machine; keep that documented.
- **Schema churn**: adding fields requires migrations + tests
  (`docs/VERSIONING.md`).
- **Religious-content accuracy**: reviewed, attributed, never AI —
  protect that rule in every review.

## Critical dependencies

Runtime: qrcode, jsqr (transfer), next/react/react-dom (framework).
Build: Node 22, npm, Playwright, Vitest, ESLint, Prettier, commitlint,
husky, lint-staged. Details + maintenance in `docs/DEPENDENCIES.md`.

## Maintenance responsibilities

- Keep `DOCUMENTATION.md` §2/§4 and `docs/NETWORK.md` in sync with code
  (CI enforces much of it).
- Keep the ADRs and `docs/README.md` index truthful.
- Approve/show-merge only after the gate stack; religious-content and
  privacy/security PRs need the sign-off in CODEOWNERS.
- Rotate .env/API knowledge: the project has zero secrets by design —
  any new secret is a regression you should reject at review.

## Emergency procedures

- **Broken main**: fix forward with a revert if small, else a hotfix
  branch + PR; gate stack must pass before merging.
- **CVE in a dependency**: `npm audit` surfaces it; upgrade + test per
  `docs/DEPENDENCIES.md`; document handling in CHANGELOG.
- **Reported vulnerability**: private disclosure via GitHub Security
  Advisories → fix → release; see `SECURITY.md`.
- **Storage data loss bug (fix lands)**: document required migration in
  doc + release notes; never silently re-migrate.

## Major technical debt

Tracked in `docs/TECH_DEBT.md` (prioritized). The top items today: the
2-dictionary i18n (third language needs direction work), the left-arrow
keyboard overlay navigation cut, quran reader virtual-cursor a11y, the
`restoreBackup` → `restoreBackupSafe` deprecation finishing, and the
dependency-tree tooling being lightweight (SBOM manual vs automated).

## Roadmap structure

`CHANGELOG.md` new → old. The next expected era: `v0.2.x` features
followed by the `v1.0` stabilization that finally declares storage/api
stable. Proposals live in GitHub issues; ADRs record decisions.

## Decision history

`docs/adr/` (ADR-001…006). Read them before proposing a change near
storage, privacy, analytics, Quran data, or localization — they record
why the current shape was chosen.
