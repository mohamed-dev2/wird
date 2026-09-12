// Advanced analytics engine (ADD-ON): deep, local, explainable behavioral
// intelligence over existing Wird data. Pure + deterministic + offline.
// No fake data: every function returns null when evidence is insufficient,
// and the UI renders "not enough data yet" instead of inventing insights.
//
// Conventions (see docs/ANALYTICS.md for formulas + thresholds):
// - A day is ACTIVE when it has recorded deeds or Quran pages.
// - Missing days are UNKNOWN (never zero-filled into rates as failures;
//   rates divide by days in window, stated in copy).
// - Comparisons are always against the user's OWN previous periods.
// - Percentages are integers (no fake precision).
// - Language is observational: correlation is never causation, and nothing
//   here claims anything about iman, sincerity, or divine judgment.

import { categorize } from "./coach";
import { diffDays } from "./wird";
import type { History } from "./history";

export type TrendDir = "up" | "flat" | "down";
export type Confidence = "high" | "medium" | "low";

export const MIN_ACTIVE_DAYS = 4; // a window needs this many active days to speak
export const MIN_WEEKDAY_SAMPLES = 4; // per weekday, over the lookback
export const WEEKDAY_WEEKS = 8;
export const TREND_DELTA = 0.12; // 12-point move = a real trend
export const MIN_EVENTS = 2; // returns/restarts needed for pattern claims

export type DayRec = { day: string; ids: string[]; pages: number; score?: number; mood?: string };

/** DST-safe day arithmetic: noon-UTC anchor, UTC getters (dayId is local). */
export function shiftDay(dayId: string, delta: number): string {
  const ms = Date.parse(`${dayId}T12:00:00Z`) + delta * 86400000;
  return Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : dayId;
}

export function isActiveDay(rec: DayRec | undefined): boolean {
  return !!rec && (rec.ids.length > 0 || rec.pages > 0);
}

function recOf(history: History, day: string): DayRec | undefined {
  const r = history[day];
  if (!r || typeof r !== "object" || !Array.isArray((r as DayRec).ids)) return undefined;
  return r as DayRec;
}

/** Ascending day list for [start, end] inclusive, zero-filled. */
export function daysInRange(history: History, start: string, end: string): DayRec[] {
  const out: DayRec[] = [];
  const n = diffDays(start, end);
  if (!Number.isFinite(n) || n < 0 || n > 3700) return out;
  for (let i = 0; i <= n; i++) {
    const day = shiftDay(start, i);
    out.push(recOf(history, day) ?? { day, ids: [], pages: 0 });
  }
  return out;
}

export function fmtPct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

export function fmtDelta(x: number): string {
  const n = Math.round(x * 100);
  return `${n > 0 ? "+" : ""}${n}%`;
}

// ---------- periods + comparison ----------

export type PeriodRate = { activeDays: number; totalDays: number; rate: number; pages: number };

export function periodRate(history: History, endDay: string, days: number): PeriodRate {
  const win = daysInRange(history, shiftDay(endDay, -(days - 1)), endDay);
  const active = win.filter(isActiveDay);
  return {
    activeDays: active.length,
    totalDays: win.length,
    rate: win.length === 0 ? 0 : active.length / win.length,
    pages: win.reduce((s, d) => s + d.pages, 0),
  };
}

export type Comparison = {
  dir: TrendDir;
  delta: number;
  cur: PeriodRate;
  prev: PeriodRate;
  confidence: Confidence;
};

export function compareWindows(history: History, endDay: string, days: number): Comparison | null {
  const cur = periodRate(history, endDay, days);
  const prev = periodRate(history, shiftDay(endDay, -days), days);
  if (cur.activeDays < MIN_ACTIVE_DAYS || prev.activeDays < MIN_ACTIVE_DAYS) return null;
  const delta = cur.rate - prev.rate;
  return {
    dir: delta >= TREND_DELTA ? "up" : delta <= -TREND_DELTA ? "down" : "flat",
    delta,
    cur,
    prev,
    confidence: cur.activeDays >= 10 && prev.activeDays >= 10 ? "high" : "medium",
  };
}

// ---------- streaks + consistency ----------

export type StreakStats = {
  current: number;
  best: number;
  avgRun: number;
  avgBreak: number;
  longestBreak: number;
  runs: number;
};

