# Analytics methodology (ADD-ON)

Local, deterministic, explainable behavioral intelligence over existing Wird
data (`app/lib/analytics.ts`). No network, no AI service, no fake data:
every function returns `null` when evidence is insufficient, and the UI
renders "not enough data yet".

## Data sources (all on-device)

| Source        | Key                               | What analytics reads                                       |
| ------------- | --------------------------------- | ---------------------------------------------------------- |
| Daily records | `wird-history-v1` (+ per-profile) | deed ids, Quran pages, scores per day                      |
| Reviews       | `wird-reviews-v1`                 | score, mood, gratitude presence (structural only)          |
| Challenges    | `wird-challenges-v1`              | start, target, check days                                  |
| Goals         | `wird-goals-v1`                   | title, `created`, `done` (older goals lack both → unknown) |
| Pledges       | `wird-pledges-v1`                 | check days                                                 |
| Memorization  | `wird-quran-mem-v1`               | refs; `@dayId` suffix on new marks gives recency           |
| Adhkar log    | `wird-adhkar-log-v1`              | per-day group counts, capped 180 days (new dataset)        |
| Guide log     | `wird-guide-log-v1`               | fatigue/once-ever for coach + milestones                   |

Honest gaps (shown as "not enough data", never invented): time-of-day
(history carries no timestamps by design), dua frequency (usage isn't
logged per day), reflection text history (only today's is stored; the
night journal is explicitly excluded from statistics), pre-update adhkar
trends (the log starts at this version), goal start dates for legacy
goals, mem revision dates for legacy bare marks.

## Core definitions

- **Active day**: recorded deeds OR Quran pages (`isActiveDay`). Unknown
  (unrecorded) days are never counted as failures; rates divide by window
  days and the copy says so.
- **Personal baseline**: every comparison is current window vs the user's
  own previous window. No global targets, no other users.
- **Integer percentages**: `fmtPct`/`fmtDelta` round (`68%`, `+16%`).
  Averages like streak means keep one decimal (they are counts, labeled).

## Thresholds

| Constant              | Value        | Meaning                                           |
| --------------------- | ------------ | ------------------------------------------------- |
| `MIN_ACTIVE_DAYS`     | 4            | a window must hold this many active days to speak |
| `MIN_WEEKDAY_SAMPLES` | 4            | per weekday over `WEEKDAY_WEEKS` (8)              |
| `TREND_DELTA`         | 0.12         | 12-point move = a real trend (`up`/`flat`/`down`) |
| `MIN_EVENTS`          | 2            | returns needed before pattern claims              |
| Quran trend gate      | 25% relative | pages/day move vs previous half                   |

Confidence: `high` (≥10 active days per window) / `medium` / `low`.
Only medium/high insights display. Weekday insights additionally require
a ≥25-point spread; overload needs ≥16 commitments with <40% rate;
small-restart needs at least one small (≤3 deeds day one) and one large
restart with a strictly better 14-day continuation.

## Returns model

- A **meaningful return** = idle gap ≥3 days, then activity (`detectReturns`).
- Continuation = active days within 1/3/7/14/30 days after return day.
- **Rebuild speed** = first day index whose trailing-3-day deed average
  reaches 50%/100% of the pre-absence baseline (mean ids/day over up to
  14 pre-gap active days, minimum 4). `null` when never reached in 30 days.
- **Breaks shortening** compares mean gap of the second half of events vs
  the first (≥3 events).

## Language rules (enforced by `guidance-safety.test.ts` over all `an.*`)

- Observational only: "X and Y both became more consistent" — never
  "X caused Y".
- Neutral: "needs attention", "ended early", "weakest period" — never
  "bad", "lazy", "failure".
- Mood: "recorded", "occurred together" — never diagnoses, never
  "worship improved your mood".
- Quran/memorization: "not reviewed recently" — never "forgotten".
- Heatmap/stats disclaimers travel with the visuals (faith, diagnosis).

## Coach consumption (BM pipeline)

`RAW LOCAL DATA → analytics → pattern + confidence → companion input →
guidance` (tested in `analytics.test.ts` "BM pipeline"):

- `restartSizeEvidence` + pre-break top deed → return card context line.
- Evening-vs-morning friction ≥20 points → rescue-plan line.
- Challenge completion → milestone guidance (once ever per challenge).
- Milestones (`detectMilestones`) → Insights year card + guide-log
  once-ever kinds.

## Performance

All functions are O(history) single passes over ≤ ~1000 day-records,
memoized per render in components (`useMemo`), computed on explicit
range changes only. The adhkar log is capped; quarantine/health caps are
unchanged. No full-store serialization per interaction.

## Timezone

`dayId()` is local; analytics day arithmetic uses a noon-UTC anchor with
UTC getters (`shiftDay`), so DST transitions and device timezone changes
cannot split or duplicate a day. Tested across US spring-forward.

## Privacy

Analytics inputs never leave the device. The only analytics artifact that
can leave is the optional, user-initiated, counts-only summary inside the
diagnostics/emergency export. Share images carry stats the user explicitly
shared — never reflections, mood, or history.
