import { describe, expect, it } from "vitest";
import {
  HEALTH_KEY,
  QUARANTINE_KEY,
  readHealth,
  readQuarantine,
  readRecord,
  writeRecord,
  type StorageLike,
} from "../schema";

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

function quotaStore(inner: StorageLike): StorageLike {
  return {
    ...inner,
    setItem: () => {
      const e = new Error("QuotaExceededError: storage full");
      e.name = "QuotaExceededError";
      throw e;
    },
  };
}

describe("schema layer", () => {
  it("reads legacy bare values without migrating them in place", () => {
    const st = memStore({ "wird-tasbeeh-v2": JSON.stringify({ day: "2026-09-12", value: 7 }) });
    const out = readRecord<{ day: string; value: number }>(
      st,
      "wird-tasbeeh-v2",
      "wird-tasbeeh-v2",
    );
    expect(out.status).toBe("legacy");
    expect(out.value).toEqual({ day: "2026-09-12", value: 7 });
    // untouched on disk: still bare, no envelope injected
    expect(st.getItem("wird-tasbeeh-v2")).toBe(JSON.stringify({ day: "2026-09-12", value: 7 }));
  });

  it("round-trips writes through envelopes", () => {
    const st = memStore();
    const res = writeRecord(st, "wird-tasbeeh-v2", "wird-tasbeeh-v2", {
      day: "2026-09-12",
      value: 3,
    });
    expect(res).toEqual({ ok: true });
    const raw = JSON.parse(st.getItem("wird-tasbeeh-v2") as string) as {
      __wird: { v: number };
      d: unknown;
    };
    expect(raw.__wird.v).toBe(1);
    expect(raw.d).toEqual({ day: "2026-09-12", value: 3 });
    const back = readRecord(st, "wird-tasbeeh-v2", "wird-tasbeeh-v2");
    expect(back.status).toBe("ok");
    expect(back.value).toEqual({ day: "2026-09-12", value: 3 });
  });

  it("quarantines unparseable JSON and returns fallback", () => {
    const st = memStore({ "wird-daymode-v1": "{oops" });
    const out = readRecord<string>(st, "wird-daymode-v1", "wird-daymode-v1");
    expect(out.status).toBe("fallback-quarantined");
    expect(out.value).toBe("عادي");
    const q = readQuarantine(st);
    expect(q.length).toBe(1);
    expect(q[0]?.reason).toBe("parse");
    expect(q[0]?.raw).toBe("{oops");
  });

  it("quarantines schema violations without losing the raw bytes", () => {
    const st = memStore({ "wird-daymode-v1": JSON.stringify(42) });
    const out = readRecord<string>(st, "wird-daymode-v1", "wird-daymode-v1");
    expect(out.status).toBe("fallback-quarantined");
    expect(out.value).toBe("عادي");
    expect(readQuarantine(st)[0]?.raw).toBe("42");
  });

  it("salvages arrays via normalize and quarantines only the rejects", () => {
    const st = memStore({
      "wird-customs-v1": JSON.stringify([
        { id: "a", title: "ok", points: 2 },
        { id: "b", title: "bad-missing-points" },
        "garbage",
      ]),
    });
    const out = readRecord<unknown[]>(st, "wird-customs-v1", "wird-customs-v1");
    expect(out.value).toEqual([{ id: "a", title: "ok", points: 2 }]);
    const q = readQuarantine(st);
    expect(q.length).toBe(1);
    expect(q[0]?.reason).toMatch(/^normalize-rejected-2$/);
  });

  it("preserves future-version records untouched and fails safe", () => {
    const raw = JSON.stringify({ __wird: { v: 99, updatedAt: 1 }, d: { day: "x", value: 1 } });
    const st = memStore({ "wird-tasbeeh-v2": raw });
    const out = readRecord(st, "wird-tasbeeh-v2", "wird-tasbeeh-v2");
    expect(out.status).toBe("future-version");
    expect(out.value).toEqual({ day: "", value: 0 });
    expect(st.getItem("wird-tasbeeh-v2")).toBe(raw);
    expect(readHealth(st).some((h) => h.kind === "future-version")).toBe(true);
  });

  it("refuses to persist invalid values", () => {
    const st = memStore();
    const res = writeRecord(st, "wird-daymode-v1", "wird-daymode-v1", 42);
    expect(res.ok).toBe(false);
    expect(st.getItem("wird-daymode-v1")).toBeNull();
  });

  it("reports quota failures without losing the signal", () => {
    const st = quotaStore(memStore());
    const res = writeRecord(st, "wird-daymode-v1", "wird-daymode-v1", "مكثف");
    expect(res.ok).toBe(false);
    expect(res.quota).toBe(true);
    // A full store cannot persist the health log either — the in-memory
    // notice (see saveToStorage → pushNotice) is the quota channel.
  });

  it("heals on write: salvages valid items instead of refusing the dataset", () => {
    const st = memStore();
    const res = writeRecord(st, "wird-customs-v1", "wird-customs-v1", [
      { id: "a", title: "ok", points: 2 },
      { broken: true },
    ]);
    expect(res.ok).toBe(true);
    expect(res.salvaged).toBe(true);
    const back = readRecord<{ id: string }[]>(st, "wird-customs-v1", "wird-customs-v1");
    expect(back.status).toBe("ok");
    expect(back.value).toEqual([{ id: "a", title: "ok", points: 2 }]);
  });

  it("passes unknown dataset keys through", () => {
    const st = memStore({ "wird-something-new": JSON.stringify({ whatever: [1, 2] }) });
    const out = readRecord(st, "wird-something-new", "wird-something-new");
    expect(out.value).toEqual({ whatever: [1, 2] });
  });

  it("returns fallback for missing keys", () => {
    const st = memStore();
    const out = readRecord<string>(st, "wird-daymode-v1", "wird-daymode-v1");
    expect(out.status).toBe("fallback-empty");
    expect(out.value).toBe("عادي");
  });

  it("caps quarantine and health growth", () => {
    const st = memStore();
    for (let i = 0; i < 25; i++) {
      st.setItem(`wird-daymode-v1`, "{bad");
      readRecord(st, "wird-daymode-v1", "wird-daymode-v1");
      st.removeItem("wird-daymode-v1");
    }
    expect(readQuarantine(st).length).toBeLessThanOrEqual(20);
    expect(readHealth(st).length).toBeLessThanOrEqual(50);
    // quarantine/health live under well-known global keys
    expect(QUARANTINE_KEY).toBe("wird-quarantine-v1");
    expect(HEALTH_KEY).toBe("wird-health-v1");
  });
});
