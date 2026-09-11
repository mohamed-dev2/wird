export type Habit = {
  id: string;
  title: string;
  detail?: string;
  points: number;
  optional?: boolean;
};
export type Section = {
  id: string;
  icon: string;
  title: string;
  time: string;
  accent: string;
  habits: Habit[];
};

export const sections: Section[] = [
  {
    id: "fajr",
    icon: "☀",
    title: "الفجر",
    time: "قبل الشروق",
    accent: "sun",
    habits: [
      { id: "wake", title: "أذكار الاستيقاظ", points: 2, optional: true },
      {
        id: "fajr-sunnah",
        title: "السنة القبلية",
        detail: "ركعتان",
        points: 2,
      },
      {
        id: "fajr-jamaa",
        title: "صلاة الفجر في وقتها",
        detail: "مع الجماعة",
        points: 3,
      },
      {
        id: "after-fajr",
        title: "أذكار بعد الصلاة",
        points: 2,
        optional: true,
      },
      { id: "morning", title: "أذكار الصباح", points: 3, optional: true },
      { id: "duha", title: "صلاة الضحى", detail: "٤ ركعات", points: 2 },
    ],
  },
  {
    id: "dhuhr",
    icon: "◐",
    title: "الظهر",
    time: "منتصف النهار",
    accent: "sky",
    habits: [
      {
        id: "dhuhr-before",
        title: "السنة القبلية",
        detail: "٤ ركعات",
        points: 2,
      },
      {
        id: "dhuhr-jamaa",
        title: "صلاة الظهر في وقتها",
        detail: "مع الجماعة",
        points: 3,
      },
      {
        id: "after-dhuhr",
        title: "أذكار بعد الصلاة",
        points: 2,
        optional: true,
      },
      {
        id: "dhuhr-after",
        title: "السنة البعدية",
        detail: "ركعتان",
        points: 2,
      },
    ],
  },
  {
    id: "asr",
    icon: "◒",
    title: "العصر",
    time: "آخر النهار",
    accent: "coral",
    habits: [
      {
        id: "asr-jamaa",
        title: "صلاة العصر في وقتها",
        detail: "مع الجماعة",
        points: 3,
      },
      { id: "after-asr", title: "أذكار بعد الصلاة", points: 2, optional: true },
      { id: "evening", title: "أذكار المساء", points: 3, optional: true },
      { id: "istighfar", title: "استغفار ١٠٠ مرة", points: 2 },
    ],
  },
  {
    id: "maghrib",
    icon: "◓",
    title: "المغرب",
    time: "بعد الغروب",
    accent: "violet",
    habits: [
      {
        id: "maghrib-jamaa",
        title: "صلاة المغرب في وقتها",
        detail: "مع الجماعة",
        points: 3,
      },
      {
        id: "after-maghrib",
        title: "أذكار بعد الصلاة",
        points: 2,
        optional: true,
      },
      {
        id: "maghrib-after",
        title: "السنة البعدية",
        detail: "ركعتان",
        points: 2,
      },
      {
        id: "quran-evening",
        title: "ورد القرآن المسائي",
        detail: "ربع حزب",
        points: 3,
      },
    ],
  },
  {
    id: "isha",
    icon: "☾",
    title: "العشاء",
    time: "بعد العتمة",
    accent: "night",
    habits: [
      {
        id: "isha-jamaa",
        title: "صلاة العشاء في وقتها",
        detail: "مع الجماعة",
        points: 3,
      },
      {
        id: "after-isha",
        title: "أذكار بعد الصلاة",
        points: 2,
        optional: true,
      },
      { id: "isha-after", title: "السنة البعدية", detail: "ركعتان", points: 2 },
      { id: "sleep", title: "أذكار النوم", points: 2, optional: true },
      { id: "mulk", title: "قراءة سورة الملك", points: 3 },
    ],
  },
  {
    id: "night",
    icon: "✦",
    title: "قيام الليل والوتر",
    time: "أجمل خلوة",
    accent: "gold",
    habits: [
      { id: "qiyam", title: "قيام الليل", detail: "ركعتان أو أكثر", points: 4 },
      { id: "night-quran", title: "ورد القرآن", detail: "ربعان", points: 4 },
      { id: "witr", title: "الوتر", detail: "ركعة أو ٣", points: 3 },
      { id: "dua-night", title: "الدعاء في السحر", points: 2 },
    ],
  },
];

