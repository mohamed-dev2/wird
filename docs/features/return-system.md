# Return system (adaptive guide)

A 26-state engine that chooses which card (beginning, return, deep
restart, tawbah, fatigued, consistent, etc.) to show based on the
user's actual history, not targets or statistics.

- Full design documentation: `docs/COMPANION.md` (the "Return system"
  section describes states and transitions).
- Core module: `app/lib/companion.ts` (pure, no storage writes).
- State shape: `CompanionState` discriminated union; 26 variants.

**Testing convention:** companion.test.ts must contain at least one test
for every `CompanionState` variant — presence test AND one quality
assertion (e.g. `tawbah` appears only when the absence window is deep,
`beginning` appears only on a fresh profile).

**Privacy:** the engine is a pure function of persisted history and
guide-log; it has no network access, no side effects, and cannot emit a
state that leaks information (states are honest, never shaming).