export function streakStats(history: History, endDay: string): StreakStats {
  const days = Object.keys(history)
    .filter((d) => d <= endDay)
    .sort();
  if (days.length === 0)
    return { current: 0, best: 0, avgRun: 0, avgBreak: 0, longestBreak: 0, runs: 0 };
  const first = days[0] ?? endDay;
  const span = daysInRange(history, first, endDay);
  const runs: number[] = [];
  const breaks: number[] = [];
  let run = 0;
  let brk = 0;
  let started = false;
  for (const d of span) {
    if (isActiveDay(d)) {
      if (started && brk > 0) {
        breaks.push(brk);
        brk = 0;
      }
      started = true;
      run++;
    } else if (started) {
      if (run > 0) {
        runs.push(run);
        run = 0;
      }
      brk++;
    }
  }
  if (run > 0) runs.push(run);
  // trailing break is "ongoing absence", not a completed break: exclude it.
  const current = (() => {
    let n = 0;
    for (let i = 0; i < 400; i++) {
      const r = recOf(history, shiftDay(endDay, -i));
      if (isActiveDay(r)) n++;
      else break;
    }
    return n;
  })();
  const avg = (a: number[]) => (a.length === 0 ? 0 : a.reduce((s, x) => s + x, 0) / a.length);
  return {
    current,
    best: runs.length === 0 ? 0 : Math.max(...runs),
    avgRun: Math.round(avg(runs) * 10) / 10,
    avgBreak: Math.round(avg(breaks) * 10) / 10,
    longestBreak: breaks.length === 0 ? 0 : Math.max(...breaks),
    runs: runs.length,
  };
}

export function rollingRate(history: History, endDay: string, days: number): number {
  return periodRate(history, endDay, days).rate;
}

/** Stability of the last 8 weekly rates (population stdev). Lower = steadier. */
export function volatility(
  history: History,
  endDay: string,
): { stdev: number; weeks: number[] } | null {
  const weeks: number[] = [];
  for (let w = 0; w < 8; w++) {
    const r = periodRate(history, shiftDay(endDay, -w * 7), 7);
    if (r.activeDays === 0 && w > 0) break;
    weeks.push(r.rate);
  }
  if (weeks.length < 3) return null;
  const mean = weeks.reduce((s, x) => s + x, 0) / weeks.length;
  const variance = weeks.reduce((s, x) => s + (x - mean) * (x - mean), 0) / weeks.length;
  return {
    stdev: Math.round(Math.sqrt(variance) * 100) / 100,
    weeks: weeks.map((w) => Math.round(w * 100) / 100),
  };
}

// ---------- habit-by-habit ----------

export type HabitStats = {
  id: string;
  rate: number;
  activeDays: number;
  missedDays: number;
  longestRun: number;
  currentRun: number;
  trend: { dir: TrendDir; cur: number; prev: number } | null;
  bestWindow: { start: string; end: string; rate: number } | null;
  worstWindow: { start: string; end: string; rate: number } | null;
  frequency: number;
};

export function habitStats(
  history: History,
  deedId: string,
  endDay: string,
  windowDays = 30,
): HabitStats | null {
  const win = daysInRange(history, shiftDay(endDay, -(windowDays - 1)), endDay);
  const hits = win.filter((d) => d.ids.includes(deedId));
  if (hits.length < MIN_ACTIVE_DAYS) return null;
  const rate = hits.length / win.length;
  let longest = 0;
  let run = 0;
  for (const d of win) {
    run = d.ids.includes(deedId) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let current = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = recOf(history, shiftDay(endDay, -i));
    if (d && d.ids.includes(deedId)) current++;
    else break;
  }
  const half = Math.floor(windowDays / 2);
  const cur =
    win.slice(half).filter((d) => d.ids.includes(deedId)).length / Math.max(1, win.length - half);
  const prev = win.slice(0, half).filter((d) => d.ids.includes(deedId)).length / Math.max(1, half);
  const delta = cur - prev;
  // best/worst 14-day window inside the last 90 days
  let best: HabitStats["bestWindow"] = null;
  let worst: HabitStats["worstWindow"] = null;
  for (let back = 0; back <= 76; back += 7) {
    const e = shiftDay(endDay, -back);
    const w = daysInRange(history, shiftDay(e, -13), e);
    const r = w.filter((d) => d.ids.includes(deedId)).length / 14;
    if (!best || r > best.rate) best = { start: shiftDay(e, -13), end: e, rate: r };
    if (!worst || r < worst.rate) worst = { start: shiftDay(e, -13), end: e, rate: r };
  }
  return {
    id: deedId,
    rate,
    activeDays: hits.length,
    missedDays: win.length - hits.length,
    longestRun: longest,
    currentRun: current,
    trend: {
      dir: delta >= TREND_DELTA ? "up" : delta <= -TREND_DELTA ? "down" : "flat",
      cur,
      prev,
    },
    bestWindow: best,
    worstWindow: worst,
    frequency: hits.length / windowDays,
  };
}

export type HabitComparison = {
  mostConsistent: { id: string; rate: number } | null;
  fastestImproving: { id: string; delta: number } | null;
  needsAttention: { id: string; rate: number } | null;
};