export const extras: Habit[] = [
  { id: "quran", title: "تلاوة القرآن", detail: "ستة أرباع", points: 4 },
  { id: "memorize", title: "حفظ القرآن", detail: "نصف صفحة", points: 3 },
  { id: "review", title: "مراجعة المحفوظ", detail: "صفحتان", points: 3 },
  { id: "parents", title: "بر الوالدين", points: 3 },
  { id: "charity", title: "صدقة ولو قليلة", points: 3 },
  { id: "knowledge", title: "طلب علم", detail: "١٥ دقيقة", points: 2 },
  { id: "kindness", title: "كلمة طيبة أو صلة رحم", points: 2 },
  { id: "fast", title: "صيام نافلة", points: 5 },
];

export const adhkar = [
  "أذكار الاستيقاظ",
  "أذكار الصباح",
  "أذكار المساء",
  "أذكار النوم",
  "دعاء الخلاء",
  "لبس الثوب",
  "دعاء الوضوء",
  "دخول المنزل",
  "دخول المسجد",
  "المشي للمسجد",
  "الطعام والشراب",
  "السفر والركوب",
  "المطر والرعد",
  "زيارة المريض",
  "أذكار السوق",
];
export const duas = [
  "لي ولوالديّ",
  "للأهل والأصدقاء",
  "للرزق والعمل",
  "للشفاء والعافية",
  "للثبات والهداية",
  "للمسلمين جميعًا",
];

export const NAV_ITEMS: [string, string, string][] = [
  ["today", "⌂", "اليوم"],
  ["calendar", "▦", "التقويم"],
  ["insights", "↗", "التقدّم"],
  ["review", "☾", "الحصاد"],
  ["library", "◈", "الأذكار"],
  ["account", "◌", "حسابي"],
];

export const NAV_HREFS: Record<string, string> = {
  today: "/",
  calendar: "/calendar",
  insights: "/insights",
  review: "/review",
  library: "/library",
  account: "/account",
};

export const DEFAULT_DONE = ["fajr-sunnah", "fajr-jamaa", "morning", "dhuhr-before", "dhuhr-jamaa"];

export const DEFAULT_INTENTION = "أطلب رضى الله في عملي وكلامي";

export const QURAN_GOAL_PAGES = 20;

export type QadaItem = { id: string; label: string; day: string; cleared: boolean };
export type Challenge = {
  id: string;
  title: string;
  target: number;
  start: string;
  checks: string[];
};
export type Breaker = { name: string; created: string; slips: string[] };

export const FAST_TYPES = ["فرض رمضان", "نافلة", "قضاء", "أيام بيض", "نذر/كفارة"];
export const PRAYER_NAMES = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];

export function hijriParts(d: Date): { year: number; month: number; day: number } | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const get = (t: string) => Number(fmt.formatToParts(d).find((p) => p.type === t)?.value);
    const v = { year: get("year"), month: get("month"), day: get("day") };
    return Number.isFinite(v.year) && Number.isFinite(v.month) ? v : null;
  } catch {
    return null;
  }
}

export function isRamadanDay(d: Date): boolean {
  return hijriParts(d)?.month === 9;
}

export function diffDays(fromId: string, toId: string): number {
  const ms = Date.parse(toId) - Date.parse(fromId);
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 86400000)) : 0;
}

import { nsKey } from "./profiles";

export function dayId(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(nsKey(key));
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(nsKey(key), JSON.stringify(value));
  } catch {
    // storage unavailable (private mode) — ignore, app still works in-memory
  }
}

/** window.prompt wrapper shared by all add/edit flows (null-safe). */
export function askPrompt(message: string): string | null {
  try {
    const v = window.prompt(message)?.trim();
    return v ? v : null;
  } catch {
    return null;
  }
}

/** Convert Arabic-Indic digits to Latin (for numeric inputs). */
export function parseArDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
}

type DailyList = { day: string; ids: string[] };

export function loadDailyList(key: string, fallback: string[], today: string): string[] {
  const raw = loadFromStorage<DailyList | string[]>(key, fallback);
  if (Array.isArray(raw)) return raw; // migrate v1 shape
  if (raw && typeof raw === "object" && raw.day === today && Array.isArray(raw.ids)) return raw.ids;
  return fallback;
}

type DailyNumber = { day: string; value: number };

export function loadDailyNumber(key: string, fallback: number, today: string): number {
  const raw = loadFromStorage<DailyNumber | number>(key, fallback);
  if (typeof raw === "number") return raw; // migrate v1 shape
  if (raw && typeof raw === "object" && raw.day === today && typeof raw.value === "number")
    return raw.value;
  return fallback;
}

type DailyText = { day: string; text: string };

export function loadDailyText(key: string, fallback: string, today: string): string {
  const raw = loadFromStorage<DailyText | null>(key, null);
  if (raw && typeof raw === "object" && raw.day === today && typeof raw.text === "string")
    return raw.text;
  return fallback;
}
