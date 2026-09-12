import { describe, expect, it } from "vitest";
import {
  adhkarStats,
  bestWeekdays,
  challengeStats,
  compareHabits,
  compareWindows,
  dataQuality,
  detectMilestones,
  detectReturns,
  fmtDelta,
  fmtPct,
  frictionByGroups,
  goalStats,
  habitStats,
  heatmap,
  memRecency,
  monthReview,
  moodStats,
  periodRate,
  pledgeStats,
  preAbsenceBaseline,
  quranStats,
  rebuildSpeed,
  restartSizeEvidence,
  returnStats,
  reviewStats,
  rollingRate,
  shiftDay,
  smartInsights,
  streakStats,
  timeOfDayStats,
  volatility,
  weekdayStats,
  categoryDeltas,
  type Challenge,
  type Goal,
  type Pledge,
  type ReviewEntry,
} from "../analytics";
import { categorize } from "../coach";
import { coreDeeds, selectGuidance, assessUser } from "../companion";
import type { History } from "../history";

const TODAY = "2026-09-12";

const off = (n: number): string => shiftDay(TODAY, -n);
const weekday = (day: string): number => new Date(`${day}T12:00:00Z`).getUTCDay();

// 4-month synthetic journey (offsets from TODAY):
// 103..84 building (60%, max idle 2) · 83..34 strong 50d · 33..18 gap 16d ·
// 17..11 small return 7d · 10..3 gap 8d · 2..0 strong tail (Mon/Wed missed)
const DEEDS = ["fajr-jamaa", "morning", "witr", "quran-evening", "evening"];

function buildHistory(): History {
  const h: History = {};
  for (let o = 0; o <= 103; o++) {
    const day = off(o);
    let ids: string[] = [];
    let pages = 0;
    if (o >= 84) {
      // sparse building: record ACTIVE days only (rest is unknown, not failure)
      if (o % 5 < 3) {
        ids = ["fajr-jamaa", "morning"];
        pages = 1;
        h[day] = { day, ids, pages };
      }
      continue;
    } else if (o >= 34) {
      ids = [...DEEDS];
      pages = 2 + (o % 3);
    } else if (o >= 18) {
      continue; // gap: unrecorded
    } else if (o >= 11) {
      ids = ["morning", "witr"];
      pages = 2;
    } else if (o >= 3) {
      continue; // gap 8d: unrecorded
    } else {
      const wd = weekday(day);
      if (wd === 1 || wd === 3) {
        h[day] = { day, ids: [], pages: 0 };
        continue;
      }
      ids = [...DEEDS];
      pages = 3 + (o % 3);
    }
    h[day] = { day, ids, pages };
  }
  return h;
}

function activeOffsets(h: History): number[] {
  const out: number[] = [];
  for (let o = 0; o <= 103; o++) {
    const r = h[off(o)];
    if (r && (r.ids.length > 0 || r.pages > 0)) out.push(o);
  }
  return out;
}

function buildReviews(h: History): Record<string, ReviewEntry> {
  const moods = ["good", "ok", "low"] as const;
  const out: Record<string, ReviewEntry> = {};
  let i = 0;
  for (let o = 0; o < 60; o++) {
    const r = h[off(o)];
    if (!r || (r.ids.length === 0 && r.pages === 0)) continue;
    out[off(o)] = {
      score: 70 + ((o * 7) % 21),
      mood: moods[i % 3] as string,
      gratitude: i % 3 === 0 ? "family" : "",
    };
    i++;
  }
  return out;
}

const CHALLENGES: Challenge[] = [
  {
    id: "c1",
    title: "Fajr 30",
    target: 30,
    start: off(83),
    checks: Array.from({ length: 30 }, (_, i) => off(83 - i)),
  },
  { id: "c2", title: "Quran 30", target: 30, start: off(22), checks: [off(2), off(1), off(0)] },
  { id: "c3", title: "Old", target: 20, start: off(103), checks: [off(100), off(99)] },
];

const GOALS: Goal[] = [
  { title: "g1", detail: "d", created: off(99), done: true },
  { title: "g2", detail: "d", created: off(42) },
  { title: "legacy", detail: "d" },
];

const PLEDGES: Pledge[] = [
  { id: "p1", text: "x", checks: [off(1), off(2), off(5)] },
  { id: "p2", text: "y", checks: [] },
];

function buildAdhkarLog(): Record<string, Record<string, number>> {
  const log: Record<string, Record<string, number>> = {};
  for (let o = 0; o < 30; o++) {
    const taps = 5 + Math.floor(o < 15 ? o / 3 : 5 + o / 5);
    log[off(29 - o)] = { "ad.g1t-0": taps, "ad.g2t-0": Math.floor(taps / 2) };
  }
  return log;
}

