// Manual prayer times ("HH:MM" per prayer id): next-prayer countdown,
// Arabic durations, and the dayArc() prev→next fraction that drives the
// prayer-arc visual. Invalid entries are ignored, never crash.
export type PrayerTimes = Record<string, string>; // prayerId -> "HH:MM"

export const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
export const PRAYER_AR: Record<string, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

function toMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Next prayer given manual times; null when unset. */
export function nextPrayer(
  times: PrayerTimes,
  now: Date,
): { id: string; at: string; inMs: number } | null {
  const cur = now.getHours() * 60 + now.getMinutes();
  let best: { id: string; at: string; inMs: number } | null = null;
  for (const id of PRAYER_ORDER) {
    const raw = times[id];
    if (!raw) continue;
    const mins = toMinutes(raw);
    if (mins == null) continue;
    let diff = mins - cur;
    if (diff <= 0) diff += 24 * 60;
    const inMs = diff * 60000 - now.getSeconds() * 1000;
    if (!best || inMs < best.inMs) best = { id, at: raw, inMs };
  }
  return best;
}

/** "باقي ساعة و ٤٧ دقيقة" style Arabic duration. */
export function arDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return m <= 1 ? "باقي دقيقة" : `باقي ${m} دقيقة`;
  if (h === 1) return m === 0 ? "باقي ساعة" : `باقي ساعة و ${m} دقيقة`;
  if (h === 2) return m === 0 ? "باقي ساعتين" : `باقي ساعتين و ${m} دقيقة`;
  return m === 0 ? `باقي ${h} ساعات` : `باقي ${h} ساعات و ${m} دقيقة`;
}

export type DayArc = { prevId: string; nextId: string; frac: number };

/**
 * Position between the previous and next configured prayer (0 = just after
 * the previous one, 1 = next prayer time). Overnight intervals (isha→fajr)
 * wrap correctly. Null when fewer than 2 valid times exist. Pure + tested.
 */
export function dayArc(times: PrayerTimes, now: Date): DayArc | null {
  const cur = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const parsed: { id: string; mins: number }[] = [];
  for (const id of PRAYER_ORDER) {
    const raw = times[id];
    const mins = raw ? toMinutes(raw) : null;
    if (mins != null) parsed.push({ id, mins });
  }
  if (parsed.length < 2) return null;
  const first = parsed[0] as { id: string; mins: number };
  const last = parsed[parsed.length - 1] as { id: string; mins: number };
  let prevId = last.id;
  let prevMins = last.mins - 24 * 60; // yesterday's last prayer
  let nextId = first.id;
  let nextMins = first.mins + 24 * 60;
  for (const p of parsed) {
    if (p.mins <= cur && p.mins > prevMins) {
      prevId = p.id;
      prevMins = p.mins;
    }
    if (p.mins > cur && p.mins < nextMins) {
      nextId = p.id;
      nextMins = p.mins;
    }
  }
  const span = nextMins - prevMins;
  if (span <= 0) return null;
  return { prevId, nextId, frac: Math.min(1, Math.max(0, (cur - prevMins) / span)) };
}
