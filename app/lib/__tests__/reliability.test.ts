// Reliability contracts (STEP 7.14–7.34): readiness probes that really
// probe, preview/restore agreement (a backup is only a theory until it
// restores), and large-dataset budgets — realistic scale, not 3 records.
import { describe, expect, it } from "vitest";
import { normalizeAr } from "../quran";
import { SURAH_NAMES } from "../data/surahs";
import { readRecord, writeRecord, type StorageLike } from "../schema";
import { buildBackupFile, previewRestore, restoreBackupSafe } from "../crypto";
import { probeStorage, summarizeReadiness } from "../diagnostics";

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

function throwingStore(): StorageLike {
  const fail = () => {
    throw new Error("denied");
  };
  return {
    getItem: fail,
    setItem: fail,
    removeItem: fail,
    get length() {
      return 0;
    },
    key: () => null,
  };
}

function quotaStore(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: () => {
      const e = new Error("QuotaExceededError: storage full");
      e.name = "QuotaExceededError";
      throw e;
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

describe("storage probe (7.26: test the thing, not the process)", () => {
  it("reports ok on a working store and leaves no trace", () => {
    const st = memStore({ "wird-daymode-v1": "x" });
    expect(probeStorage(st)).toBe("ok");
    expect(st.getItem("wird-probe-v1")).toBeNull();
  });
  it("distinguishes denied from full", () => {
    expect(probeStorage(throwingStore())).toBe("denied");
    expect(probeStorage(quotaStore())).toBe("full");
    expect(probeStorage(null)).toBe("denied");
  });
  it("reports denied on unreadable stores", () => {
    const st = memStore();
    st.setItem("wird-probe-v1", "locked");
    const ro: StorageLike = {
      ...st,
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(probeStorage(ro)).toBe("denied");
  });
});

describe("readiness verdict (7.27/7.28)", () => {
  const clean = { futureVersionKeys: 0, quarantineEntries: 0 };
  it("is ready when storage works and nothing is foreign or piling up", () => {
    expect(summarizeReadiness(clean, "ok")).toEqual({
      ready: true,
      storage: "ok",
      futureVersionKeys: 0,
      quarantineEntries: 0,
      notes: [],
    });
  });
  it("names every blocking condition honestly", () => {
    expect(summarizeReadiness(clean, "full").notes).toEqual(["storage-full"]);
    expect(summarizeReadiness(clean, "denied").notes).toEqual(["storage-denied"]);
    expect(summarizeReadiness({ futureVersionKeys: 2, quarantineEntries: 0 }, "ok").notes).toEqual([
      "future-versions",
    ]);
    expect(summarizeReadiness({ futureVersionKeys: 0, quarantineEntries: 19 }, "ok").notes).toEqual(
      ["quarantine-near-cap"],
    );
    const both = summarizeReadiness({ futureVersionKeys: 1, quarantineEntries: 20 }, "denied");
    expect(both.ready).toBe(false);
    expect(both.notes).toHaveLength(3);
  });
});

describe("preview/restore agreement (7.21: a backup is a theory until restored)", () => {
  const DAY = JSON.stringify({ day: "2026-09-12", value: 5 });
  it("clean backup: preview counts equal restore outcome", () => {
    const data = { "wird-tasbeeh-v2": DAY, "wird-daymode-v1": JSON.stringify("ok") };
    const pre = previewRestore(data);
    expect(pre.total).toBe(2);
    expect(pre.valid).toBe(2);
    (globalThis as unknown as { localStorage: unknown }).localStorage = memStore();
    try {
      const rep = restoreBackupSafe(data);
      expect(rep.applied).toBe(pre.total);
      expect(rep.skipped).toBe(0);
      expect(rep.rolledBack).toBe(false);
    } finally {
      (globalThis as unknown as { localStorage: unknown }).localStorage = memStore();
    }
  });
  it("mixed backup: applied + skipped always equals previewed total", () => {
    const data = {
      "wird-tasbeeh-v2": DAY,
      "wird-daymode-v1": JSON.stringify(42),
      "wird-no-such-dataset": JSON.stringify({ hello: 1 }),
      "not-a-wird-key": "zzz",
    };
    const pre = previewRestore(data);
    expect(pre.total).toBe(3);
    (globalThis as unknown as { localStorage: unknown }).localStorage = memStore();
    try {
      const rep = restoreBackupSafe(data);
      expect(rep.applied + rep.skipped).toBe(pre.total);
      expect(rep.rolledBack).toBe(false);
    } finally {
      (globalThis as unknown as { localStorage: unknown }).localStorage = memStore();
    }
  });
});

describe("large datasets stay responsive (7.33/7.34)", () => {
  function budgeted<T>(label: string, ms: number, fn: () => T): T {
    const t0 = Date.now();
    const out = fn();
    expect(Date.now() - t0, label).toBeLessThan(ms);
    return out;
  }
  it("2000-record custom list round-trips through validation", () => {
    const big = Array.from({ length: 2000 }, (_, i) => ({
      id: `c${i}`,
      title: `custom ${i}`,
      points: 1,
    }));
    const st = memStore();
    budgeted("write-2000", 2000, () => {
      const res = writeRecord(st, "wird-customs-v1", "wird-customs-v1", big);
      expect(res.ok).toBe(true);
    });
    const { value } = budgeted("read-2000", 2000, () =>
      readRecord<unknown[]>(st, "wird-customs-v1", "wird-customs-v1"),
    );
    expect(value).toHaveLength(2000);
  });
  it("500-key backup restores within budget with agreement", () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < 500; i++) {
      data[`wird-daymode-v1`] = JSON.stringify("ok");
      data[`p_${i}_wird-tasbeeh-v2`] = JSON.stringify({ day: "2026-09-12", value: i % 100 });
    }
    (globalThis as unknown as { localStorage: unknown }).localStorage = memStore();
    try {
      const pre = budgeted("preview-500", 2000, () => previewRestore(data));
      expect(pre.total).toBe(501);
      const rep = budgeted("restore-500", 3000, () => restoreBackupSafe(data));
      expect(rep.applied + rep.skipped).toBe(pre.total);
      expect(rep.rolledBack).toBe(false);
    } finally {
      (globalThis as unknown as { localStorage: unknown }).localStorage = memStore();
    }
  });
  it("7000-record hadith-scale search stays fast on precomputed text", () => {
    // Token comes from the repo bundle at runtime (never retyped here), so
    // this asserts real Arabic normalization, not byte-identical typos.
    const token = SURAH_NAMES[0] ?? "x";
    expect(normalizeAr("abc")).toBe("abc");
    const books = Array.from({ length: 7000 }, (_, i) => ({
      num: i + 1,
      text: `row ${i} ${token} tail`,
      ntext: "",
      book: 1,
      ref: `#${i + 1}`,
    }));
    for (const h of books) h.ntext = normalizeAr(h.text);
    const q = normalizeAr(token);
    const hits = budgeted("search-7000", 1500, () => books.filter((h) => h.ntext.includes(q)));
    expect(hits.length).toBe(7000);
    const none = budgeted("search-7000-miss", 1500, () =>
      books.filter((h) => h.ntext.includes(normalizeAr("zzqx"))),
    );
    expect(none).toHaveLength(0);
  });
  it("manifest build covers the large store", () => {
    (globalThis as unknown as { localStorage: unknown }).localStorage = memStore({
      "wird-customs-v1": JSON.stringify({
        __wird: { v: 1, updatedAt: 1 },
        d: [{ id: "c", title: "t", points: 1 }],
      }),
    });
    try {
      const file = budgeted("manifest", 2000, () => buildBackupFile());
      expect(file.v).toBe(2);
      expect(file.count).toBeGreaterThan(0);
    } finally {
      (globalThis as unknown as { localStorage: unknown }).localStorage = memStore();
    }
  });
});
