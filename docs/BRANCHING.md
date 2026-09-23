# Branching system (Git Flow)

Wird is public. Two long-lived branches exist on `origin`:

| Branch    | Purpose                                                                | Created    |
| --------- | ---------------------------------------------------------------------- | ---------- |
| `main`    | Production only; every commit is a deployable release, tagged `vX.Y.Z` | original   |
| `develop` | Integration branch for all ongoing work; mirrors `main` at launch      | 2026-09-23 |

Everything else is short-lived and deleted after merge.

## The flow

```
             feature/*  ──►  ──►  ──►         bugfix/*  ──►  ──►
                                │                              │
              ┌─────────────────┴───────────────┐              │
              ▼                                 │              ▼
   main ◄──── release/* ───────────────────◄──── develop ◄─────┴─◄──── feature/bugfix merges
     ▲                                             │
     └────────────────── hotfix/* ◄────────────────┘ (urgent fix straight to prod)
```

1. `feature/<name>` off `develop` → PR → squash-merge into `develop`.
2. `bugfix/<name>` for regressions, same path into `develop`.
3. A release is cut as `release/vX.Y.Z` off `develop` → merges to `main`
   and back to `develop`; tag `vX.Y.Z` on `main`.
4. Production incident: `hotfix/<name>` off `main` → merges to `main`
   (immediately deployable) and back to `develop`.

## Prefixes (git-flow compatible, `.gitflow` ships in-repo)

| Prefix     | Off       | Merges into        | Example              |
| ---------- | --------- | ------------------ | -------------------- |
| `feature/` | `develop` | `develop`          | `feature/deen-quest` |
| `bugfix/`  | `develop` | `develop`          | `bugfix/sw-cache`    |
| `release/` | `develop` | `main` + `develop` | `release/v0.2.0`     |
| `hotfix/`  | `main`    | `main` + `develop` | `hotfix/quran-audio` |
| `support/` | `develop` | `develop`          | (rare, compat)       |

A bare `chore/test`-style scratch is tolerated for experiments but must
never merge to `main` and should be deleted after use.

## Rules

- CI gate: `.github/workflows/ci.yml` runs on `main`, `develop`, and every
  PR. A PR must go green before merge (typecheck, lint 0-warnings,
  format, unit, e2e, build, docs, comments, css, boundaries, metrics,
  audit).
- Signed commits (`git commit -s`), `type(scope): summary` messages
  (e.g. `feat(seo): per-route metadata`).
- PR via `.github/pull_request_template.md`; every PR maps to one
  CHANGELOG line before merging into `develop` or `main`.
- Squash-merge feature/bugfix branches; merge (or rebase-merge) `release/`
  and `hotfix/` so the tag history stays linear-ish and honest.
- `main` only ever receives `release/*` and `hotfix/*`.

## Securing the branches

### Enforced in this repo (every dev machine)

`.husky/pre-push` (husky, installed via `npm ci`) refuses **direct or
forced pushes to `main` and `develop`** — `push-sec` prints the reason
and the push fails locally BEFORE anything reaches GitHub. Feature/bug
branches push freely.

- Force push is blocked everywhere (no `-f`/`--force-with-lease` on any
  branch through this hook — a `+`-prefixed ref fails always).
- `ALLOW_PROTECTED_PUSH=1` overrides once (owner-only, release moves
  before rules exist server-side).
- The hook is client-side, so treat it as the belt; the GitHub rules
  below are the suspenders.

### Enforced by GitHub (owner action — needs `gh`/PAT, not present here)

The authoritative block lives on GitHub and cannot be set from this
environment. Do it once per branch: Settings → Branches → **Add rule**,
for `main` then `develop`:

| Setting                                            | `main`                                                   | `develop` |
| -------------------------------------------------- | -------------------------------------------------------- | --------- |
| Require a pull request before merging              | Yes (1 review; raise when contributors arrive)           | Yes       |
| Require status checks to pass                      | Yes                                                      | Yes       |
| Tick check(s)                                      | `verify` (the CI workflow) — plus `check-links` if added | `verify`  |
| Require branches to be up to date (linear history) | Yes                                                      | Yes       |
| Require signed commits                             | Yes                                                      | Yes       |
| Do not allow force pushes                          | Yes                                                      | Yes       |
| Do not allow deletions                             | Yes                                                      | Yes       |

Once enabled, even you cannot push `main`/`develop` directly — every
change must go through a reviewed PR with green CI. The pre-push hook
then becomes a fast local warning, not the only wall.

## What this replaced

Earlier `docs/BRANCHING.md` drafts used GitHub Flow (single `main`).
Git Flow was chosen because a public solo project benefits from a
visible integration line (`develop`) that CI and Vercel previews build
without touching the production branch.
