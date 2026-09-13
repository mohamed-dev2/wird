# scripts/

Node.js dev/CI tooling, written in plain Node (no framework deps). Every
script is idempotent and documented in its header.

| script                 | purpose                                                                                                              | run via                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `check-css.mjs`        | logical CSS properties + `!important` audit                                                                          | `npm run css:check`        |
| `check-comments.mjs`   | purpose header + doc-comment scan on source files                                                                    | `npm run comments:check`   |
| `check-docs.mjs`       | storage-key/route/localization parity + markdown-link + docs-inventory + doc-quality + version-stamp checks          | `npm run docs:check`       |
| `check-boundaries.mjs` | architectural boundary enforcement (lib↔components, schema foundation, online-only reach, privacy↔CSP hostname sync) | `npm run boundaries:check` |
| `check-metrics.mjs`    | maintainability report: oversized modules, fan-in, runtime circular imports                                          | `npm run metrics`          |
| `generate-sbom.mjs`    | CycloneDX-lite SBOM from installed node_modules → `sbom.wird.json`                                                   | `npm run sbom`             |

Convention: gates (`check-docs`, `check-comments`, `check-css`,
`check-boundaries`) print a pass/fail summary and return a non-zero exit
code on failure so CI stops. `check-metrics` and `generate-sbom` are
reports — they always exit 0. Keep every script dependency-free
(Node ≥ 22). `boundaries:check` runs as part of `npm run diagnose`.
