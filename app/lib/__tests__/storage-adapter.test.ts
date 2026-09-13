// StorageAdapter seam (STEP 5: replaceable persistence). Covers the
// in-memory adapter and the StorageLike wrapper, including throwing stores
// (quota / private-mode) surfacing as rejections instead of sync throws.
import { describe, expect, it } from "vitest";
import { memoryAdapter, storageLikeAdapter } from "../storage-adapter";
import type { StorageLike } from "../schema";

function memStore(initial: Record<string, string> = {}): StorageLike {
  const m = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
    get length() {
      return m.size;
    },
    key: (i: number) => [...m.keys()][i] ?? null,
  };
}

describe("memoryAdapter", () => {
  it("round-trips get/set/delete with null for missing keys", async () => {
    const a = memoryAdapter({ "wird-a-v1": "1" });
    expect(await a.get("wird-a-v1")).toBe("1");
    expect(await a.get("wird-missing-v1")).toBeNull();
    await a.set("wird-b-v1", "2");
    expect(await a.get("wird-b-v1")).toBe("2");
    await a.delete("wird-a-v1");
    expect(await a.get("wird-a-v1")).toBeNull();
    expect(a.keys()).toEqual(["wird-b-v1"]);
  });
});

describe("storageLikeAdapter", () => {
  it("delegates to the wrapped synchronous store", async () => {
    const a = storageLikeAdapter(memStore({ "wird-a-v1": "1" }));
    expect(await a.get("wird-a-v1")).toBe("1");
    await a.set("wird-b-v1", "2");
    expect(await a.get("wird-b-v1")).toBe("2");
    await a.delete("wird-b-v1");
    expect(await a.get("wird-b-v1")).toBeNull();
  });
  it("turns sync store throws into rejections", async () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
      get length() {
        return 0;
      },
      key: () => null,
    };
    const a = storageLikeAdapter(broken);
    await expect(a.get("k")).rejects.toThrow("denied");
    await expect(a.set("k", "v")).rejects.toThrow("denied");
    await expect(a.delete("k")).rejects.toThrow("denied");
  });
});
