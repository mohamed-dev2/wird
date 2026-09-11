import type { Lang } from "../components/wird-store";
import { extras, sections } from "./wird";
import { adherence, dataStreak, lastNDays, missStreak, type History } from "./history";

export type Category = "salah" | "quran" | "dhikr" | "knowledge" | "character" | "family";

export type Deed = { id: string; title: string; weight: number; category: Category };

const SALAH_RE = /(jamaa|sunnah|qiyam|witr|duha|fast|taraweeh|dua-night|wake)$/;
const QURAN_RE = /(quran|mulk|memorize|review|night-quran|quran-evening)$/;
const DHIKR_RE = /(after-|morning|evening|sleep|istighfar|tasbeeh|zikr|dua-|adhkar|daily-dua)/;
const KNOWLEDGE_RE = /(knowledge)$/;
const FAMILY_RE = /(parents)$/;

export function categorize(id: string): Category {
  if (SALAH_RE.test(id)) return "salah";
  if (QURAN_RE.test(id)) return "quran";
  if (DHIKR_RE.test(id)) return "dhikr";
  if (KNOWLEDGE_RE.test(id)) return "knowledge";
  if (FAMILY_RE.test(id)) return "family";
  return "character";
}

export function buildCatalog(customs: { id: string; title: string }[] = []): Deed[] {
  const base = [...sections.flatMap((s) => s.habits), ...extras].map((h) => ({
    id: h.id,
    title: h.title,
    weight: h.points,
    category: categorize(h.id),
  }));
  return [...base, ...customs.map((c) => ({ ...c, weight: 2, category: "character" as Category }))];
}

export type Neglect = {
  id: string;
  title: string;
  miss: number;
  rateNow: number;
  ratePrev: number;
  score: number;
};

/** Ranked forgotten deeds: current miss streak + adherence collapse vs prior window. */
export function neglectList(history: History, deeds: Deed[], endDay: string): Neglect[] {
  return deeds
    .map((d) => {
      const miss = missStreak(history, d.id, endDay);
      const rateNow = adherence(history, d.id, endDay, 7);
      const prevEnd = lastNDays(history, 22, endDay)[0]?.day ?? endDay;
      const ratePrev = adherence(history, d.id, prevEnd, 21);
      return {
        id: d.id,
        title: d.title,
        miss,
        rateNow,
        ratePrev,
        score: miss * 2 + Math.max(0, ratePrev - rateNow) * 5 + d.weight * 0.2,
      };
    })
    .filter((n) => n.miss > 0)
    .sort((a, b) => b.score - a.score);
}

export type Lift = { id: string; title: string; lift: number; samples: number };

/** How much the rest of the day improves on days this deed is done (last 30 days). */
export function liftScores(history: History, deeds: Deed[], endDay: string): Lift[] {
  const days = lastNDays(history, 30, endDay).filter((d) => d.ids.length > 0);
  return deeds.map((d) => {
    const on = days.filter((x) => x.ids.includes(d.id));
    const off = days.filter((x) => !x.ids.includes(d.id));
    if (on.length < 3 || off.length < 3) return { id: d.id, title: d.title, lift: 0, samples: 0 };
    const avg = (arr: typeof days) =>
      arr.reduce((s, x) => s + x.ids.filter((id) => id !== d.id).length, 0) / arr.length;
    return { id: d.id, title: d.title, lift: avg(on) - avg(off), samples: on.length + off.length };
  });
}

export type Risk = { id: string; title: string; reason: string; prob: number };

const WEEKDAYS: Record<Lang, string[]> = {
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

/** Same-weekday miss pattern over the last 5 occurrences of this weekday. */
export function atRisk(history: History, deeds: Deed[], endDay: string, lang: Lang = "ar"): Risk[] {
  const weekday = new Date(`${endDay}T12:00:00Z`).getUTCDay();
  const out: Risk[] = [];
  for (const d of deeds) {
    let misses = 0;
    let samples = 0;
    for (let w = 0; w < 5; w++) {
      const ms = Date.parse(`${endDay}T12:00:00Z`) - w * 7 * 86400000;
      const day = new Date(ms).toISOString().slice(0, 10);
      const rec = history[day];
      if (!rec || rec.ids.length === 0) continue;
      samples++;
      if (!rec.ids.includes(d.id)) misses++;
    }
    if (samples >= 3 && misses >= 3) {
      out.push({
        id: d.id,
        title: d.title,
        reason:
          lang === "ar"
            ? `يغيب ${d.title} أيام ${WEEKDAYS.ar[weekday] ?? ""} (${misses}/${samples})`
            : `Misses ${d.title} on ${WEEKDAYS.en[weekday] ?? ""} (${misses}/${samples})`,
        prob: Math.round((misses / samples) * 100),
      });
    }
  }
  return out.sort((a, b) => b.prob - a.prob);
}

export function categoryBalance(
  history: History,
  deeds: Deed[],
  endDay: string,
  days = 7,
): { category: Category; pct: number; done: number; total: number }[] {
  const cats: Category[] = ["salah", "quran", "dhikr", "knowledge", "character", "family"];
  const win = lastNDays(history, days, endDay).filter((d) => d.ids.length > 0);
  return cats.map((category) => {
    const ids = deeds.filter((d) => d.category === category).map((d) => d.id);
    let done = 0;
    for (const d of win) done += d.ids.filter((id) => ids.includes(id)).length;
    const total = ids.length * Math.max(1, win.length);
    return { category, pct: total === 0 ? 0 : Math.round((done / total) * 100), done, total };
  });
}

export function quranPace(history: History, endDay: string): { now: number; prev: number } {
  const avg = (n: number, end: string) => {
    const win = lastNDays(history, n, end).filter((d) => d.ids.length > 0 || d.pages > 0);
    if (win.length === 0) return 0;
    return win.reduce((s, d) => s + d.pages, 0) / win.length;
  };
  const prevEnd = lastNDays(history, 8, endDay)[0]?.day ?? endDay;
  return { now: avg(7, endDay), prev: avg(21, prevEnd) };
}

export type Brief = {
  risks: Risk[];
  neglect: Neglect[];
  pace: { now: number; prev: number; dropPct: number } | null;
  topLift: Lift | null;
  praise: string | null;
};

export function buildBrief(
  history: History,
  deeds: Deed[],
  endDay: string,
  lang: Lang = "ar",
): Brief {
  const risks = atRisk(history, deeds, endDay, lang).slice(0, 1);
  const neglect = neglectList(history, deeds, endDay).slice(0, 1);
  const pace = quranPace(history, endDay);
  const paceFinding =
    pace.prev > 0.5 && pace.now < pace.prev * 0.7
      ? { ...pace, dropPct: Math.round((1 - pace.now / pace.prev) * 100) }
      : null;
  const lifts = liftScores(history, deeds, endDay)
    .filter((l) => l.samples > 0 && l.lift > 0.5)
    .sort((a, b) => b.lift - a.lift);
  const witrStreak = dataStreak(history, (d) => d.ids.includes("witr"), endDay);
  const praise =
    witrStreak >= 7
      ? lang === "ar"
        ? `${witrStreak} ليالٍ متتالية من الوتر — ما شاء الله`
        : `${witrStreak} straight Witr nights — mashaAllah`
      : null;
  return { risks, neglect, pace: paceFinding, topLift: lifts[0] ?? null, praise };
}
