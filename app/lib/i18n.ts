// i18n glue: useT() hook (lang from store), prayer/day-mode label helpers.
// Raw dictionaries live in strings.ts; AR/EN parity is CI-enforced.
"use client";

import { useWird } from "../components/wird-store";
import type { Lang } from "../components/wird-store";
import { PRAYER_AR } from "./prayer";
import { tr } from "./strings";

export const PRAYER_EN: Record<string, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export function prayerName(lang: Lang, id: string): string {
  return lang === "ar" ? (PRAYER_AR[id] ?? id) : (PRAYER_EN[id] ?? id);
}

export const MODES = ["full", "normal", "busy", "travel", "sick"] as const;
export type DayMode = (typeof MODES)[number];

const AR_MODE: Record<string, DayMode> = {
  "\u0643\u0627\u0645\u0644": "full",
  "\u0639\u0627\u062f\u064a": "normal",
  "\u0645\u0634\u063a\u0648\u0644": "busy",
  "\u0633\u0641\u0631": "travel",
  "\u0645\u0631\u0636": "sick",
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

export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const { lang } = useWird();
  return (key, vars) => tr(lang, key, vars);
}
