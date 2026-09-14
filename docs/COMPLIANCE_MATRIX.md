# Compliance test matrix

Each requirement: what implements it, what tests it, current status.
Status is honest, never aspirational — Roadmap/Review-required items
block any "production legal-ready" claim (see gate at the bottom).
Owner: maintainer. Last reviewed: 2026-09-14.

## License, copyright, third parties

| Requirement                                    | Implementation                                              | Test                               | Status                 |
| ---------------------------------------------- | ----------------------------------------------------------- | ---------------------------------- | ---------------------- |
| Apache-2.0 project license, complete text      | `LICENSE` (word-verified vs official)                       | `legal-compliance.test.ts` markers | Implemented            |
| Copyright wird-gamma, no third-party overclaim | `NOTICE`, per-area attribution                              | review + test asserts holder       | Implemented            |
| SPDX identifiers where appropriate             | new route files carry `SPDX-License-Identifier: Apache-2.0` | compliance test                    | Implemented            |
| No ASF affiliation claims                      | none in copy; NOTICE states independence                    | compliance denylist scan           | Implemented            |
| Third-party licenses audited                   | `THIRD_PARTY_NOTICES.md` vs lockfile                        | compliance version-match test      | Implemented            |
| Contributor licensing (Apache inbound, DCO)    | `CONTRIBUTING.md` + prohibited list                         | review                             | Implemented            |
| Trademark separation                           | `GOVERNANCE.md` brand rules                                 | review                             | Implemented            |
| Religious content rights                       | `CONTENT_RIGHTS.md` + review gate                           | review (rows marked)               | Partial (rows flagged) |
| Content sources attributed in-app              | Library sources block                                       | e2e presence (offline spec)        | Implemented            |

## Terms, privacy, rights

| Requirement                             | Implementation                                                | Test                                      | Status             |
| --------------------------------------- | ------------------------------------------------------------- | ----------------------------------------- | ------------------ |
| Terms + Privacy exist, versioned, dated | `TERMS_OF_USE.md`, `PRIVACY_POLICY.md`, `/terms`, `/privacy`  | legal e2e (render/version/offline/mobile) | Implemented        |
| Docs match implementation               | written from architecture truth                               | policy↔code consistency tests             | Implemented        |
| Data inventory/classification/retention | `DATA_*.md`                                                   | inventory-vs-schema consistency           | Partial (add test) |
| Account deletion works                  | wipe + diagnostics-clear recipe                               | wipe e2e (rescue + emptiness)             | Implemented        |
| Data export works                       | JSON/QR/LAN/emergency local exports                           | transfer + restore suites                 | Implemented        |
| Consent separated (no bundling)         | no behavioral consent exists; OS permission for notifications | review                                    | Implemented        |

## Young users, recovery, safety

| Requirement                                          | Implementation                    | Test                                            | Status                    |
| ---------------------------------------------------- | --------------------------------- | ----------------------------------------------- | ------------------------- |
| Age-neutral, youth-safe, private-by-default recovery | STEP 4 architecture               | youth audit (`SAFETY.md`), leak scans, firewall | Implemented               |
| No parent surveillance/notifications                 | nothing built that could          | absence asserted (no such modules/keys)         | Implemented               |
| Child-controlled parent access                       | roadmap `SAFETY.md` Part B        | —                                               | Roadmap (required future) |
| Anonymous support opt-in                             | roadmap `SAFETY.md` Part C        | —                                               | Roadmap (required future) |
| No diagnosis / no guaranteed outcomes                | copy contract + disclaimers       | guidance-safety + copy scans                    | Implemented               |
| Deen gamification without religious claims           | ADR-007 + kind-separated catalog  | deen unit/e2e + safety scan + firewall          | Implemented               |
| No sin counters / leaderboards / faith scores        | absent by construction            | banned-concept + shape tests                    | Implemented               |
| Discreet notifications / safe URLs                   | generic text, no sensitive params | e2e leak scans                                  | Implemented               |

## Security, incidents, operations

| Requirement                   | Implementation                    | Test                                         | Status      |
| ----------------------------- | --------------------------------- | -------------------------------------------- | ----------- |
| Least privilege / no admins   | no backend, no admin surface      | absence (no admin modules)                   | Implemented |
| Audit trail without content   | export log (kind/time/count)      | unit                                         | Implemented |
| No backdoors/master passwords | none exist                        | no-hardcoded-secret + no-http-endpoint scans | Implemented |
| Incident process              | `SECURITY.md` response section    | review                                       | Implemented |
| Vulnerability reporting       | private advisories channel        | review                                       | Implemented |
| Health/readiness meaningful   | probe + verdict + incident states | unit                                         | Implemented |
| Safe mode / rollback          | flag + skips + error-screen entry | e2e                                          | Implemented |

## Data protection review (incl. Saudi PDPL checklist — professional review required, not claimed)

Collection minimized · purpose-limited to visible features · no
unnecessary data · transparent (policy + inventory + in-app sources) ·
consent where applicable (OS notification permission; in-app toggles
immediate) · rights exercisable locally (access/correct/delete/export
all work without contacting anyone) · secured (PIN/vault/CSP/headers,
throttling) · retention shortest-practical (`DATA_RETENTION.md`) ·
deletion real (device wipe recipe) · transfers: none by default, content
identifiers only on explicit fetch · sensitive data (recovery, health,
religious practice, reflections, auth material) under stronger controls
(classifier + firewall + exclusion + scrubbed diagnostics).

International transfers: no standing transfers exist; CDN fetches and
static hosting route over ordinary internet paths — region guarantees
are NOT made. Young-user, guardian-permission, consumer-protection, and
copyright/licensing/terms-enforceability reviews are open professional-
review items, not closed claims.

## Pre-production legal gate (all must hold before "legal-ready")

Code matches policy · infrastructure matches policy · third parties
match policy · retention matches policy · deletion works · export works
· permissions work · parent access private-by-default (nothing to
activate today) · anonymous mode not advertised (nothing to verify) ·
religious rights documented (rows flagged) · license/copyright correct ·
terms/privacy/security docs reachable · professional review completed
**← currently open: professional review + flagged rights rows.**
