// Profiles: ids, namespacing (p_<id>_), adoption, PIN hashing.
// Registry reads/writes go through the schema layer; deleting a profile
// also purges its quarantine raws. See docs/PRIVACY.md for boundaries.
import { readRecord, writeRecord } from "./schema";

export type Profile = {
  id: string;
  name: string;
  avatar: string;
  pinHash: string | null;
  /** Optional duress PIN hash: unlocks a shared blank decoy instead. */
  duressPinHash?: string | null;
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
  "wird-quarantine-v1",
  "wird-health-v1",
  "wird-privacy-names-v1",
  "wird-analytics-optout-v1",
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
    const { value } = readRecord<Profile[]>(localStorage, "wird-profiles-v1", "wird-profiles-v1");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveProfiles(list: Profile[]): void {
  try {
    writeRecord(localStorage, "wird-profiles-v1", "wird-profiles-v1", list);
  } catch {}
}

/** Collision-resistant profile id (timestamp ids could collide across devices on import). */
export function newProfileId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `u-${crypto.randomUUID()}`;
  } catch {}
  try {
    const b = crypto.getRandomValues(new Uint8Array(8));
    const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `u-${Date.now()}-${hex}`;
  } catch {}
  return `u-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
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

// Trivially guessable PINs are rejected at set-time (shoulder surfing +
// smudge attacks guess these first). Not a strength meter — just a floor.
const WEAK_PINS = new Set([
  "0000",
  "1111",
  "2222",
  "3333",
  "4444",
  "5555",
  "6666",
  "7777",
  "8888",
  "9999",
  "1234",
  "4321",
  "1212",
  "1122",
  "000000",
  "111111",
  "123456",
  "654321",
  "12345678",
  "87654321",
]);

export function isWeakPin(pin: string): boolean {
  const digits = pin.replace(/\D/g, "");
  if (digits.length !== pin.length || digits.length < 4) return true;
  if (WEAK_PINS.has(digits)) return true;
  // monotone runs (e.g. 5678, 9876) of any length
  let up = true;
  let down = true;
  for (let i = 1; i < digits.length; i++) {
    const d = (digits.charCodeAt(i) ?? 0) - (digits.charCodeAt(i - 1) ?? 0);
    if (d !== 1) up = false;
    if (d !== -1) down = false;
  }
  return up || down;
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
