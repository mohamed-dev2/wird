# scripts/

Node.js dev/CI tooling, written in plain Node (no framework deps). Every
script is idempotent and documented in its header.

| script                | purpose                                                                       | run via                   |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------- |
| `check-css.mjs`       | logical CSS properties, `!important` audit, reduced-motion gate               | `npm run css:check`       |
| `check-comments.mjs`  | purpose header + doc-comment scan on source files                             | `npm run comments:check`  |
| `check-docs.mjs`      | storage-key/route/localization parity + markdown-link + docs-inventory checks | `npm run docs:check`      |
| `build-dashboard.mjs` | generates PR summary / diagnostics payloads                                   | `npm run build:dashboard` |

Convention: each script prints a clear pass/fail summary and returns a
non-zero exit code on failure so CI stops. Keep them dependency-free
(Node ≥ 22).
