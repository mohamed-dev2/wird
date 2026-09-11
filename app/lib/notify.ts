export type ReminderSettings = {
  enabled: boolean;
  bedtime: string; // "HH:MM"
  ladder: boolean;
  tone: "gentle" | "balanced" | "strict";
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

export type LadderHit = { kind: "bedtime" | "risk" | "gone"; title: string; body: string };

/**
 * Pure ladder evaluation. Caller checks quiet rules (mosque mode, 1/day cap)
 * and calls fireNotification for a returned hit.
 */
export function evaluateLadder(
  now: Date,
  lastSeenDay: string | null,
  todayId: string,
  s: ReminderSettings,
): LadderHit | null {
  if (!s.enabled) return null;
  const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (hm >= s.bedtime) {
    return {
      kind: "bedtime",
      title: "وقت حصاد اليوم 🌙",
      body: "دقيقة واحدة تراجع فيها يومك قبل النوم.",
    };
  }
  if (!s.ladder || !lastSeenDay) return null;
  const absent = Math.round((Date.parse(todayId) - Date.parse(lastSeenDay)) / 86400000);
  if (absent >= 7)
    return {
      kind: "gone",
      title: "وردك يشتاق إليك 🤍",
      body: "العودة ركعة واحدة. ابدأ من جديد بلطف.",
    };
  if (absent >= 3)
    return { kind: "risk", title: "سلسلتك في خطر 🔥", body: "يوم واحد يحفظ النور. سجل وردك الآن." };
  if (absent >= 1)
    return { kind: "risk", title: "فاتك الأمس 🌱", body: "لا بأس — اليوم صفحة جديدة." };
  return null;
}
