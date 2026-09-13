# Coach (brief)

Produces a concise daily guidance brief from the analytics snapshot,
respecting absence windows and tone rules.

- Full documentation: `docs/COMPANION.md`.
- Core module: `app/lib/coach.ts` (pure function, no storage writes).
- UI integration: `app/components/companion.tsx`.
- Guide-log persistence: `wird-guide-log-v1` (what guidance was shown;
  analytics opt-out suppresses log writes — see PRIVACY_ARCHITECTURE.md).

**Copy rule:** new guidance strings must be prefixed `cm:` (or `tw:`, `ret:`,
`an:`, `goals`) and pass the `guidance-safety` scan (CONTRIBUTING.md).
