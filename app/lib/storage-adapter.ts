// Async storage seam for future platforms (STEP 5: the storage layer must
// be replaceable without rewriting domain logic). Today the app persists
// through the synchronous `StorageLike` seam (`schema.ts` + `wird.ts`
// load/save); this adapter is the async boundary a sync engine, native
// port, or test harness implements. Tested — not dead code.
import type { StorageLike } from "./schema";

export type StorageAdapter = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
};

/** Wrap the existing synchronous seam (localStorage, memStore) as an adapter. */
export function storageLikeAdapter(store: StorageLike): StorageAdapter {
  return {
    get: (key) => {
      try {
        return Promise.resolve(store.getItem(key));
      } catch (e) {
        return Promise.reject(e);
      }
    },
    set: (key, value) => {
      try {
        store.setItem(key, value);
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    },
    delete: (key) => {
      try {
        store.removeItem(key);
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    },
  };
}

/** Self-contained in-memory adapter (tests, previews, future ports). */
export function memoryAdapter(initial: Record<string, string> = {}): StorageAdapter & {
  keys(): string[];
} {
  const m = new Map<string, string>(Object.entries(initial));
  return {
    get: (key) => Promise.resolve(m.has(key) ? (m.get(key) as string) : null),
    set: (key, value) => {
      m.set(key, value);
      return Promise.resolve();
    },
    delete: (key) => {
      m.delete(key);
      return Promise.resolve();
    },
    keys: () => [...m.keys()],
  };
}