export function compareHabits(
  history: History,
  deedIds: string[],
  endDay: string,
): HabitComparison {
  const stats = deedIds
    .map((id) => habitStats(history, id, endDay))
    .filter((s): s is HabitStats => s !== null);
  if (stats.length === 0)
    return { mostConsistent: null, fastestImproving: null, needsAttention: null };
  const byRate = [...stats].sort((a, b) => b.rate - a.rate);
  const improving = stats
    .filter((s) => s.trend && s.trend.dir === "up")
    .sort(
      (a, b) =>
        (b.trend?.cur ?? 0) - (b.trend?.prev ?? 0) - ((a.trend?.cur ?? 0) - (a.trend?.prev ?? 0)),
    );
  const low = [...stats].sort((a, b) => a.rate - b.rate)[0];
  return {
    mostConsistent: byRate[0] ? { id: byRate[0].id, rate: byRate[0].rate } : null,
    fastestImproving: improving[0]?.trend
      ? { id: improving[0].id, delta: improving[0].trend.cur - improving[0].trend.prev }
      : null,
    needsAttention: low && low.rate < 0.5 ? { id: low.id, rate: low.rate } : null,
  };
}

// ---------- weekdays + best days ----------

export type WeekdayStat = { weekday: number; rate: number; samples: number };

export function weekdayStats(
  history: History,
  endDay: string,
  weeks = WEEKDAY_WEEKS,
): WeekdayStat[] | null {
  const buckets: { hit: number; n: number }[] = Array.from({ length: 7 }, () => ({ hit: 0, n: 0 }));
  for (let back = 0; back < weeks * 7; back++) {
    const day = shiftDay(endDay, -back);
    const rec = recOf(history, day);
    if (!rec) continue; // unknown ≠ failure
    const wd = new Date(`${day}T12:00:00Z`).getUTCDay();
    const b = buckets[wd];
    if (!b) continue;
    b.n++;
    if (isActiveDay(rec)) b.hit++;
  }
  if (buckets.some((b) => b.n < MIN_WEEKDAY_SAMPLES)) return null;
  return buckets.map((b, weekday) => ({ weekday, rate: b.hit / b.n, samples: b.n }));
}

export function bestWeekdays(stats: WeekdayStat[] | null, count = 3): number[] {
  if (!stats) return [];
  return [...stats]
    .sort((a, b) => b.rate - a.rate)
    .slice(0, count)
    .map((s) => s.weekday);
}

// ---------- time of day: NOT tracked ----------

export type TimeOfDay = null;
/** History records carry no timestamps by design (privacy + size). The engine
 *  must say so instead of inventing time patterns. */
export function timeOfDayStats(): { available: false; reason: "no-timestamps" } {
  return { available: false, reason: "no-timestamps" };
}

// ---------- returns, absence, rebuild ----------

export type ReturnEvent = {
  gapDays: number;
  returnDay: string;
  firstDayIds: number;
  cont1: number;
  cont3: number;
  cont7: number;
  cont14: number;
  cont30: number;
};

/** Meaningful returns: idle gap ≥ minGap days, then activity. Oldest first. */
export function detectReturns(history: History, endDay: string, minGap = 3): ReturnEvent[] {
  const days = Object.keys(history)
    .filter((d) => d <= endDay)
    .sort();
  if (days.length === 0) return [];
  const first = days[0] ?? endDay;
  const span = daysInRange(history, first, endDay);
  const events: ReturnEvent[] = [];
  let idle = 0;
  for (let i = 0; i < span.length; i++) {
    const d = span[i];
    if (!d) continue;
    if (isActiveDay(d)) {
      if (idle >= minGap) {
        const returnDay = d.day;
        const cont = (n: number) => {
          let c = 0;
          for (let k = 1; k <= n; k++) {
            if (isActiveDay(recOf(history, shiftDay(returnDay, k)))) c++;
          }
          return c;
        };
        const firstRec = recOf(history, returnDay);
        events.push({
          gapDays: idle,
          returnDay,
          firstDayIds: firstRec?.ids.length ?? 0,
          cont1: cont(1),
          cont3: cont(3),
          cont7: cont(7),
          cont14: cont(14),
          cont30: cont(30),
        });
      }
      idle = 0;
    } else {
      idle++;
    }
  }
  return events;
}

export type ReturnStats = {
  count: number;
  avgGap: number;
  longestGap: number;
  shortestGap: number;
  avgCont7: number;
  breaksShortening: boolean | null;
  lastEvent: ReturnEvent | null;
};

export function returnStats(events: ReturnEvent[]): ReturnStats | null {
  if (events.length < 1) return null;
  const gaps = events.map((e) => e.gapDays);
  const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  let shortening: boolean | null = null;
  if (events.length >= 3) {
    const half = Math.floor(events.length / 2);
    shortening = avg(gaps.slice(half)) < avg(gaps.slice(0, half));
  }
  return {
    count: events.length,
    avgGap: Math.round(avg(gaps) * 10) / 10,
    longestGap: Math.max(...gaps),
    shortestGap: Math.min(...gaps),
    avgCont7: Math.round(avg(events.map((e) => e.cont7)) * 10) / 10,
    breaksShortening: shortening,
    lastEvent: events[events.length - 1] ?? null,
  };
}

