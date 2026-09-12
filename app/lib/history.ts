// History core: DayRecord map + monotonic recordDay merge (never loses
// yesterday's ids/pages to an empty today) + window/streak/adherence
// helpers. All date math is UTC-anchored (DST-safe); see analytics.ts.
export type DayRecord = {
  day: string;
  ids: string[];
  pages: number;
  score?: number;
  mood?: string;
};

export type History = Record<string, DayRecord>;

export function emptyDay(day: string): DayRecord {
  return { day, ids: [], pages: 0 };
}

export function recordDay(prev: History, rec: DayRecord): History {
  const old = prev[rec.day];
  return {
    ...prev,
    [rec.day]: {
      day: rec.day,
      ids: rec.ids.length > 0 ? rec.ids : (old?.ids ?? []),
      pages: Math.max(rec.pages, old?.pages ?? 0),
      score: rec.score ?? old?.score,
      mood: rec.mood ?? old?.mood,
    },
  };
}

function shiftDay(dayId: string, delta: number): string {
  const ms = Date.parse(dayId) + delta * 86400000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Last n days ending endDay, ascending, zero-filled for missing days. */
export function lastNDays(history: History, n: number, endDay: string): DayRecord[] {
  const out: DayRecord[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = shiftDay(endDay, -i);
    out.push(history[day] ?? emptyDay(day));
  }
  return out;
}

/** Fraction of days in window where deed was done. */
export function adherence(history: History, deedId: string, endDay: string, days: number): number {
  if (days <= 0) return 0;
  const win = lastNDays(history, days, endDay);
  return win.filter((d) => d.ids.includes(deedId)).length / days;
}

/** Current consecutive-day miss streak ending endDay (0 = done that day). */
export function missStreak(history: History, deedId: string, endDay: string): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const rec = history[shiftDay(endDay, -i)];
    if (!rec || rec.ids.length === 0) break; // no data = unknown, stop
    if (rec.ids.includes(deedId)) break;
    streak++;
  }
  return streak;
}

/** Consecutive days (ending endDay) where predicate held and day has data. */
export function dataStreak(
  history: History,
  pred: (d: DayRecord) => boolean,
  endDay: string,
): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const rec = history[shiftDay(endDay, -i)];
    if (!rec || rec.ids.length === 0) break;
    if (!pred(rec)) break;
    streak++;
  }
  return streak;
}
