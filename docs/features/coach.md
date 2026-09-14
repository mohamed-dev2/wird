# Coach (brief)

Produces a concise daily guidance brief from the analytics snapshot,
respecting absence windows and tone rules.

- Full documentation: `docs/COMPANION.md`.
- Core module: `app/lib/coach.ts` (pure function, no storage writes).
- UI integration: `app/components/companion.tsx`.
- Guide-log persistence: `wird-guide-log-v1` (what guidance was shown;
  analytics opt-out AND the personalization master switch suppress log
  writes — see PRIVACY_ARCHITECTURE.md and `docs/ADAPTIVE.md`).
- Adaptive layer (STEP 6): reminder tones (gentle/balanced/strict,
  `rm.lad.*` copy), fatigue notices, challenge difficulty suggestions,
  habit co-occurrence insights — all observational, user-approved, and
  gated by `wird-personalize-v1` (see `docs/ADAPTIVE.md`).

**Copy rule:** new guidance strings must be prefixed `cm:` (or `tw:`, `ret:`,
`an:`, `goals`) and pass the `guidance-safety` scan (CONTRIBUTING.md).
