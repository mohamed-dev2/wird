// Gentle reminders: bedtime nudges + ladder evaluation against the day's
// real progress. Notification permission is requested only on explicit user
// action; denial degrades to silent (never blocks the app).
//
// STEP 6: the stored tone (gentle/balanced/strict, chosen in Account)
// selects the copy variant — the engine never manipulates, it only phrases.
// Balanced variants are the long-standing defaults, kept verbatim.
import { tr } from "./strings";

export type ReminderTone = "gentle" | "balanced" | "strict";
export type ReminderSettings = {
  enabled: boolean;
  bedtime: string; // "HH:MM"
  ladder: boolean;
  tone: ReminderTone;
};

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: false,
  bedtime: "22:00",
  ladder: true,
  tone: "balanced",
};

export function canNotify(): boolean {
  try {
    return typeof window !== "undefined" && "Notification" in window;
  } catch {
    return false;
  }
}

export async function ensurePermission(): Promise<boolean> {
  if (!canNotify()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

export function fireNotification(title: string, body: string, url = "/review"): void {
  try {
    if (!canNotify() || Notification.permission !== "granted") return;
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      void navigator.serviceWorker.ready.then((reg) =>
        reg.showNotification(title, { body, data: { url }, tag: `wird-${url}` }),
      );
    } else {
      const n = new Notification(title, { body });
      n.onclick = () => {
        try {
          window.open(url, "_blank")?.focus();
        } catch {}
        n.close();
      };
    }
  } catch {}
}

export type LadderKind = "bedtime" | "risk3" | "risk1" | "gone";
export type LadderHit = { kind: LadderKind; titleKey: string; bodyKey: string };

/**
 * Pure ladder evaluation. Caller checks quiet rules (mosque mode, 1/day cap)
 * and calls fireNotification with ladderText() for a returned hit.
 */
export function evaluateLadder(
  now: Date,
  lastSeenDay: string | null,
  todayId: string,
  s: ReminderSettings,
): LadderHit | null {
  if (!s.enabled) return null;
  const tone = s.tone === "gentle" || s.tone === "strict" ? s.tone : "balanced";
  const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (hm >= s.bedtime) {
    return {
      kind: "bedtime",
      titleKey: `rm.lad.${tone}.bedtime.t`,
      bodyKey: `rm.lad.${tone}.bedtime.b`,
    };
  }
  if (!s.ladder || !lastSeenDay) return null;
  const absent = Math.round((Date.parse(todayId) - Date.parse(lastSeenDay)) / 86400000);
  if (absent >= 7)
    return { kind: "gone", titleKey: `rm.lad.${tone}.gone.t`, bodyKey: `rm.lad.${tone}.gone.b` };
  if (absent >= 3)
    return { kind: "risk3", titleKey: `rm.lad.${tone}.risk3.t`, bodyKey: `rm.lad.${tone}.risk3.b` };
  if (absent >= 1)
    return { kind: "risk1", titleKey: `rm.lad.${tone}.risk1.t`, bodyKey: `rm.lad.${tone}.risk1.b` };
  return null;
}

/** Resolve a ladder hit to display text (fixes the old hardcoded Arabic). */
export function ladderText(lang: "ar" | "en", hit: LadderHit): { title: string; body: string } {
  return { title: tr(lang, hit.titleKey), body: tr(lang, hit.bodyKey) };
}

export type FatigueHit = { kind: "fatigue"; absent: number };

/**
 * Reminder fatigue (STEP 6): ladder on, app unopened for 7+ days. The
 * answer is never MORE reminders — the UI offers change-time or pause.
 * Pure; the caller renders rm.fatigueT/rm.fatigueB with {n: absent}.
 */
export function reminderFatigue(
  lastSeenDay: string | null,
  todayId: string,
  s: ReminderSettings,
): FatigueHit | null {
  if (!s.enabled || !s.ladder || !lastSeenDay) return null;
  const absent = Math.round((Date.parse(todayId) - Date.parse(lastSeenDay)) / 86400000);
  if (!Number.isFinite(absent) || absent < 7) return null;
  return { kind: "fatigue", absent };
}
