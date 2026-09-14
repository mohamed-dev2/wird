// Safe mode (STEP 7.13): developer/testable degraded boot. When on, the
// app skips non-essential systems (companion card, analytics deep layers,
// QR scan + LAN transfer) while core tracking, library, backups, and
// settings keep working. Enabled via Self link (?safe=1, persisted) or the
// error screen / banner; stored device-global (recovery tool, not profile
// data). Never automatic, never hidden: the banner always says so.
import { useEffect } from "react";
import { loadFromStorage, saveToStorage } from "./wird";
import { useStoredState } from "./use-stored-state";

export const SAFE_MODE_KEY = "wird-safe-mode-v1";

/** ?safe=1 → true, ?safe=0 → false, absent → null (pure, unit-tested). */
export function parseSafeParam(search: string): boolean | null {
  try {
    const q = new URLSearchParams(search).get("safe");
    if (q === "1") return true;
    if (q === "0") return false;
    return null;
  } catch {
    return null;
  }
}

export function setSafeMode(on: boolean): void {
  try {
    saveToStorage(SAFE_MODE_KEY, on === true);
  } catch {
    // storage unavailable — safe mode simply cannot persist; ignore.
  }
}

/** Synchronous read for non-component contexts (window-guarded). */
export function isSafeMode(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return loadFromStorage<boolean>(SAFE_MODE_KEY, false) === true;
  } catch {
    return false;
  }
}

/**
 * Hydration-safe flag: static fallback first (matches SSR), stored value
 * after mount. Also honors a one-shot ?safe= param (persisted, URL
 * cleaned) so maintainers get a linkable recovery path.
 */
export function useSafeMode(): [boolean, (v: boolean) => void] {
  const [safe, setSafe] = useStoredState<boolean>(SAFE_MODE_KEY, false);
  useEffect(() => {
    try {
      const q = parseSafeParam(window.location.search);
      if (q !== null) {
        setSafe(q);
        window.history.replaceState(null, "", window.location.pathname);
      }
    } catch {
      // ignore — flag alone still works
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [safe, setSafe];
}
