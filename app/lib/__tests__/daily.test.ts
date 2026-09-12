import { beforeEach, describe, expect, it } from "vitest";
import { dayId, loadDailyList, loadDailyNumber, loadDailyText, saveToStorage } from "../wird";
import { emptyDay, recordDay } from "../history";

function memStorage(initial: Record<string, string> = {}) {
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
  (globalThis as unknown as { window: unknown }).window = { localStorage: memStorage() };
  (globalThis as unknown as { localStorage: unknown }).localStorage = (
    globalThis as unknown as { window: { localStorage: unknown } }
  ).window.localStorage;
});

describe("dayId", () => {
  it("formats local calendar days deterministically", () => {
    expect(dayId(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(dayId(new Date(2026, 8, 12))).toBe("2026-09-12");
  });
});

describe("daily envelopes survive midnight rollover", () => {
  it("returns today's list, falls back for yesterday without touching it", () => {
    saveToStorage("wird-done-v2", { day: "2026-09-12", ids: ["a"] });
    expect(loadDailyList("wird-done-v2", ["fallback"], "2026-09-12")).toEqual(["a"]);
    expect(loadDailyList("wird-done-v2", ["fallback"], "2026-09-13")).toEqual(["fallback"]);
    // stale record preserved on disk (history owns the past, not the reset)
    expect(loadDailyList("wird-done-v2", ["fallback"], "2026-09-12")).toEqual(["a"]);
  });

  it("handles multi-day absence: any stale day falls back", () => {
    saveToStorage("wird-quran-pages-v2", { day: "2026-09-01", value: 9 });
    expect(loadDailyNumber("wird-quran-pages-v2", 0, "2026-09-12")).toBe(0);
    saveToStorage("wird-reflection-v2", { day: "2026-09-01", text: "x" });
    expect(loadDailyText("wird-reflection-v2", "", "2026-09-12")).toBe("");
  });

  it("migrates legacy bare shapes instead of dropping them", () => {
    window.localStorage.setItem("wird-done-v2", JSON.stringify(["a", "b"]));
    expect(loadDailyList("wird-done-v2", [], "2026-09-12")).toEqual(["a", "b"]);
    window.localStorage.setItem("wird-tasbeeh-v2", JSON.stringify(33));
    expect(loadDailyNumber("wird-tasbeeh-v2", 0, "2026-09-12")).toBe(33);
  });

  it("falls back on malformed envelopes, never throws", () => {
    window.localStorage.setItem("wird-done-v2", "{oops");
    expect(loadDailyList("wird-done-v2", ["fb"], "2026-09-12")).toEqual(["fb"]);
    window.localStorage.setItem("wird-quran-pages-v2", JSON.stringify({ day: "2026-09-12" }));
    expect(loadDailyNumber("wird-quran-pages-v2", 7, "2026-09-12")).toBe(7);
  });
});

describe("recordDay is monotonic (rollover-safe)", () => {
  it("never loses yesterday's ids/pages to an empty today", () => {
    const prev = { "2026-09-12": { day: "2026-09-12", ids: ["a"], pages: 5 } };
    const next = recordDay(prev, emptyDay("2026-09-12"));
    expect(next["2026-09-12"]?.ids).toEqual(["a"]);
    expect(next["2026-09-12"]?.pages).toBe(5);
    const lower = recordDay(prev, { day: "2026-09-12", ids: ["b"], pages: 2 });
    expect(lower["2026-09-12"]?.pages).toBe(5);
    expect(lower["2026-09-12"]?.ids).toEqual(["b"]);
  });
});
