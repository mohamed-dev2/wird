# Open-source readiness & health check

Before the repo is declared open-source ready, and again after every
major architectural change, run the clean-room test below. This is the
formal home of the checklist in the roadmap item.

## Clean-room contributor journey (3.70)

Run this on a **fresh machine** (or fresh container/user) with **no prior
Wird knowledge** and no hints beyond the repo itself. Hand it to a
developer who has never seen the project. Ask them to perform, in order:

| #   | task                        | what "done" looks like                                                               |
| --- | --------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Discover the project        | README names the product and approach in <60s                                        |
| 2   | Understand what it does     | README + DOCUMENTATION: local-first, privacy posture clear                           |
| 3   | Install dependencies        | one command (`npm ci`) succeeds; no guessing                                         |
| 4   | Start development           | `npm run dev` renders the app                                                        |
| 5   | Find a feature              | repo map (AGENTS.md) + docs/ features index point to the right file                  |
| 6   | Understand its architecture | ARCHITECTURE.md + lib/README.md explain layers in <15 min of reading                 |
| 7   | Modify a small feature      | e.g. change one habit category label; knows where its copy lives (strings.ts + data) |
| 8   | Run the correct tests       | knows `npm run test` (unit) and `npm run test:e2e` (serial)                          |
| 9   | Understand failures         | a failing test's message + docs/TESTING.md explain the gates                         |
| 10  | Create a branch             | standard git; no repo-specific blocker                                               |
| 11  | Make a commit               | conventional-commit + DCO understood from CONTRIBUTING.md; hooks give guidance       |
| 12  | Open a pull request         | `.github/pull_request_template.md` structures their first PR                         |

**At each point, record where they are confused.** The fix belongs in the
repository (docs code gate / tooling), never the contributor. Repeat the
test after any major architectural change (new subsystem, storage
redesign, dependency change).

## Self-audit (one-off, before public release)

- [ ] Repo is **private** until this audit passes (toggle only on purpose).
- [ ] No secrets, no `.env*` real files, `.env.example` only.
- [ ] Step 3 docs complete and truthful (no placeholder docs).
- [ ] `LICENSE` (MIT) + `THIRD_PARTY_NOTICES.md` list everything bundled.
- [ ] SBOM generation works (`npm run sbom`) and is attached at release.
- [ ] Full gate stack green on a fresh clone (`npm ci` → `npm run diagnose` → build → e2e).
- [ ] DCO policy documented (CONTRIBUTING.md), not ambiguous.
- [ ] Codeowners accurate; at least one non-original-developer is a
      maintainer or on the path to it (see MAINTAINER_HANDOVER.md).
- [ ] Security contact is real and private (SECURITY.md).

## Final principle (3.71)

> The goal is **the engineering knowledge of Wird** being open, not just
> the code.

Every artifact in this set exists because of a real engineering need:

```
Readable code
+ Understandable architecture
+ Reproducible development
+ Safe dependencies
+ Clear governance
+ Maintainable releases
+ Searchable documentation
+ Enforced boundaries
+ Contributor accessibility
+ Long-term sustainability
= A genuinely maintainable open-source project
```

Signs it is actually working (rather than checklist-shaped):

- a new contributor goes from fresh clone to a working PR in one session
  without asking for private knowledge;
- a rule violation (boundaries, storage, network) is caught by a gate,
  not by a maintainer's memory;
- a maintainer can disappear for months and `MAINTAINER_HANDOVER.md` +
  the ADRs let someone else continue safely;
- releases are produced by following `docs/RELEASE.md`, not intuition.