/** Days from return until trailing-3-day rate reaches frac of pre-gap baseline. */
export function rebuildSpeed(
  history: History,
  event: ReturnEvent,
  baseline: number,
): { day50: number | null; day100: number | null } {
  if (baseline <= 0) return { day50: null, day100: null };
  const rateAt = (k: number) => {
    const win = [0, 1, 2].map((j) => recOf(history, shiftDay(event.returnDay, k - j)));
    const vals = win.map((r) => (r ? r.ids.length : 0));
    const avg = vals.reduce((s, x) => s + x, 0) / vals.length;
    return avg / baseline;
  };
  let day50: number | null = null;
  let day100: number | null = null;
  for (let k = 0; k <= 30; k++) {
    const r = rateAt(k);
    if (day50 === null && r >= 0.5) day50 = k;
    if (day100 === null && r >= 1) day100 = k;
    if (day50 !== null && day100 !== null) break;
  }
  return { day50, day100 };
}

/** Pre-absence baseline: avg ids/day over the 14 active-ish days before gap. */
export function preAbsenceBaseline(history: History, returnDay: string): number {
  const vals: number[] = [];
  for (let back = 1; back <= 60 && vals.length < 14; back++) {
    const r = recOf(history, shiftDay(returnDay, -back));
    if (r && (r.ids.length > 0 || r.pages > 0)) vals.push(r.ids.length);
  }
  if (vals.length < MIN_ACTIVE_DAYS) return 0;
  return vals.reduce((s, x) => s + x, 0) / vals.length;
}

/** Small (≤3 deeds day one) vs large restarts: observed continuation only. */
export function restartSizeEvidence(events: ReturnEvent[]): {
  small: { n: number; avgCont14: number } | null;
  large: { n: number; avgCont14: number } | null;
} {
  const small = events.filter((e) => e.firstDayIds <= 3);
  const large = events.filter((e) => e.firstDayIds > 3);
  const avg = (a: ReturnEvent[]) =>
    a.length === 0 ? 0 : Math.round((a.reduce((s, e) => s + e.cont14, 0) / a.length) * 10) / 10;
  return {
    small: small.length > 0 ? { n: small.length, avgCont14: avg(small) } : null,
    large: large.length > 0 ? { n: large.length, avgCont14: avg(large) } : null,
  };
}

// ---------- what changed / friction / overload ----------

export type CategoryDelta = { category: string; cur: number; prev: number; delta: number };

export function categoryDeltas(
  history: History,
  deedIds: string[],
  categoryOf: (id: string) => string,
  endDay: string,
  days: number,
): CategoryDelta[] {
  const cur = daysInRange(history, shiftDay(endDay, -(days - 1)), endDay);
  const prev = daysInRange(history, shiftDay(endDay, -(2 * days - 1)), shiftDay(endDay, -days));
  const cats = [...new Set(deedIds.map(categoryOf))];
  return cats.map((category) => {
    const ids = deedIds.filter((id) => categoryOf(id) === category);
    const rate = (win: typeof cur) => {
      const hit = win.filter((d) => d.ids.some((id) => ids.includes(id))).length;
      return win.length === 0 ? 0 : hit / win.length;
    };
    const c = rate(cur);
    const p = rate(prev);
    return { category, cur: c, prev: p, delta: c - p };
  });
}

export type FrictionGroup = { label: string; rate: number; activeDays: number };

export function frictionByGroups(
  history: History,
  groups: { label: string; ids: string[] }[],
  endDay: string,
  days = 30,
): FrictionGroup[] {
  const win = daysInRange(history, shiftDay(endDay, -(days - 1)), endDay);
  return groups.map(({ label, ids }) => {
    const hit = win.filter((d) => d.ids.some((id) => ids.includes(id))).length;
    return { label, rate: win.length === 0 ? 0 : hit / win.length, activeDays: hit };
  });
}

// ---------- challenges / pledges / goals ----------

export type Challenge = {
  id: string;
  title: string;
  target: number;
  start: string;
  checks: string[];
};

export type ChallengeStats = {
  started: number;
  completed: number;
  abandoned: number;
  avgCompletion: number;
  strongest: { title: string; rate: number } | null;
};

export function challengeStats(challenges: Challenge[], today: string): ChallengeStats {
  let completed = 0;
  let abandoned = 0;
  let sum = 0;
  let strongest: ChallengeStats["strongest"] = null;
  for (const c of challenges) {
    if (!c || c.target <= 0) continue;
    const rate = Math.min(1, c.checks.length / c.target);
    sum += rate;
    if (c.checks.length >= c.target) {
      completed++;
      if (!strongest || rate > strongest.rate) strongest = { title: c.title, rate };
    } else {
      const ms = Date.parse(`${c.start}T12:00:00Z`) + c.target * 86400000;
      if (Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) < today) abandoned++;
    }
  }
  const n = challenges.filter((c) => c && c.target > 0).length;
  return {
    started: n,
    completed,
    abandoned,
    avgCompletion: n === 0 ? 0 : sum / n,
    strongest,
  };
}

