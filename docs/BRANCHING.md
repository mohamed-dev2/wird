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

### Enforced by GitHub (ENABLED 2026-09-23 via `gh` API on

| Setting                                 | `main`           | `develop`     |
| --------------------------------------- | ---------------- | ------------- |
| Require a pull request before merging   | Yes (1)          | Yes           |
| Require status checks to pass           | `CI / verify`    | `CI / verify` |
| Require branches up to date (strict)    | Yes              | Yes           |
| Require linear history                  | Yes              | Yes           |
| Require cryptographic commit signatures | Off (note below) | Off           |
| Do not allow force pushes               | Yes              | Yes           |
| Do not allow deletions                  | Yes              | Yes           |
| Require conversation resolution         | Yes              | Yes           |
| Enforce for admins                      | Yes              | Yes           |

Rules live on GitHub (Settings → Branches), not in the repo, so they
survive fresh clones. Direct/forced pushes to `main` or `develop` now
fail server-side — even for the owner — and the pre-push hook becomes a
fast local warning, not the only wall.

> **Cryptographic signatures — deliberately OFF.** `git commit -s`
> (sign-off trailer) stays a repo rule, but GitHub's _signed commits_
> check requires real GPG/SSH signatures and blocks every merge until a
> signing key is configured on each machine. No key is set up in this
> project, so the check is disabled; enable it (Settings → Branches →
> Require signed commits) once contributors sign with GPG/SSH.

## What this replaced

Earlier `docs/BRANCHING.md` drafts used GitHub Flow (single `main`).
Git Flow was chosen because a public solo project benefits from a
visible integration line (`develop`) that CI and Vercel previews build
without touching the production branch.
