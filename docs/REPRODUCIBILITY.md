# Reproducible development environment

Every contributor should be able to create a clean environment without
guessing missing system dependencies.

## Quick start (no containers)

1. Install Node 22 (`nvm use` reads `.nvmrc`).
2. Run `npm ci` (exact lockfile; never `npm install` on a fresh clone).
3. Run `npm run dev` (Turbopack).

That's it. No global packages, no build tools, no native deps.

## What enforces consistency

| mechanism                | what it does                                                        |
| ------------------------ | ------------------------------------------------------------------- |
| `.nvmrc` → `22`          | pins the Node runtime version                                       |
| `package-lock.json` (v3) | deterministic dependency tree                                       |
| `.npmrc`                 | `save-exact=true` (no ranges), `fund=false`, `audit-level=moderate` |
| `.editorconfig`          | UTF-8, LF endings, 2-space indent, final newline                    |
| `.gitattributes`         | `* text=auto` + LF normalization on checkout                        |
| `.prettierrc`            | shared formatting rules                                             |
| `eslint.config.mjs`      | shared linting rules                                                |
| `commitlint.config.mjs`  | conventional commit messages                                        |
| `.husky/`                | pre-commit (lint-staged) + commit-msg (commitlint)                  |

## Dev Container (optional)

If you prefer a fully isolated environment, open the project in VS Code
with the "Dev Containers" extension. A `.devcontainer/devcontainer.json`
is provided with the correct Node version, npm, and extensions pre-
configured.

The Dev Container is optional — local development with Node 22 + `npm ci`
is the primary workflow.

## Docker (optional)

For environments where container tooling is preferred, a Dockerfile is
provided in `.devcontainer/`. Build and run:

```bash
docker build -t wird-dev .devcontainer
docker run -it -v "$(pwd)":/workspace wird-dev
```

This is not the primary workflow; it exists for CI reproducibility and
contributors whose OS requires it.

## OS-specific notes

Wird is developed on **Windows** (PowerShell) and tested on **Linux**
(CI). macOS is supported but not regularly tested in CI.

| area                   | Windows                                                      | Linux / macOS                              |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------ |
| shell for npm scripts  | PowerShell 5.1+                                              | bash / zsh                                 |
| EOL normalization      | handled by `.gitattributes`                                  | native LF                                  |
| path separators        | `\` in local tools, `/` in Node APIs                         | `/` natively                               |
| Playwright browsers    | `npx playwright install chromium` (installs to user profile) | same, installs to `~/.cache/ms-playwright` |
| line endings in editor | VS Code auto-detects via `.editorconfig`                     | native LF                                  |
| filesystem case        | case-insensitive (NTFS)                                      | case-sensitive (ext4, APFS)                |

**Important:** never rely on case-sensitive path matching. Always use the
exact casing from the codebase, even on case-insensitive systems.

## Environment variables

Only one optional variable exists: `NEXT_PUBLIC_SITE_URL` (for SEO
metadata in production builds). It is documented in `.env.example` and
**not required for local development**.

No API keys, no secrets, no tokens. The app is fully local-first.

## Formatting / linting

Run before every push:

```bash
npm run format:check   # Prettier
npm run lint            # ESLint
npm run css:check       # logical properties
npm run comments:check  # purpose headers
npm run docs:check      # key/route/parity + link/inventory + quality + version stamp
```

Or all at once:

```bash
npm run diagnose
```

## Rebuilding after dependency changes

```bash
rm -rf node_modules .next
npm ci
npm run dev
```

If type errors appear after a dependency update, check
`docs/DEPENDENCIES.md` for the upgrade policy.
