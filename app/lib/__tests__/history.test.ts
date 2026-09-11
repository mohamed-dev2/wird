import { describe, expect, it } from "vitest";
import {
  adherence,
  dataStreak,
  emptyDay,
  lastNDays,
  missStreak,
  recordDay,
  type History,
} from "../history";

function hist(days: string[], ids: string[]): History {
  const h: History = {};
  for (const d of days) h[d] = { day: d, ids: [...ids], pages: 0 };
  return h;
}

describe("recordDay", () => {
  it("merges without losing ids or pages", () => {
    const h = recordDay({}, { day: "2026-09-10", ids: ["a"], pages: 2 });
    const h2 = recordDay(h, { day: "2026-09-10", ids: [], pages: 5 });
    expect(h2["2026-09-10"]?.ids).toEqual(["a"]);
    expect(h2["2026-09-10"]?.pages).toBe(5);
  });
});

describe("windows", () => {
  it("zero-fills missing days ascending", () => {
    const h = hist(["2026-09-10"], ["a"]);
    const win = lastNDays(h, 3, "2026-09-10");
    expect(win.map((d) => d.day)).toEqual(["2026-09-08", "2026-09-09", "2026-09-10"]);
    expect(win[0]).toEqual(emptyDay("2026-09-08"));
  });

  it("computes adherence fractions", () => {
    const h = hist(["2026-09-08", "2026-09-09", "2026-09-10"], ["a"]);
    h["2026-09-09"] = { day: "2026-09-09", ids: [], pages: 0 };
    expect(adherence(h, "a", "2026-09-10", 3)).toBeCloseTo(2 / 3);
  });

  it("counts miss streaks and stops at unknown days", () => {
    const h = hist(["2026-09-09", "2026-09-10"], ["b"]);
    expect(missStreak(h, "a", "2026-09-10")).toBe(2);
    expect(missStreak(h, "a", "2026-09-05")).toBe(0);
    expect(dataStreak(h, (d) => d.ids.includes("b"), "2026-09-10")).toBe(2);
  });
});
