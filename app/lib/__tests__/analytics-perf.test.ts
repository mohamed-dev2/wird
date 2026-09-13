// Analytics at scale (STEP 5: large local histories must stay responsive).
// Builds a deterministic 5-year history, runs the history-bound analytics
// surface with generous per-call budgets (these catch pathological
// complexity blowups, not millisecond regressions), and asserts sane output.
import { describe, expect, it } from "vitest";
import {
  bestWeekdays,
  compareHabits,
  compareWindows,
  dataQuality,
  detectReturns,
  habitStats,
  heatmap,
  monthReview,
  periodRate,
  preAbsenceBaseline,
  rebuildSpeed,
  restartSizeEvidence,
  returnStats,
  rollingRate,
  shiftDay,
  smartInsights,
  streakStats,
  volatility,
  weekdayStats,
} from "../analytics";
import type { History } from "../history";

const TODAY = "2026-09-12";
const YEARS_5 = 1826;

function buildLongHistory(): History {
  const h: History = {};
  for (let o = 0; o < YEARS_5; o++) {
    const day = shiftDay(TODAY, -o);
    // Weekday rhythm with weekend pauses + two long travel gaps (returns).
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    const inGap = (o > 400 && o < 430) || (o > 1200 && o < 1245);
    const active = !inGap && weekday !== 5 && weekday !== 6;
    h[day] = {
      day,
      ids: active ? ["fajr", "witr", "quran-evening"] : [],
      pages: active ? o % 20 : 0,
    };
  }
  return h;
}

function budgeted<T>(label: string, ms: number, fn: () => T): T {
  const t0 = Date.now();
  const out = fn();
  expect(Date.now() - t0, label).toBeLessThan(ms);
  return out;
}

describe("five-year history stays responsive", () => {
  const h = buildLongHistory();
  it("covers a full five years", () => {
    expect(Object.keys(h)).toHaveLength(YEARS_5);
  });
  it("period, trend, and streak engines stay fast", () => {
    const r = budgeted("periodRate", 1500, () => periodRate(h, TODAY, 365));
    expect(r.totalDays).toBe(365);
    expect(r.activeDays).toBeGreaterThan(200);
    budgeted("compareWindows", 1500, () => compareWindows(h, TODAY, 90));
    const st = budgeted("streakStats", 1500, () => streakStats(h, TODAY));
    expect(st).not.toBeNull();
    budgeted("rollingRate", 1500, () => rollingRate(h, TODAY, 30));
    budgeted("volatility", 1500, () => volatility(h, TODAY));
  });
  it("habit, weekday, and heatmap engines stay fast", () => {
    const hs = budgeted("habitStats", 1500, () => habitStats(h, "fajr", TODAY, 365));
    expect(hs).not.toBeNull();
    budgeted("compareHabits", 1500, () => compareHabits(h, ["fajr", "witr"], TODAY));
    const ws = budgeted("weekdayStats", 1500, () => weekdayStats(h, TODAY));
    expect(bestWeekdays(ws, 2)).toHaveLength(2);
    budgeted("heatmap", 1500, () => heatmap(h, TODAY, 365));
    budgeted("dataQuality", 1500, () => dataQuality(h, TODAY));
  });
  it("returns pipeline finds the planted gaps", () => {
    const events = budgeted("detectReturns", 1500, () => detectReturns(h, TODAY));
    expect(events.length).toBeGreaterThanOrEqual(2);
    const stats = budgeted("returnStats", 1500, () => returnStats(events));
    expect(stats).not.toBeNull();
    const firstReturn = events[0];
    expect(firstReturn).toBeDefined();
    if (firstReturn) {
      budgeted("rebuildSpeed", 1500, () =>
        rebuildSpeed(h, firstReturn, preAbsenceBaseline(h, firstReturn.returnDay)),
      );
      budgeted("restartSizeEvidence", 1500, () => restartSizeEvidence(events));
      budgeted("preAbsenceBaseline", 1500, () => preAbsenceBaseline(h, firstReturn.returnDay));
    }
  });
  it("reviews and insights stay fast with empty extras", () => {
    budgeted("monthReview", 1500, () => monthReview(h, {}, "2026-08"));
    const insights = budgeted("smartInsights", 2000, () =>
      smartInsights({ history: h, reviews: {}, challenges: [], commitments: 0, endDay: TODAY }),
    );
    expect(Array.isArray(insights)).toBe(true);
  });
});
