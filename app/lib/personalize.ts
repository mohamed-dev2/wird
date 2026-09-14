// Personalization controls (STEP 6): what the adaptive system may learn
// from — and what stays out. One per-profile record; everything defaults
// ON (cold start = full function) and every switch degrades gracefully,
// never punitively. There is deliberately NO recovery toggle: recovery
// data never enters personalization by architecture (see the firewall
// test), so there is nothing to disable.
import { loadFromStorage, saveToStorage } from "./wird";

export const PERSONALIZE_KEY = "wird-personalize-v1";

export type PersonalizeSettings = {
  /** Master adaptive switch: suggestions, memory, ladder, fatigue. Off = static app + visible dashboards. */
  master: boolean;
  /** Habit/goal/challenge history feeds companion + suggestions. Off = no guidance card. */
  analyzeHabits: boolean;
  /** Review moods + gratitude feed companion input. Off = stripped at assembly. */
  analyzeMood: boolean;
  /** Ladder reminders + fatigue detection. Off = no nudges at all. */
  analyzeReminders: boolean;
};

export const DEFAULT_PERSONALIZE: PersonalizeSettings = {
  master: true,
  analyzeHabits: true,
  analyzeMood: true,
  analyzeReminders: true,
};

export function isPersonalizeLike(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.master === "boolean" &&
    typeof r.analyzeHabits === "boolean" &&
    typeof r.analyzeMood === "boolean" &&
    typeof r.analyzeReminders === "boolean"
  );
}

export function normalizePersonalize(v: unknown): PersonalizeSettings {
  if (!isPersonalizeLike(v)) return { ...DEFAULT_PERSONALIZE };
  const r = v as Record<string, unknown>;
  return {
    master: r.master === true,
    analyzeHabits: r.analyzeHabits === true,
    analyzeMood: r.analyzeMood === true,
    analyzeReminders: r.analyzeReminders === true,
  };
}

export function loadPersonalize(): PersonalizeSettings {
  return normalizePersonalize(loadFromStorage<unknown>(PERSONALIZE_KEY, null));
}

export function savePersonalize(s: PersonalizeSettings): void {
  saveToStorage(PERSONALIZE_KEY, normalizePersonalize(s));
}
