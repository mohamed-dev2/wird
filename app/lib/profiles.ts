export type Profile = {
  id: string;
  name: string;
  avatar: string;
  pinHash: string | null;
  created: string;
};

export const AVATARS = ["🧔", "🧕", "👦", "👧", "👨", "👩", "🧓", "👴", "🌙", "⭐", "🕋", "📿"];

/** Keys that stay device-global (never namespaced per profile). */
const GLOBAL_KEYS = new Set([
  "wird-profiles-v1",
  "wird-active-profile",
  "wird-theme-v1",
  "wird-lang-v1",
  "wird-reminders-v1",
  "wird-mosque-v1",
  "wird-prayer-times-v1",
]);

let activeId: string | null = null;

try {
  activeId = localStorage.getItem("wird-active-profile");
} catch {
  activeId = null;
}

export function setActiveProfileId(id: string | null): void {
  activeId = id;
  try {
    if (id) localStorage.setItem("wird-active-profile", id);
    else localStorage.removeItem("wird-active-profile");
  } catch {}
}

export function getActiveProfileId(): string | null {
  return activeId;
}

export function nsKey(key: string): string {
  if (!key.startsWith("wird-") || GLOBAL_KEYS.has(key) || !activeId) return key;
  return `p_${activeId}_${key}`;
}

export function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem("wird-profiles-v1");
    const v = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(v) ? (v as Profile[]) : [];
  } catch {
    return [];
  }
}

export function saveProfiles(list: Profile[]): void {
  try {
    localStorage.setItem("wird-profiles-v1", JSON.stringify(list));
  } catch {}
}

/** Move existing single-user keys under the given profile (first-run adoption). */
export function adoptKeys(profileId: string): void {
  try {
    const move: [string, string][] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("wird-") && !GLOBAL_KEYS.has(k) && !k.startsWith("p_")) {
        move.push([k, `p_${profileId}_${k}`]);
      }
    }
    for (const [from, to] of move) {
      const v = localStorage.getItem(from);
      if (v != null && localStorage.getItem(to) == null) localStorage.setItem(to, v);
      localStorage.removeItem(from);
    }
  } catch {}
}

export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`wird-pin:${s}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isUnlocked(id: string): boolean {
  try {
    return sessionStorage.getItem("wird-unlocked") === id;
  } catch {
    return true;
  }
}

export function markUnlocked(id: string): void {
  try {
    sessionStorage.setItem("wird-unlocked", id);
  } catch {}
}
