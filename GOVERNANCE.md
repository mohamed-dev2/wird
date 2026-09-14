# Governance

How decisions about Wird are made, recorded, and revisited. The goal is a
transparent, low-ceremony process any contributor can follow and trace.

## Decision record (ADR)

Every significant architecture decision is captured as an Architecture
Decision Record in `docs/adr/`:

- `ADR-001.md` — local-first storage
- `ADR-002.md` — no cloud AI / no telemetry
- `ADR-003.md` — analytics architecture
- `ADR-004.md` — privacy model
- `ADR-005.md` — Quran data architecture
- `ADR-006.md` — localization strategy

### Writing a new ADR

Use the template in `docs/adr/ADR-000-template.md`:

1. **Context** — the problem and the constraints that make it hard.
2. **Decision** — the chosen option, stated as a rule ("We will…").
3. **Consequences** — what becomes easier and harder as a result.

Keep it under ~40 lines. The number is the next free slot (ADR-007).

### Rules

- A decision that changes storage, network access, privacy guarantees, or
  the dependency set **must** have an ADR merged with the code that
  implements it.
- ADRs are never deleted. If a decision is reversed, a new ADR supersedes
  the old one and states so explicitly.
- Storage keys are listed in `DOCUMENTATION.md` §4, network access in
  `docs/NETWORK.md`, and both in `app/lib/privacy.ts` — any ADR that
  changes one must update all three.

## Proposals

Small, uncontroversial changes can proceed straight to a PR. Anything
that changes privacy, security, storage format, or religious content
happens as a **proposal**: open an issue with a short "problem /
proposal / impact" write-up, get agreement in the thread, then the PR.

## Roles

Maintainership is earned through sustained, trustworthy work; it is never
tied to a single person.

| role                           | scope                                                                                                               | who grants it                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Maintainer**                 | merge decisions, consensus, full gate authority                                                                     | existing maintainers (majority)             |
| **Reviewer**                   | reviews code, drives PRs through gates                                                                              | maintainers                                 |
| **Release maintainer**         | cuts tags, runs `docs/RELEASE.md`, publishes Releases + SBOM                                                        | maintainers                                 |
| **Security maintainer**        | triages advisories, coordinates fixes; first responder on `SECURITY.md`                                             | maintainers (explicitly, at least one)      |
| **Documentation maintainer**   | keeps README/DOCUMENTATION/docs index truthful                                                                      | maintainers                                 |
| **Localization maintainer**    | string parity, language-addition review, RTL/LTR                                                                    | maintainers                                 |
| **Accessibility reviewer**     | blocks merges on a11y regressions (keyboard, motion, contrast)                                                      | maintainers                                 |
| **Religious-content reviewer** | signs off every Quran/hadith/adhkar/translation change (see HOW_TO_ADD_RELIGIOUS_CONTENT.md); approval is mandatory | maintainers (at least two independent ones) |

The `CODEOWNERS` file maps subsystems to roles; keep it current so PRs
auto-request the right reviewer.

## Maintainership transfer

- A maintainer may nominate a contributor; existing maintainers confirm by
  majority (a single-maintainer project: confirm with the nominated
  person's demonstrated PR history).
- **Succession rule**: never leave the project with exactly one
  maintainer permanently. If the sole maintainer plans to step away, the
  exit checklist is: (1) land the current release, (2) hand `MAINTAINER_HANDOVER.md`
  to a successor, (3) hand over secrets-less releases (there are no
  secrets — verify none exist), (4) transfer repo admin to a successor,
  (5) post a public notice. `docs/MAINTAINER_HANDOVER.md` is the written
  fallback if that person is unavailable at all.

## Stewardship rules

1. Never weaken privacy or security to ship a feature (ADRs 002/004 bound
   this).
2. Never delete user data implicitly (zero-loss contract,
   `docs/DOMAIN_MODELS.md` / `docs/VERSIONING.md`).
3. Religious text must be sourced and attributed
   (`docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md`) — no generated content.
4. If in doubt, document the decision in an ADR.

## Trademark and brand

"Wird", its logo, and visual identity belong to the project holder and
are NOT covered by the Apache-2.0 copyright license (which grants no
trademark rights). Forks, modified versions, community projects, and
unofficial deployments must not present themselves as official Wird,
use confusingly similar branding, or imply endorsement. Fair nominative
use (naming Wird to describe compatibility or origin) is fine.

## Copyright complaints

Reports concerning code, images, fonts, educational or religious
content, translations, or other material: file a GitHub issue (or
private advisory if sensitive) identifying the work, the rightsholder,
and the basis. Maintainers verify against `CONTENT_RIGHTS.md` and
provenance before acting — no automatic takedowns on accusation; valid
findings are fixed with attribution or removal plus a CHANGELOG entry.

## Privacy requests

Access/correction/deletion/export requests map to local actions the
requester performs themselves (`PRIVACY_POLICY.md` §5); maintainers hold
no user data and operate no queue. Complaints or consent questions go
through the private advisory channel; the response documents what was
checked, without collecting more personal data.

## Legal change gate

Any feature that adds data, sensitivity, third parties, storage,
sharing, or consent surface must pass, in order: data-inventory update
→ Privacy Policy / Terms update if the promise changes → security
review → implementation. Sensitive-data features additionally need the
privacy-impact review (`docs/ADAPTIVE.md` gate list, youth-risk and
accidental-disclosure analysis included) before code is written.
