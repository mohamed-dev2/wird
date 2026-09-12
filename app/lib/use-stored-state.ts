// useStoredState: hydration-safe persisted state in one place. Static
// fallback renders SSR-identical HTML; the real value loads after mount and
// saves are mount-gated. The single sanctioned set-state-in-effect site.
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { loadFromStorage, saveToStorage } from "./wird";

/**
 * Hydration-safe persisted state: static fallback on first render (matches
 * SSR), real value loads after mount, saves gated on mount. Single place
 * for the documented set-state-in-effect exception.
 */
export function useStoredState<T>(key: string, fallback: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(fallback);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once hydration of stored value
    setValue(loadFromStorage(key, fallback));
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fallback intentionally read once: callers pass fresh literals
  }, [key]);
  useEffect(() => {
    if (mounted) saveToStorage(key, value);
  }, [key, mounted, value]);
  return [value, setValue];
}
