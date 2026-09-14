# Adaptive intelligence (STEP 6)

Wird adapts to the user without becoming invasive, manipulative,
judgmental, or surveillance-based. The loop is always:

```text
OBSERVE (local records only)
  ↓
UNDERSTAND (thresholds + confidence, never diagnosis)
  ↓
SUGGEST (one calm line, user decides)
  ↓
LEARN (guide-log memory, capped; user can erase by wiping)
```

Never: observe → assume → control. Copy rules: observations, never
interpretations ("activity decreased", never "struggling spiritually");
no guilt/shame/fear/urgency (enforced by `guidance-safety` +
suggestion-copy tests); correlation is never causation.

## Central layers (6.1)

There is no separate "AI service" — the personalization engine IS the
composition of two pure local layers (offline by construction):

- `app/lib/companion.ts` (`assessUser` → 29 states → `selectGuidance`):
  state model, return journeys, fatigue suppression, confidence gating.
- `app/lib/analytics.ts` (thresholds, `smartInsights` medium/high-only
  rules, returns pipeline, milestones): measurement + explainable rules.
- Settings + memory: `app/lib/personalize.ts`
  (`wird-personalize-v1`: master/habits/mood/reminders) and the guide-log
  (`wird-guide-log-v1`, capped 30, 3-day suppression, milestones once-ever).

## Requirement map (6.2–6.51)

| #         | Requirement                           | Status  | Where                                                                                                                                 |
| --------- | ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 6.2       | User state model                      | Built   | 29 states in `companion.ts` (application states, never diagnoses)                                                                     |
| 6.3       | Observations, not interpretations     | Built   | copy rules + `guidance-safety.test.ts` + suggestion-copy tests                                                                        |
| 6.4       | Adaptive daily plan                   | Partial | companion one-action card + rescue plan exist; full generated plan = roadmap                                                          |
| 6.5       | Plan density                          | Partial | `overload` insight (16+ commitments, <40%) exists; keep/reduce/minimum/rest-day chooser = roadmap                                     |
| 6.6       | Minimum viable day                    | Partial | user-declared minimum mode (busy/travel/sick day modes → minimum note); auto-suggest on overload = roadmap                            |
| 6.7–6.9   | Return journeys                       | Built   | tiered screens (3/7/14/30/90-day), tawbah path, preserved progress, no catch-up pressure                                              |
| 6.10      | Adaptive reminder timing              | Partial | manual bedtime + tone choice; completion-time learning impossible without timestamps (deliberately not collected)                     |
| 6.11      | Reminder fatigue                      | Built   | `reminderFatigue()` (7+ days, ladder on) → notice with change-time/pause, never more nudges                                           |
| 6.12–6.13 | Adaptive goals                        | Built   | `challengeAdvice()` (consider-easier past-halfway <40%, ended) surfaced in insights; user approves everything                         |
| 6.14      | Habit relationships                   | Built   | `coOccurrence()` + strongest-pair `smartInsights` rule, observational wording only                                                    |
| 6.15      | Pattern discovery                     | Built   | weekday/returns/small-restart/cooccur rules over recorded data                                                                        |
| 6.16–6.17 | Confidence + false-insight filter     | Built   | high/medium/low gates, MIN_* sample floors, null-on-thin-evidence everywhere                                                          |
| 6.18–6.19 | Personalized coach + tone             | Built   | state-aware single-action guidance + wired reminder tones (gentle/balanced/strict, user-chosen)                                       |
| 6.20      | No manipulation                       | Built   | safety tests + fatigue/advice copy review; streaks never threaten                                                                     |
| 6.21      | Streak intelligence                   | Built   | current/longest/average/total/rebuild metrics (`streakStats`, return analytics)                                                       |
| 6.22      | Grace mechanism                       | Partial | review tri-state `partial` is the grace primitive (a hard day counts without breaking the story); auto grace days = roadmap           |
| 6.23      | Progress quality                      | Built   | 6-axis balance radar, category deltas, friction groups — never one %                                                                  |
| 6.24/6.27 | Adaptive dashboard/home               | Partial | tiered return screens + progressive insights layers adapt; full home reorder = roadmap (master-off = fixed static app)                |
| 6.25–6.26 | Discovery + contextual suggestions    | Partial | fatigue/advice/cooccur suggestions exist; staged onboarding tour = roadmap                                                            |
| 6.28–6.31 | Override + settings + privacy control | Built   | `wird-personalize-v1` (master/habits/mood/reminders) in Account; per-toggle why-lines; recovery has NO toggle (firewall, test-locked) |
| 6.32      | Sensitive-data firewall               | Built   | recovery data unreachable from engines (`privacy-firewall.test.ts` scans imports + literals)                                          |
| 6.33–6.34 | Local + offline                       | Built   | pure functions, no network in any personalization path (R3 boundaries)                                                                |
| 6.35–6.38 | Meaningful analytics + trends         | Built   | question-driven rules, personal baselines, TREND_DELTA gating, returns comparison                                                     |
| 6.39      | Insight history                       | Built   | guide-log (capped, no duplicate insight storage)                                                                                      |
| 6.40      | Feedback loop                         | Partial | fatigue suppression + once-ever milestones learn from behavior; per-insight useful/not-useful votes = roadmap                         |
| 6.41–6.43 | Improvement + cold start + honesty    | Built   | defaults (cold start = full function, no fake knowledge) + null-on-thin-data + observational copy                                     |
| 6.44      | Adaptive content                      | Partial | verse/hadith blocks follow guidance theme (verified refs only); guilt-driven targeting forbidden                                      |
| 6.45–6.46 | Adaptive/smart weekly review          | Partial | review checklist builds from real data; adaptive weekly questions = roadmap                                                           |
| 6.47      | Monthly review                        | Built   | `monthReview` (strong/weak areas, trends, completions)                                                                                |
| 6.48–6.49 | Personal experiments                  | Roadmap | needs explicit hypothesis/baseline UI; no engine changes required                                                                     |
| 6.50      | Insight quality filter                | Built   | evidence + confidence + sensitivity + actionability gates before display                                                              |

"Partial" means: the honest subset ships and works; the rest is a
documented roadmap item, not a silent gap. Nothing on this list is
claimed done unless tests + copy + docs agree.

## Privacy architecture (6.31–6.32)

- Categories: habits / mood / reminders each have a switch; recovery has
  none because the firewall makes it unnecessary (recovery modules are
  imported only by their own views, the backup collectors, and the
  schema registry — asserted by `privacy-firewall.test.ts` on every run).
- Enforcement points (`app/page.tsx`): mood fields stripped from
  companion input, guidance card hidden, ladder paused, guide memory
  paused — all at assembly, never inside the engines (engines stay pure
  and testable).
- Dashboards the user opens deliberately (insights) keep working:
  inspection is not adaptation. Only system-initiated behavior pauses.

## Sync/opt-in posture (6.20 cross-ref)

No sync exists; multi-tab never auto-merges (explicit reload banner).
Any future sync is opt-in per dataset with local-wins for sensitive data
(see `docs/offline-architecture.md`).
