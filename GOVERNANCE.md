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

- **Maintainers** (see `CODEOWNERS`): merge decisions, security and
  privacy review, religious-content sign-off (see
  `docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md`).
- **Contributors**: everyone else. No change is too small; `GOOD_FIRST_ISSUES.md`
  lists good entry points.

## Stewardship rules

1. Never weaken privacy or security to ship a feature (ADRs 002/004 bound
   this).
2. Never delete user data implicitly (zero-loss contract,
   `docs/DOMAIN_MODELS.md` / `docs/VERSIONING.md`).
3. Religious text must be sourced and attributed
   (`docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md`) — no generated content.
4. If in doubt, document the decision in an ADR.
