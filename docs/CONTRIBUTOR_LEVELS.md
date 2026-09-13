# Contributor levels

Contribution is accessible at multiple levels. You never need to
understand every subsystem to make a useful contribution, and there is a
clear path toward deeper work.

| level                       | what you do                                        | where to start                                          | what's reviewed                                                         |
| --------------------------- | -------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| **1 — Documentation**       | guides, feature docs, typo fixes, examples         | `docs/README.md`, `docs/features/`                      | accuracy of claims about code/rules                                     |
| **2 — UI/content**          | layout polish, copy strings, curated catalogs      | `strings.ts`, `app/lib/data/`, components               | copy rules (AR/EN parity, guidance-safety), a11y, motion gate           |
| **3 — Tests**               | unit + e2e coverage, flaky-spec fixes              | `app/lib/__tests__/`, `e2e/`                            | test conventions (firing + silent cases)                                |
| **4 — Features**            | new views/features via the standard checklist      | `docs/HOW_TO_ADD_A_FEATURE.md`                          | storage/schema/privacy/net rules + full gate stack                      |
| **5 — Architecture**        | layer changes, new subsystems, shared infra        | `docs/ARCHITECTURE.md`, ADRs                            | boundary rules; **ADR required**                                        |
| **6 — Core infrastructure** | schema, storage, security, crypto, release tooling | `app/lib/schema.ts`, `scripting/`, `docs/VERSIONING.md` | highest bar: zero-loss, privacy, deprecation; **ADR + dedicated tests** |

The review standard is identical at every level — only the scope differs.
"AI-assisted" code is not an exception level (see AGENTS.md): it is
reviewed and tested exactly like human-written code.

## Practical path

1. Pick a `good first issue` (see `GOOD_FIRST_ISSUES.md`).
2. Open the relevant docs first (feature doc + `docs/HOW_TO_ADD_A_FEATURE.md`).
3. Ask in the issue thread before starting — a maintainer will confirm scope.
4. Open a PR with the template filled out (`.github/pull_request_template.md`).