export type Pledge = { id: string; text: string; checks: string[] };

export function pledgeStats(
  pledges: Pledge[],
  endDay: string,
): {
  created: number;
  activeRecent: number;
  withChecks: number;
} {
  const recentActive = pledges.filter((p) =>
    (p.checks ?? []).some((d) => diffDays(d, endDay) >= 0 && diffDays(d, endDay) <= 30),
  ).length;
  return {
    created: pledges.length,
    activeRecent: recentActive,
    withChecks: pledges.filter((p) => (p.checks ?? []).length > 0).length,
  };
}

export type Goal = { title: string; detail: string; created?: string; done?: boolean };

export function goalStats(goals: Goal[]): {
  total: number;
  completed: number;
  inProgress: number;
  unknown: number;
} {
  let completed = 0;
  let unknown = 0;
  for (const g of goals) {
    if (!g || typeof g.title !== "string") {
      unknown++;
      continue;
    }
    if (g.done === true) completed++;
    else if (g.done === false || typeof g.created === "string") continue;
    else unknown++;
  }
  return {
    total: goals.length,
    completed,
    inProgress: goals.length - completed - unknown,
    unknown,
  };
}

// ---------- quran / memorization / adhkar ----------

export type QuranStats = {
  readingDays30: number;
  pages30: number;
  trend: { dir: TrendDir; cur: number; prev: number } | null;
  sessions100: boolean;
  strongestFortnight: { start: string; end: string; pages: number } | null;
};

export function quranStats(history: History, endDay: string): QuranStats {
  const win = daysInRange(history, shiftDay(endDay, -29), endDay);
  const reading = win.filter((d) => d.pages > 0);
  const half = 15;
  const cur = win.slice(half).reduce((s, d) => s + d.pages, 0) / 15;
  const prev = win.slice(0, half).reduce((s, d) => s + d.pages, 0) / 15;
  const delta = prev > 0 ? (cur - prev) / prev : cur > 0 ? 1 : 0;
  let sessions = 0;
  for (const day of Object.keys(history)) {
    const r = recOf(history, day);
    if (r && r.pages > 0) sessions++;
  }
  let best: QuranStats["strongestFortnight"] = null;
  for (let back = 0; back <= 76; back += 7) {
    const e = shiftDay(endDay, -back);
    const w = daysInRange(history, shiftDay(e, -13), e);
    const pages = w.reduce((s, d) => s + d.pages, 0);
    if (!best || pages > best.pages) best = { start: shiftDay(e, -13), end: e, pages };
  }
  if (best && best.pages === 0) best = null;
  return {
    readingDays30: reading.length,
    pages30: win.reduce((s, d) => s + d.pages, 0),
    trend:
      reading.length >= MIN_ACTIVE_DAYS
        ? { dir: delta >= 0.25 ? "up" : delta <= -0.25 ? "down" : "flat", cur, prev }
        : null,
    sessions100: sessions >= 100,
    strongestFortnight: best,
  };
}

export type MemMark = { ref: string; day: string | null };

export function parseMemMarks(marks: string[]): MemMark[] {
  return marks
    .filter((m): m is string => typeof m === "string")
    .map((m) => {
      const at = m.lastIndexOf("@");
      if (at < 0) return { ref: m, day: null };
      return { ref: m.slice(0, at), day: m.slice(at + 1) || null };
    });
}

export function memRecency(
  marks: string[],
  endDay: string,
): { total: number; recent: number; stale: number; unknown: number } {
  const parsed = parseMemMarks(marks);
  let recent = 0;
  let stale = 0;
  let unknown = 0;
  for (const m of parsed) {
    if (!m.day || !/^\d{4}-\d{2}-\d{2}$/.test(m.day)) {
      unknown++;
      continue;
    }
    const age = diffDays(m.day, endDay);
    if (!Number.isFinite(age) || age < 0) unknown++;
    else if (age <= 30) recent++;
    else stale++;
  }
  return { total: parsed.length, recent, stale, unknown };
}

export type AdhkarLog = Record<string, Record<string, number>>;

export type AdhkarStats = {
  daysUsed30: number;
  totalTaps30: number;
  topGroup: { group: string; taps: number } | null;
  trend: TrendDir | null;
};