describe("analytics BM acceptance (multi-month dataset)", () => {
  const H = buildHistory();
  const R = buildReviews(H);

  it("periods, trends, consistency agree with the constructed data", () => {
    const act = activeOffsets(H);
    expect(act.length).toBeGreaterThan(40);
    const r30 = periodRate(H, TODAY, 30);
    expect(r30.activeDays).toBe(act.filter((o) => o < 30).length);
    const cmp = compareWindows(H, TODAY, 14);
    expect(cmp).not.toBeNull();
    // tail (strong, minus Mon/Wed) vs prior (gap + small return)
    expect(cmp?.dir).toBe("up");
    expect(fmtPct(0.678)).toBe("68%");
    expect(fmtDelta(0.164)).toBe("+16%");
    expect(fmtDelta(-0.081)).toBe("-8%");
    expect(rollingRate(H, TODAY, 7)).toBeGreaterThanOrEqual(0);
    expect(rollingRate(H, TODAY, 90)).toBeGreaterThan(0);
  });

  it("streak intelligence: best run is the 50-day phase", () => {
    const st = streakStats(H, TODAY);
    expect(st.best).toBe(50);
    expect(st.current).toBeGreaterThanOrEqual(0);
    expect(st.longestBreak).toBe(16);
    expect(st.avgBreak).toBeGreaterThan(0);
    expect(st.runs).toBeGreaterThanOrEqual(3);
  });

  it("detects both returns with continuations and rebuild speed", () => {
    const events = detectReturns(H, TODAY);
    expect(events.map((e) => e.gapDays)).toEqual([16, 8]);
    expect(events[0]?.firstDayIds).toBe(2);
    expect(events[0]?.cont7).toBe(6);
    const stats = returnStats(events);
    expect(stats?.count).toBe(2);
    expect(stats?.longestGap).toBe(16);
    expect(stats?.shortestGap).toBe(8);
    const base = preAbsenceBaseline(H, events[0]?.returnDay ?? TODAY);
    expect(base).toBeGreaterThan(0);
    // small restart stays small, then the tail resumes: 50% reached day 16
    expect(rebuildSpeed(H, events[0] ?? events[0]!, base).day50).toBe(16);
    // ...while a growing restart resolves exact days
    const h2: History = {};
    for (let o = 34; o <= 47; o++)
      h2[off(o)] = { day: off(o), ids: ["a", "b", "c", "d"], pages: 1 };
    h2[off(9)] = { day: off(9), ids: ["a", "b"], pages: 1 };
    h2[off(8)] = { day: off(8), ids: ["a", "b", "c", "d"], pages: 1 };
    h2[off(7)] = { day: off(7), ids: ["a", "b", "c", "d"], pages: 1 };
    h2[off(6)] = { day: off(6), ids: ["a", "b", "c", "d"], pages: 1 };
    const ev2 = {
      gapDays: 24,
      returnDay: off(9),
      firstDayIds: 2,
      cont1: 1,
      cont3: 3,
      cont7: 4,
      cont14: 4,
      cont30: 4,
    };
    expect(rebuildSpeed(h2, ev2, 4)).toEqual({ day50: 1, day100: 3 });
  });

  it("restart-size evidence is observed, never causal", () => {
    const ev = restartSizeEvidence([
      {
        gapDays: 10,
        returnDay: off(20),
        firstDayIds: 2,
        cont1: 1,
        cont3: 3,
        cont7: 6,
        cont14: 12,
        cont30: 20,
      },
      {
        gapDays: 9,
        returnDay: off(5),
        firstDayIds: 7,
        cont1: 1,
        cont3: 2,
        cont7: 2,
        cont14: 3,
        cont30: 3,
      },
    ]);
    expect(ev.small?.avgCont14).toBeGreaterThan(ev.large?.avgCont14 ?? 0);
  });

  it("habit analytics: strong phases detected, recent decline told honestly", () => {
    const q = habitStats(H, "morning", TODAY, 60);
    expect(q).not.toBeNull();
    expect(q?.rate).toBeGreaterThan(0.5);
    expect(q?.longestRun).toBe(26);
    // last 30 (gaps + rebuild) vs previous 30 (strong phase): a real decline
    expect(q?.trend?.dir).toBe("down");
    expect(q?.bestWindow).not.toBeNull();
    const comp = compareHabits(H, DEEDS, TODAY);
    expect(comp.mostConsistent).not.toBeNull();
    expect(comp.needsAttention === null || typeof comp.needsAttention.rate === "number").toBe(true);
  });

  it("weekday engine gates on samples and finds engineered spread", () => {
    const h: History = {};
    for (let back = 0; back < 56; back++) {
      const day = off(back);
      const wd = weekday(day);
      h[day] = { day, ids: wd === 5 || (wd !== 1 && back % 2 === 0) ? ["a"] : [], pages: 0 };
    }
    const stats = weekdayStats(h, TODAY);
    expect(stats).not.toBeNull();
    expect(bestWeekdays(stats)[0]).toBe(5);
    expect(weekdayStats({}, TODAY)).toBeNull();
  });

  it("time-of-day honestly reports no timestamps", () => {
    expect(timeOfDayStats()).toEqual({ available: false, reason: "no-timestamps" });
  });

  it("quran, mem, adhkar layers read real structures", () => {
    const q = quranStats(H, TODAY);
    expect(q.readingDays30).toBeGreaterThanOrEqual(8);
    expect(q.sessions100).toBe(false);
    expect(q.strongestFortnight).not.toBeNull();
    const mem = memRecency(["2:255@2026-09-01", "112:1@2026-07-01", "2:256"], TODAY);
    expect(mem).toEqual({ total: 3, recent: 1, stale: 1, unknown: 1 });
    const ad = adhkarStats(buildAdhkarLog(), TODAY);
    expect(ad).not.toBeNull();
    expect(ad?.topGroup?.group).toBe("ad.g1t");
    expect(ad?.trend).toBe("up");
    expect(adhkarStats({}, TODAY)).toBeNull();
  });

  it("goals, challenges, pledges reflect tracked metadata only", () => {
    expect(goalStats(GOALS)).toEqual({ total: 3, completed: 1, inProgress: 1, unknown: 1 });
    const ch = challengeStats(CHALLENGES, TODAY);
    expect(ch).toEqual({
      started: 3,
      completed: 1,
      abandoned: 1,
      avgCompletion: expect.any(Number),
      strongest: expect.objectContaining({ title: "Fajr 30" }),
    });
    expect(ch.avgCompletion).toBeGreaterThan(0.3);
    expect(pledgeStats(PLEDGES, TODAY)).toEqual({ created: 2, activeRecent: 1, withChecks: 1 });
  });

  it("reviews yield gratitude + mood metadata, never diagnoses", () => {
    const rs = reviewStats(R, H, TODAY);
    expect(rs).not.toBeNull();
    expect(rs?.gratitudeDays).toBeGreaterThan(0);
    const ms = moodStats(R, H, TODAY);
    expect(ms).not.toBeNull();
    expect(ms?.entries).toBeGreaterThanOrEqual(4);
    expect(Object.values(ms?.distribution ?? {}).reduce((a, b) => a + b, 0)).toBe(ms?.entries);
    expect(moodStats({}, H, TODAY)).toBeNull();
  });

  it("heatmap levels are personal-relative with an honest legend", () => {
    const heat = heatmap(H, TODAY, 4);
    expect(heat.length).toBe(28);
    expect(heat.every((d) => d.level >= 0 && d.level <= 4)).toBe(true);
    expect(heat.some((d) => d.level === 0)).toBe(true);
    expect(heat.some((d) => d.level === 4)).toBe(true);
  });

  it("month reviews compare against previous month honestly", () => {
    const aug = monthReview(H, R, "2026-08");
    const jul = monthReview(H, R, "2026-07");
    expect(aug.activeDays).toBeLessThan(jul.activeDays);
    expect(aug.quranDelta).not.toBeNull();
    expect((aug.quranDelta ?? 0) < 0).toBe(true);
    expect(aug.longestBreak).toBeGreaterThanOrEqual(8);
    expect(aug.strongestWeekday).not.toBeNull();
  });

  it("what-changed stays observational per category", () => {
    const deltas = categoryDeltas(H, DEEDS, categorize, TODAY, 14);
    expect(deltas.length).toBeGreaterThan(0);
    for (const d of deltas) {
      expect(Math.abs(d.delta)).toBeLessThanOrEqual(1);
      expect(d.cur).toBeGreaterThanOrEqual(0);
    }
  });

  it("friction splits routine groups without deleting anything", () => {
    const fr = frictionByGroups(
      H,
      [
        { label: "morning", ids: ["fajr-jamaa", "morning"] },
        { label: "evening", ids: ["evening", "quran-evening"] },
      ],
      TODAY,
    );
    expect(fr.length).toBe(2);
    expect(fr[0]?.rate).toBeGreaterThanOrEqual(0);
  });

  it("smart insights fire only with evidence + confidence", () => {
    const ins = smartInsights({
      history: H,
      reviews: R,
      challenges: CHALLENGES,
      commitments: 6,
      endDay: TODAY,
    });
    const ids = ins.map((i) => i.id);
    // last 30 (two gaps) vs previous 30 (strong phase): an honest decline
    expect(ids).toContain("decline30");
    expect(ids).toContain("small-restart");
    expect(ins.every((i) => i.confidence === "high" || i.confidence === "medium")).toBe(true);
    // ...and a genuinely improving dataset reports improvement
    const h2: History = {};
    for (let o = 0; o < 30; o++)
      h2[off(o)] = { day: off(o), ids: o % 6 === 5 ? [] : ["a"], pages: 0 };
    for (let o = 30; o < 60; o += 6) h2[off(o)] = { day: off(o), ids: ["a"], pages: 0 };
    const ins2 = smartInsights({
      history: h2,
      reviews: {},
      challenges: [],
      commitments: 3,
      endDay: TODAY,
    });
    expect(ins2.map((i) => i.id)).toContain("improve30");
  });

  it("milestones detect firsts without celebrating noise", () => {
    const sessions = Object.values(H).filter((r) => r.pages > 0).length;
    const ms = detectMilestones({
      history: H,
      challenges: CHALLENGES,
      quranSessions: sessions,
      endDay: TODAY,
      events: detectReturns(H, TODAY),
    });
    const byId = Object.fromEntries(ms.map((m) => [m.id, m]));
    expect(byId["first7"]?.reached).toBe(true);
    expect(byId["first30"]?.reached).toBe(true);
    expect(byId["quran100"]?.reached).toBe(false);
    expect(byId["first-challenge"]?.reached).toBe(true);
  });

  it("data quality flags future + invalid records, ignores gaps", () => {
    const bad = {
      ...H,
      "2026-09-20": { day: "2026-09-20", ids: ["a"], pages: 0 },
      "2026-01-01": 42,
    };
    const q = dataQuality(bad as unknown as History, TODAY);
    expect(q.futureDays).toEqual(["2026-09-20"]);
    expect(q.invalidEntries).toBe(1);
  });

  it("shiftDay is DST-safe (US spring forward 2026-03-08)", () => {
    expect(shiftDay("2026-03-07", 1)).toBe("2026-03-08");
    expect(shiftDay("2026-03-08", 1)).toBe("2026-03-09");
    expect(shiftDay("2026-11-01", -1)).toBe("2026-10-31");
  });

  it("volatility needs sustained windows", () => {
    expect(volatility({}, TODAY)).toBeNull();
    const v = volatility(H, TODAY);
    expect(v).not.toBeNull();
    expect(v?.stdev).toBeGreaterThanOrEqual(0);
  });

  it("BM pipeline: raw data → analytics → companion guidance", () => {
    // simulate standing on the first return day with a small restart
    const events = detectReturns(H, TODAY);
    const first = events[0]!;
    const returnDay = first.returnDay;
    const h = { ...H };
    // rewind: pretend today IS the return day (drop later days)
    for (const d of Object.keys(h)) {
      if (d > returnDay) delete h[d];
    }
    const best = coreDeeds(h, DEEDS, returnDay).slice(0, 1);
    expect(best.length).toBe(1);
    const g = selectGuidance(
      assessUser({
        today: returnDay,
        hour: 15,
        isFriday: false,
        ramadan: false,
        hijriMonth: null,
        history: h,
        doneToday: ["morning", "witr"],
        totalToday: 10,
        lastSeen: shiftDay(returnDay, -first.gapDays),
        createdDay: null,
        commitments: 6,
        deedIds: DEEDS,
        challengesDone: [],
        recentMoods: [],
        gratitudeRecent: false,
        hasKids: false,
      }),
      {
        today: returnDay,
        hour: 15,
        isFriday: false,
        ramadan: false,
        hijriMonth: null,
        history: h,
        doneToday: ["morning", "witr"],
        totalToday: 10,
        lastSeen: shiftDay(returnDay, -first.gapDays),
        createdDay: null,
        commitments: 6,
        deedIds: DEEDS,
        challengesDone: [],
        recentMoods: [],
        gratitudeRecent: false,
        hasKids: false,
      },
      [],
    );
    // small restart after a 16-day gap → rebuilding path with core action
    expect(["RETURNING", "REBUILDING", "STRONG_RETURN"]).toContain(g?.state);
    expect(g?.action).toBe("core");
    expect(g?.confidence).not.toBe("low");
  });
});
