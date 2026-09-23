# Goals, habits, and review

Goals, recurring habits (catalog + customs), and the daily review flow.

- Catalog: `app/lib/wird.ts` (`Section[]`, `Habit`).
- Customs/goals storage: `wird-customs-v1`, `wird-goals-v1` (+ challenges,
  pledges, qada, kids datasets).
- Day aggregation: `app/lib/history.ts` (DayRecord merges habit toggles
  monotonically).
- Review UI: `app/components/views/review-tab.tsx` (Deen journey tab, /deen),
  routes /deen, /calendar; /review redirects permanently to /deen.

**Key behaviors:**

- Habit toggles merge into DayRecord via `recordDay` — a stale day's ids
  are never lost to an empty today (zero-loss contract).
- Goals, challenges, and pledges are user-controlled lists with schemas +
  `is…Like` validators; adding a field requires a schema migration
  (`docs/VERSIONING.md`).
- Custom habits reuse the `Habit` shape but live in `wird-customs-v1`
  (data), separate from the code-defined catalog (content).

**Privacy:** all fields are `private`/`sensitive`; exports of this data
are covered by the backup + export log flow (PRIVACY_ARCHITECTURE.md).
