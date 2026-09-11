import type { History } from "./history";

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shiftDay(dayId: string, delta: number): string {
  const ms = Date.parse(`${dayId}T12:00:00Z`) + delta * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

export type DemoReview = { items: Record<string, "done" | "partial" | "missed">; score: number };

/** Deterministic 45-day demo dataset: weekly rhythm, upward trend, witr streak. */
export function buildDemo(
  endDay: string,
  deedIds: string[],
): { history: History; reviews: Record<string, DemoReview> } {
  const rand = mulberry32(1447);
  const history: History = {};
  const reviews: Record<string, DemoReview> = {};
  const prayers = deedIds.filter((id) =>
    /jamaa|sunnah|qiyam|witr|duha|fast|taraweeh|dua-night|wake/.test(id),
  );
  const rest = deedIds.filter((id) => !prayers.includes(id));
  for (let back = 44; back >= 0; back--) {
    const day = shiftDay(endDay, -back);
    const d = new Date(`${day}T12:00:00Z`);
    const progress = 1 - back / 50; // grows toward today
    const rate = 0.35 + progress * 0.5 + (d.getUTCDay() === 5 ? 0.1 : 0);
    if (rand() < 0.06) continue; // skipped day
    const ids = [
      ...prayers.filter(() => rand() < Math.min(0.97, rate + 0.15)),
      ...rest.filter(() => rand() < rate),
    ];
    if (back <= 9) {
      if (!ids.includes("witr")) ids.push("witr");
    }
    const pages = rand() < rate ? 1 + Math.floor(rand() * 6) : 0;
    history[day] = { day, ids, pages };
    if (rand() < 0.6 && ids.length > 0) {
      const score = Math.round(55 + (ids.length / Math.max(1, deedIds.length)) * 45);
      const items: Record<string, "done" | "partial" | "missed"> = {};
      for (const id of ids) items[id] = rand() < 0.9 ? "done" : "partial";
      reviews[day] = { items, score };
    }
  }
  // merge score/mood into history like real reviews do
  for (const [day, r] of Object.entries(reviews)) {
    const rec = history[day];
    if (rec) rec.score = r.score;
  }
  return { history, reviews };
}

export function mergeHistoryDemo(generated: History): number {
  try {
    const raw = localStorage.getItem("wird-history-v1");
    const prev = (raw ? JSON.parse(raw) : {}) as History;
    let n = 0;
    for (const [day, rec] of Object.entries(generated)) {
      if (!prev[day]) {
        prev[day] = rec;
        n++;
      }
    }
    localStorage.setItem("wird-history-v1", JSON.stringify(prev));
    return n;
  } catch {
    return 0;
  }
}

export function saveDemoReviews(reviews: Record<string, DemoReview>): void {
  try {
    const raw = localStorage.getItem("wird-reviews-v1");
    const prev = (raw ? JSON.parse(raw) : {}) as Record<string, DemoReview>;
    localStorage.setItem("wird-reviews-v1", JSON.stringify({ ...reviews, ...prev }));
  } catch {}
}

export function clearDemoData(): void {
  try {
    localStorage.removeItem("wird-history-v1");
    localStorage.removeItem("wird-reviews-v1");
  } catch {}
}
