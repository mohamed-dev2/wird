# Feature flags

Wird currently uses **no feature flags** (no dead branches, no dormant
flags). This document is the policy for the day one is introduced, so
flags never accumulate silently.

## Policy

1. A feature flag may only be added if it changes **runtime behavior**
   worth toggling (an A/B experiment, a staged rollout, a
   behind-a-gate capability). It must not be a way to land dead code.
2. Every flag is registered in one place and describes:

   | field        | meaning                                                    |
   | ------------ | ---------------------------------------------------------- |
   | owner        | maintainer accountable for it                              |
   | purpose      | the one sentence why it exists                             |
   | default      | on/off for new users                                       |
   | affected     | which views/storage/behaviors it gates                     |
   | testing      | how both states are tested (unit + e2e)                    |
   | removal plan | the release at which default flips and the flag is deleted |

3. A flag may not ship without those six fields documented at review time.
4. **Removal discipline**: a flag whose default has been stable for one
   minor release must be deleted (branch folded in, flag removed) in the
   following minor. Abandoned flags are technical debt → add a
   `docs/TECH_DEBT.md` row.
5. If a flag touches storage or privacy, it must also pass the
   DOCUMENTATION §4 + `lib/privacy.ts` gates like any feature.

## Current state

No flags registered. This section is intentional and checked at release:
if it lists "none", the release contains no dormant feature flags.