export function adhkarStats(log: AdhkarLog, endDay: string): AdhkarStats | null {
  const days = Object.keys(log)
    .filter((d) => d <= endDay)
    .sort();
  if (days.length < MIN_ACTIVE_DAYS) return null;
  const last30 = days.filter((d) => diffDays(d, endDay) <= 29);
  const groupOf = (key: string) => {
    const i = key.lastIndexOf("-");
    return i > 0 ? key.slice(0, i) : key;
  };
  const tapsByGroup = new Map<string, number>();
  let taps = 0;
  for (const d of last30) {
    const counts = log[d];
    if (!counts || typeof counts !== "object") continue;
    for (const [k, v] of Object.entries(counts)) {
      const n = typeof v === "number" ? v : 0;
      taps += n;
      tapsByGroup.set(groupOf(k), (tapsByGroup.get(groupOf(k)) ?? 0) + n);
    }
  }
  if (last30.length === 0 || taps === 0) return null;
  let topGroup: AdhkarStats["topGroup"] = null;
  for (const [group, t] of tapsByGroup) {
    if (!topGroup || t > topGroup.taps) topGroup = { group, taps: t };
  }
  const first = last30.slice(0, 15);
  const second = last30.slice(15);
  const sum = (ds: string[]) =>
    ds.reduce((s, d) => {
      const c = log[d];
      return (
        s +
        (c && typeof c === "object"
          ? Object.values(c).reduce((a, v) => a + (typeof v === "number" ? v : 0), 0)
          : 0)
      );
    }, 0);
  const a = sum(first) / Math.max(1, first.length);
  const b = sum(second) / Math.max(1, second.length);
  const delta = a > 0 ? (b - a) / a : b > 0 ? 1 : 0;
  return {
    daysUsed30: last30.length,
    totalTaps30: taps,
    topGroup,
    trend: delta >= 0.25 ? "up" : delta <= -0.25 ? "down" : "flat",
  };
}

// ---------- reflections / gratitude / mood (structural metadata only) ----------

export type ReviewEntry = { score?: number; mood?: string; gratitude?: string };

export function reviewStats(
  reviews: Record<string, ReviewEntry>,
  history: History,
  endDay: string,
  days = 30,
): {
  reviewDays: number;
  activeDays: number;
  gratitudeDays: number;
  gratitudeTrend: TrendDir | null;
} | null {
  const win = daysInRange(history, shiftDay(endDay, -(days - 1)), endDay);
  const active = win.filter(isActiveDay).length;
  if (active < MIN_ACTIVE_DAYS) return null;
  let reviewDays = 0;
  let gratitudeDays = 0;
  const first: string[] = [];
  const second: string[] = [];
  win.forEach((d, i) => {
    const r = reviews[d.day];
    const has = !!r && typeof r === "object";
    if (has) reviewDays++;
    const g =
      has &&
      typeof (r as ReviewEntry).gratitude === "string" &&
      ((r as ReviewEntry).gratitude as string).trim().length > 0;
    if (g) {
      gratitudeDays++;
      (i < win.length / 2 ? first : second).push(d.day);
    }
  });
  const half = win.length / 2;
  const g1 = first.length / half;
  const g2 = second.length / (win.length - half);
  const delta = g1 > 0 ? (g2 - g1) / g1 : g2 > 0 ? 1 : 0;
  return {
    reviewDays,
    activeDays: active,
    gratitudeDays,
    gratitudeTrend: delta >= 0.25 ? "up" : delta <= -0.25 ? "down" : "flat",
  };
}

export type Mood = "good" | "ok" | "low";

/**
 * Structural mood metadata only: counts, variability, weekday averages,
 * and co-occurrence with activity volume. Never a diagnosis — the UI copy
 * states "recorded" and "occurred together" at all times.
 */
export function moodStats(
  reviews: Record<string, ReviewEntry>,
  history: History,
  endDay: string,
  days = 30,
): {
  entries: number;
  distribution: Record<Mood, number>;
  variability: number;
  weekdayAvg: { weekday: number; avg: number; samples: number }[] | null;
  activityCooccurrence: { highActivityMood: number; lowActivityMood: number } | null;
} | null {
  const scoreOf = (m: Mood): number => (m === "good" ? 5 : m === "ok" ? 3 : 1);
  const seq: { day: string; mood: Mood }[] = [];
  for (let back = days - 1; back >= 0; back--) {
    const day = shiftDay(endDay, -back);
    const r = reviews[day];
    const mood = r && (r.mood === "good" || r.mood === "ok" || r.mood === "low") ? r.mood : null;
    if (mood) seq.push({ day, mood });
  }
  if (seq.length < MIN_ACTIVE_DAYS) return null;
  const distribution: Record<Mood, number> = { good: 0, ok: 0, low: 0 };
  for (const s of seq) distribution[s.mood]++;
  let changes = 0;
  for (let i = 1; i < seq.length; i++) {
    if ((seq[i]?.mood ?? null) !== (seq[i - 1]?.mood ?? null)) changes++;
  }
  const buckets = new Map<number, number[]>();
  for (const s of seq) {
    const wd = new Date(`${s.day}T12:00:00Z`).getUTCDay();
    const arr = buckets.get(wd) ?? [];
    arr.push(scoreOf(s.mood));
    buckets.set(wd, arr);
  }
  const weekdayAvg =
    [...buckets.values()].every((a) => a.length >= 3) && buckets.size >= 3
      ? [...buckets.entries()].map(([weekday, arr]) => ({
          weekday,
          avg: Math.round((arr.reduce((x, y) => x + y, 0) / arr.length) * 10) / 10,
          samples: arr.length,
        }))
      : null;
  const withAct = seq
    .map((s) => ({ mood: scoreOf(s.mood), n: recOf(history, s.day)?.ids.length ?? 0 }))
    .filter((x) => x.n > 0);
  const hi = withAct.filter((x) => x.n >= 5);
  const lo = withAct.filter((x) => x.n <= 2);
  return {
    entries: seq.length,
    distribution,
    variability: Math.round((changes / Math.max(1, seq.length - 1)) * 100) / 100,
    weekdayAvg,
    activityCooccurrence:
      hi.length >= 3 && lo.length >= 3
        ? {
            highActivityMood:
              Math.round((hi.reduce((s, x) => s + x.mood, 0) / hi.length) * 10) / 10,
            lowActivityMood: Math.round((lo.reduce((s, x) => s + x.mood, 0) / lo.length) * 10) / 10,
          }
        : null,
  };
}

