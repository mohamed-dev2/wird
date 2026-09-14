# Safety: young users, recovery privacy, and support roadmaps

## Part A — youth-safety audit (verified, this codebase)

Recovery in Wird is age-neutral by construction. Verified claims
(re-verify on every recovery change; several are CI-gated):

- **No adult-only gate**: creating a plan requires no age, no label, no
  category. A plan can be an ordinary goal ("gaming ≤ 90 min") with the
  same UI as any other (`app/components/views/private-plans.tsx`).
- **No explicit content**: UI copy uses neutral terms (plan, run,
  setback, trigger, replacement). Shaming vocabulary is banned by test
  (`pp.*` scan + suggestion-copy scan); no sexual, graphic, medical, or
  fear-based content exists in recovery flows.
- **Private by default**: plans, counters, setbacks, triggers, notes,
  history never appear in profiles, leaderboards, shares, notification
  content, URLs, titles, or analytics (`privacy-firewall.test.ts`, e2e
  leak scans).
- **No parent surveillance**: no parent accounts, dashboards,
  notifications, or reports exist. A young user gets exactly the same
  privacy as everyone else — this is structural (no backend), not a
  setting that can drift.
- **No identity demanded**: no name, email, phone, age, birth date,
  school, address, or location is collected anywhere (asserted: no such
  keys in `SCHEMAS`, compliance test). No "MINOR" badges exist.
- **Emergency honesty**: the app states it is not emergency help and
  points to local emergency numbers; it never pretends to intervene.
- **No diagnosis, no outcomes promised**: enforced in copy
  (`docs/features/private-recovery.md` contract + guidance-safety tests).

## Part B — roadmap (required future): child-controlled parent access

Status: designed, NOT built. When built, it must satisfy all of this —
no partial version that weakens any clause:

- Created BY the child/user: they generate the credential, choose enable,
  choose scopes, and can revoke/disable/change it at any time.
- Granular scopes only (selected progress/goals/wellbeing summary);
  never full-account; private journal, reflections, triggers, and
  recovery notes are never in scope.
- Credential: salted slow hash (per-user salt), throttled verification,
  rate limiting, expiring sessions, revocation list honored first.
- Lost credential: secure revocation + re-issue flow. Explicitly
  forbidden: master passwords, developer overrides, hidden bypasses,
  admin impersonation, invisible endpoints.
- No automatic activation, no hidden activation, no administrator
  override, no developer master password — each asserted by test at
  implementation time (extend `privacy-firewall.test.ts` then).

## Part C — roadmap (required future): anonymous safety support

Status: designed, NOT built. An opt-in "I need help" flow that is OFF by
default, explicitly initiated, privacy-explained before confirmation,
and revocable. It must never auto-contact parents, teachers, schools,
police, or emergency contacts because someone used recovery. Escalation
only after the user confirms knowing what leaves the device — and the
word "anonymous" may only be used if the implementation prevents
identity linkage (no account id, email, name, persistent id, precise
location, or recovery history attached). Until then, the support section
shows only static, local, non-contacting guidance (as today).
