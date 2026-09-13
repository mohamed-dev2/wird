# Analytics

Local behavioral analytics: trends, heatmaps, milestones, explainable
insight rules. All computation is pure and deterministic.

- Formulas, thresholds, confidence levels: `docs/ANALYTICS.md`.
- Core module: `app/lib/analytics.ts`.
- History windowing: `app/lib/history.ts`.
- Coach brief: `app/lib/coach.ts`.
- Calendar integration: `app/components/views/calendar.tsx`, `app/components/analytics-layers.tsx`.
- Insight brief UI: `app/insights/page.tsx`.

**Rule for adding new insight rules:** add both the firing case AND a
below-threshold case to `app/lib/__tests__/analytics.test.ts` (CI
convention documented in CONTRIBUTING.md).

**Privacy:** analytics functions are pure transforms over local data;
they never leave the device. Personalization can be paused
(`wird-analytics-optout-v1`); see PRIVACY_ARCHITECTURE.md.
