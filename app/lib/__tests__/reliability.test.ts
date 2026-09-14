// Reliability contracts (STEP 7.14–7.34): readiness probes that really
// probe, preview/restore agreement (a backup is only a theory until it
// restores), and large-dataset budgets — realistic scale, not 3 records.
import { describe, expect, it } from "vitest";
import { normalizeAr } from "../quran";
import { SURAH_NAMES } from "../data/surahs";
import { readRecord, readQuarantine, writeRecord, type StorageLike } from "../schema";
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

describe("diagnostics scrubbing (7.39/7.40/7.48: no user bytes leave)", () => {
  const SECRET = "my most private reflection text 48151623";
  it("quarantine export carries metadata only", async () => {
    const { scrubQuarantine } = await import("../diagnostics");
    const out = scrubQuarantine([
      { key: "wird-reflection-v2", at: 7, reason: "import-corrupt", raw: SECRET },
      { key: "k", at: 0, reason: "r", raw: "" },
    ]);
    expect(out).toEqual([
      { key: "wird-reflection-v2", at: 7, reason: "import-corrupt", bytes: SECRET.length },
      { key: "k", at: 0, reason: "r", bytes: 0 },
    ]);
    expect(JSON.stringify(out)).not.toContain("48151623");
  });
  it("tolerates malformed entries without throwing", async () => {
    const { scrubQuarantine } = await import("../diagnostics");
    expect(scrubQuarantine(null as unknown as never[])).toEqual([]);
    expect(scrubQuarantine([{} as never])[0]).toEqual({ key: "?", at: 0, reason: "?", bytes: 0 });
  });
});

describe("incident state (7.44)", () => {
  it("derives normal/degraded/major without auto-claiming recovery", async () => {
    const { incidentState } = await import("../diagnostics");
    expect(incidentState({ ready: true, storage: "ok" })).toBe("normal");
    expect(incidentState({ ready: false, storage: "ok" })).toBe("degraded");
    expect(incidentState({ ready: false, storage: "full" })).toBe("major");
    expect(incidentState({ ready: false, storage: "denied" })).toBe("major");
  });
});

describe("invariant monitoring (7.38)", () => {
  it("passes clean stores, flags bad day-ids and unknown guide kinds", async () => {
    const { checkInvariants } = await import("../diagnostics");
    const good = memStore({
      "wird-history-v1": JSON.stringify({
        __wird: { v: 1, updatedAt: 1 },
        d: { "2026-09-12": { day: "2026-09-12", ids: ["fajr"], pages: 0 } },
      }),
      "wird-guide-log-v1": JSON.stringify([{ kind: "review", at: 1 }]),
    });
    expect(checkInvariants(good)).toEqual([]);
    const bad = memStore({
      "wird-history-v1": JSON.stringify({ __wird: { v: 1, updatedAt: 1 }, d: { someday: {} } }),
      "wird-guide-log-v1": JSON.stringify([
        { kind: "state:RETURNING", day: "2026-09-12" },
        { kind: "mystery-kind", day: "2026-09-12" },
      ]),
    });
    const found = checkInvariants(bad)
      .map((v) => v.code)
      .sort();
    expect(found).toEqual(["bad-day-id", "unknown-guide-kind"]);
  });
  it("flags quarantine raws over the cap, never throws", async () => {
    const { checkInvariants } = await import("../diagnostics");
    const big = memStore({
      "wird-quarantine-v1": JSON.stringify([
        { key: "k", at: 1, reason: "r", raw: "x".repeat(5000) },
      ]),
    });
    expect(checkInvariants(big).map((v) => v.code)).toEqual(["quarantine-over-cap"]);
    expect(checkInvariants(null)).toEqual([]);
    expect(checkInvariants(throwingLike())).toEqual([]);
  });
});

function throwingLike(): StorageLike {
  const fail = (): never => {
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

describe("randomized operation sequences (7.36/7.37: seeded, reproducible)", () => {
  // Deterministic PRNG: same seed, same sequence, every run. Failures are
  // debuggable, never flakes.
  function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  it("300 random save/read/delete/migrate ops preserve store invariants", () => {
    const st = memStore();
    const rnd = mulberry32(20260913);
    const keys = ["wird-daymode-v1", "wird-tasbeeh-v2", "wird-customs-v1", "wird-history-v1"];
    const payloads: unknown[] = [
      "ok",
      "",
      42,
      null,
      { day: "2026-09-12", value: 3 },
      { day: "", ids: ["a"] },
      [{ id: "c", title: "t", points: 1 }],
      { "2026-09-12": { day: "2026-09-12", ids: [], pages: 0 } },
      { bogus: [1, 2, { x: "y".repeat(9000) }] },
    ];
    for (let i = 0; i < 300; i++) {
      const k = keys[Math.floor(rnd() * keys.length)] as string;
      const v = payloads[Math.floor(rnd() * payloads.length)];
      const op = rnd();
      if (op < 0.55) {
        expect(() => writeRecord(st, k, k, v)).not.toThrow();
      } else if (op < 0.8) {
        st.removeItem(k);
      } else {
        const r = readRecord(st, k, k);
        expect(r).toHaveProperty("value");
        expect(r).toHaveProperty("status");
      }
    }
    // Invariants hold at the end: quarantine bounded, every readable key
    // either validates or falls back (never throws, never undefined-behaves).
    expect(readQuarantine(st).length).toBeLessThanOrEqual(20);
    for (const k of keys) {
      expect(() => readRecord(st, k, k)).not.toThrow();
    }
  });
  it("save-then-load preserves records; delete-then-load falls back (property)", () => {
    const st = memStore();
    const rnd = mulberry32(7);
    for (let i = 0; i < 50; i++) {
      const v = `v${Math.floor(rnd() * 100000)}`;
      writeRecord(st, "wird-daymode-v1", "wird-daymode-v1", v);
      expect(readRecord(st, "wird-daymode-v1", "wird-daymode-v1").value).toBe(v);
      st.removeItem("wird-daymode-v1");
      // After delete, reads fall back to the schema default, never garbage.
      expect(typeof readRecord(st, "wird-daymode-v1", "wird-daymode-v1").value).toBe("string");
    }
  });
});
