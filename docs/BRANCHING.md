# Branching system (GitHub Flow)

Wird is public. `main` is the only long-lived branch and doubles as the
release branch: it is what Vercel deploys, what search engines read, and
what every visitor clones. Keep it stable.

## Model (GitHub Flow)

```
main ───────────────●────●────────────  (always deployable)
   \              /      \
    feat/x ──────●        docs/indexing
```

1. Cut a short-lived branch off `main` for every change.
2. Name it by intent (below).
3. Open a pull request → CI must pass → squash-merge.
4. Never push to `main` directly.

## Branch names

| Prefix    | Purpose                          | Example              |
| --------- | -------------------------------- | -------------------- |
| `feat/`   | new user-visible feature         | `feat/deen-quest`    |
| `fix/`    | bug or regression                | `fix/eol-corruption` |
| `docs/`   | documentation only               | `docs/INDEXING`      |
| `chore/`  | repo/tooling, no behavior change | `chore/deps`         |
| `hotfix/` | urgent production fix off `main` | `hotfix/sw-cache`    |

Branches are short-lived: delete after merge. No `develop`, no
`release/*` staging branches — the deployed artifact is `main`.

## Rules (enforced and manual)

- CI gate: `.github/workflows/ci.yml` must go green on every PR before
  merge.
- Signed commits (`git commit -s`), message style from `git log`:
  `type(scope): summary` (e.g. `feat(seo): per-route metadata`).
- PR uses `.github/pull_request_template.md`; every PR maps to exactly
  one CHANGELOG line.
- Squash-merge for every PR → linear history on `main`.

## Protecting `main` (owner action — needs GitHub acceds token)

Cannot be set from this environment (no `gh` CLI / token here). In GitHub:
Settings → Branches → **Add rule** for `main`:

- Require a pull request before merging (0 required approvals is fine
  for solo; require reviews once external contributors arrive).
- Require status checks to pass before merging → tick the CI job(s).
- Require linear history.
- Require signed commits.
- Do **not** allow force pushes or deletions.

Hotfixes use the same flow: branch `hotfix/x` off `main`, PR, CI, squash
— never commit straight to `main`, even under pressure.

## Why GitHub Flow, not Git Flow

Solo-maintained, continuously deployed PWA. A `develop`/`release` ladder
adds merge ceremony without protecting anything extra: `main` is already
the only deployable line, so one protected branch + short-lived PR
branches is the smallest system that keeps the public surface green.
