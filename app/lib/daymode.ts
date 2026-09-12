// Day modes (full/normal/busy/travel/sick): labels, normalization of
// legacy Arabic labels, and fasting labels. Pure; no storage here.
import type { Lang } from "../components/wird-store";
import { tr } from "./strings";

export const MODES = ["full", "normal", "busy", "travel", "sick"] as const;
export type DayMode = (typeof MODES)[number];

const AR_MODE: Record<string, DayMode> = {
  كامل: "full",
  عادي: "normal",
  مشغول: "busy",
  سفر: "travel",
  مرض: "sick",
};

export function normalizeDayMode(v: unknown): DayMode {
  if (typeof v !== "string") return "normal";
  if ((MODES as readonly string[]).includes(v)) return v as DayMode;
  return AR_MODE[v] ?? "normal";
}

export function modeLabel(lang: Lang, mode: string): string {
  const key = (MODES as readonly string[]).includes(mode) ? mode : (AR_MODE[mode] ?? "normal");
  return tr(lang, `mode.${key}`);
}

const FAST_AR = ["فرض رمضان", "نافلة", "قضاء", "أيام بيض", "نذر/كفارة"];

export function fastLabel(lang: Lang, v: string): string {
  const i = FAST_AR.indexOf(v);
  return i < 0 ? v : tr(lang, `fs.t${i}`);
}

export const PRAYER_ID: Record<string, string> = {
  الفجر: "fajr",
  الظهر: "dhuhr",
  العصر: "asr",
  المغرب: "maghrib",
  العشاء: "isha",
};
