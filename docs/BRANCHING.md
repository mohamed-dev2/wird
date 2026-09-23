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

## Protecting `main` + `develop` (owner action)

Branch protection cannot be set from this environment (`gh` CLI / PAT not
present). In GitHub: Settings → Branches → **Add rule**, once per branch:

- `main`: require PR + status checks, linear history, signed commits; no
  force push, no deletions.
- `develop`: same, plus "require N reviews" once outside contributors
  arrive.

Both rules make the diagram above the only way code reaches a protected
branch — pulling without review becomes impossible.

## What this replaced

Earlier `docs/BRANCHING.md` drafts used GitHub Flow (single `main`).
Git Flow was chosen because a public solo project benefits from a
visible integration line (`develop`) that CI and Vercel previews build
without touching the production branch.