// ---------- heatmap ----------

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export function heatmap(
  history: History,
  endDay: string,
  weeks = 26,
): { day: string; level: HeatLevel; count: number }[] {
  const days = daysInRange(history, shiftDay(endDay, -(weeks * 7 - 1)), endDay);
  const counts = days.map((d) => d.ids.length + (d.pages > 0 ? 2 : 0));
  const sorted = [...counts].sort((a, b) => a - b);
  const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? 1;
  const cap = Math.max(1, p90);
  return days.map((d, i) => {
    const c = counts[i] ?? 0;
    const level: HeatLevel =
      c === 0 ? 0 : c >= cap ? 4 : c >= cap * 0.6 ? 3 : c >= cap * 0.3 ? 2 : 1;
    return { day: d.day, level, count: c };
  });
}

// ---------- month / year reviews ----------

export type MonthReview = {
  month: string;
  activeDays: number;
  daysInMonth: number;
  quranDelta: number | null;
  gratitudeDelta: number | null;
  longestRun: number;
  longestBreak: number;
  strongestWeekday: number | null;
  elapsed: boolean;
};

export function monthReview(
  history: History,
  reviews: Record<string, ReviewEntry>,
  yearMonth: string,
): MonthReview {
  const [y, m] = yearMonth.split("-").map(Number);
  const dim = new Date(Date.UTC(y ?? 2000, m ?? 1, 0)).getUTCDate();
  const days = daysInRange(
    history,
    `${yearMonth}-01`,
    `${yearMonth}-${String(dim).padStart(2, "0")}`,
  );
  const active = days.filter(isActiveDay);
  const prevMonth = shiftDay(`${yearMonth}-01`, -1).slice(0, 7);
  const prev = daysInRange(history, `${prevMonth}-01`, shiftDay(`${yearMonth}-01`, -1));
  const pages = (ds: typeof days) => ds.reduce((s, d) => s + d.pages, 0);
  const grat = (ds: typeof days) => {
    let n = 0;
    let t = 0;
    for (const d of ds) {
      if (!isActiveDay(d)) continue;
      t++;
      const r = reviews[d.day];
      if (r && typeof r.gratitude === "string" && r.gratitude.trim()) n++;
    }
    return t === 0 ? null : n / t;
  };
  const qPrev = pages(prev);
  const qCur = pages(days);
  const gPrev = grat(prev);
  const gCur = grat(days);
  let run = 0;
  let longestRun = 0;
  let brk = 0;
  let longestBreak = 0;
  for (const d of days) {
    if (isActiveDay(d)) {
      run++;
      longestRun = Math.max(longestRun, run);
      brk = 0;
    } else {
      brk++;
      longestBreak = Math.max(longestBreak, brk);
      run = 0;
    }
  }
  const wdHit = new Array<number>(7).fill(0);
  const wdN = new Array<number>(7).fill(0);
  for (const d of days) {
    const w = new Date(`${d.day}T12:00:00Z`).getUTCDay();
    (wdN[w] as number)++;
    if (isActiveDay(d)) (wdHit[w] as number)++;
  }
  let strongestWeekday: number | null = null;
  let best = -1;
  wdHit.forEach((h, w) => {
    const n = wdN[w] ?? 0;
    if (n >= 3 && h / n > best) {
      best = h / n;
      strongestWeekday = w;
    }
  });
  return {
    month: yearMonth,
    activeDays: active.length,
    daysInMonth: days.length,
    quranDelta: qPrev === 0 ? (qCur > 0 ? 1 : null) : (qCur - qPrev) / qPrev,
    gratitudeDelta:
      gPrev === null || gCur === null
        ? null
        : gPrev === 0
          ? gCur > 0
            ? 1
            : 0
          : (gCur - gPrev) / gPrev,
    longestRun,
    longestBreak,
    strongestWeekday,
    elapsed: days.length > 0,
  };
}

