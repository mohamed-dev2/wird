import { beforeEach, describe, expect, it } from "vitest";
import {
  adoptKeys,
  getActiveProfileId,
  nsKey,
  newProfileId,
  setActiveProfileId,
} from "../profiles";
import { purgeQuarantineForPrefix, quarantineRecord, readQuarantine } from "../schema";
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

beforeEach(() => {
  (globalThis as unknown as { localStorage: unknown }).localStorage = memStore();
  setActiveProfileId(null);
});

describe("profile namespace isolation", () => {
  it("scopes per-profile keys, leaves globals and foreign keys alone", () => {
    expect(nsKey("wird-done-v2")).toBe("wird-done-v2");
    setActiveProfileId("abc");
    expect(getActiveProfileId()).toBe("abc");
    expect(nsKey("wird-done-v2")).toBe("p_abc_wird-done-v2");
    expect(nsKey("wird-theme-v1")).toBe("wird-theme-v1");
    expect(nsKey("wird-quarantine-v1")).toBe("wird-quarantine-v1");
    expect(nsKey("wird-health-v1")).toBe("wird-health-v1");
    expect(nsKey("other-key")).toBe("other-key");
  });

  it("adoptKeys moves only unprefixed per-profile keys, A→B→A stays clean", () => {
    const ls = localStorage as unknown as StorageLike;
    ls.setItem("wird-done-v2", "A");
    ls.setItem("wird-theme-v1", "global");
    ls.setItem("p_old_wird-done-v2", "old");
    ls.setItem("random", "x");
    adoptKeys("newbie");
    expect(ls.getItem("p_newbie_wird-done-v2")).toBe("A");
    expect(ls.getItem("wird-done-v2")).toBeNull();
    expect(ls.getItem("wird-theme-v1")).toBe("global");
    expect(ls.getItem("p_old_wird-done-v2")).toBe("old");
    expect(ls.getItem("random")).toBe("x");
  });

  it("generates unique, safely-prefixed ids", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newProfileId()));
    expect(ids.size).toBe(200);
    for (const id of ids) {
      expect(id).toMatch(/^u-[A-Za-z0-9-]+$/);
      expect(id).not.toContain("_");
    }
  });

  it("purges a deleted profile's quarantine raws, keeps everyone else's", () => {
    const st = memStore();
    quarantineRecord(st, "p_aaa_wird-done-v2", "validate", "{bad aaa}");
    quarantineRecord(st, "p_bbb_wird-done-v2", "validate", "{bad bbb}");
    expect(purgeQuarantineForPrefix(st, "p_aaa_")).toBe(1);
    const rest = readQuarantine(st);
    expect(rest.length).toBe(1);
    expect(rest[0]?.key).toBe("p_bbb_wird-done-v2");
  });
});