// ---------- smart insights (explainable rules) ----------

export type Insight = {
  id: string;
  confidence: Confidence;
  evidence: Record<string, string | number>;
};

export function smartInsights(args: {
  history: History;
  reviews: Record<string, ReviewEntry>;
  challenges: Challenge[];
  commitments: number;
  endDay: string;
}): Insight[] {
  const { history, endDay, commitments } = args;
  const out: Insight[] = [];
  const cmp30 = compareWindows(history, endDay, 30);
  if (cmp30 && cmp30.confidence !== "low") {
    if (cmp30.dir === "up")
      out.push({ id: "improve30", confidence: cmp30.confidence, evidence: {} });
    else if (cmp30.dir === "down")
      out.push({ id: "decline30", confidence: cmp30.confidence, evidence: {} });
  }
  const wd = weekdayStats(history, endDay);
  if (wd) {
    const rates = wd.map((w) => w.rate);
    const spread = Math.max(...rates) - Math.min(...rates);
    if (spread >= 0.25) {
      const top = [...wd].sort((a, b) => b.rate - a.rate)[0];
      if (top)
        out.push({ id: "weekday", confidence: "medium", evidence: { weekday: top.weekday } });
    }
  }
  const rate30 = periodRate(history, endDay, 30).rate;
  if (
    commitments >= 16 &&
    rate30 < 0.4 &&
    periodRate(history, endDay, 30).activeDays >= MIN_ACTIVE_DAYS
  ) {
    out.push({ id: "overload", confidence: "medium", evidence: { n: commitments } });
  }
  const events = detectReturns(history, endDay);
  if (events.length >= MIN_EVENTS) {
    const gaps = events.map((e) => e.gapDays);
    const half = Math.floor(gaps.length / 2);
    const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
    if (avg(gaps.slice(half)) < avg(gaps.slice(0, half))) {
      out.push({ id: "recovery", confidence: "medium", evidence: {} });
    }
    const ev = restartSizeEvidence(events);
    if (ev.small && ev.large && ev.small.avgCont14 > ev.large.avgCont14) {
      out.push({ id: "small-restart", confidence: "medium", evidence: {} });
    }
  }
  return out;
}

// ---------- milestones ----------

export type Milestone = { id: string; reached: boolean; day: string | null; value: number };

export function detectMilestones(args: {
  history: History;
  challenges: Challenge[];
  quranSessions: number;
  endDay: string;
  events: ReturnEvent[];
}): Milestone[] {
  const { history, challenges, quranSessions, endDay, events } = args;
  const days = Object.keys(history).filter((d) => d <= endDay);
  const active = days.filter((d) => isActiveDay(recOf(history, d)));
  const st = streakStats(history, endDay);
  const firstActive = [...active].sort()[0] ?? null;
  const active30 = active.length >= 30;
  return [
    {
      id: "first7",
      reached: active.length >= 7,
      day: [...active].sort()[6] ?? null,
      value: active.length,
    },
    { id: "first30", reached: active30, day: [...active].sort()[29] ?? null, value: active.length },
    { id: "quran100", reached: quranSessions >= 100, day: null, value: quranSessions },
    {
      id: "first-challenge",
      reached: challenges.some((c) => c.checks.length >= c.target && c.target > 0),
      day: null,
      value: challenges.filter((c) => c.checks.length >= c.target && c.target > 0).length,
    },
    { id: "longest-run", reached: st.best >= 7, day: null, value: st.best },
    {
      id: "strong-return",
      reached: events.some((e) => e.gapDays >= 7 && e.cont7 >= 5),
      day: events.find((e) => e.gapDays >= 7 && e.cont7 >= 5)?.returnDay ?? null,
      value: events.filter((e) => e.gapDays >= 7 && e.cont7 >= 5).length,
    },
    { id: "first-day", reached: firstActive !== null, day: firstActive, value: active.length },
  ];
}

// ---------- data quality ----------

export function dataQuality(
  history: History,
  endDay: string,
): { futureDays: string[]; invalidEntries: number; totalKeys: number } {
  const futureDays: string[] = [];
  let invalidEntries = 0;
  for (const [day, rec] of Object.entries(history)) {
    if (!rec || typeof rec !== "object" || !Array.isArray((rec as DayRec).ids)) {
      invalidEntries++;
      continue;
    }
    if (day > endDay) futureDays.push(day);
  }
  return { futureDays: futureDays.sort(), invalidEntries, totalKeys: Object.keys(history).length };
}

export { categorize };
