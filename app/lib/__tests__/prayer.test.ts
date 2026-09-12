import { describe, expect, it } from "vitest";
import { dayArc, nextPrayer } from "../prayer";

const T = { fajr: "05:00", dhuhr: "12:00", asr: "15:30", maghrib: "18:00", isha: "19:30" };
const at = (h: number, m = 0) => new Date(2026, 8, 12, h, m, 0);

describe("prayer day arc", () => {
  it("positions mid-interval correctly", () => {
    const a = dayArc(T, at(13, 30));
    expect(a?.prevId).toBe("dhuhr");
    expect(a?.nextId).toBe("asr");
    expect(a?.frac).toBeCloseTo(0.43, 1);
  });

  it("wraps overnight (isha → fajr)", () => {
    const a = dayArc(T, at(22, 0));
    expect(a?.prevId).toBe("isha");
    expect(a?.nextId).toBe("fajr");
    expect(a?.frac).toBeCloseTo(0.24, 1);
    const b = dayArc(T, at(4, 0));
    expect(b?.prevId).toBe("isha");
    expect(b?.nextId).toBe("fajr");
    expect(b?.frac).toBeCloseTo(0.86, 1);
  });

  it("clamps to [0, 1] and needs two times", () => {
    expect(dayArc({ fajr: "05:00" }, at(12))).toBeNull();
    expect(dayArc({}, at(12))).toBeNull();
    expect(dayArc(T, at(12, 0))?.frac).toBe(0);
    const a = dayArc(T, at(11, 59));
    expect(a?.frac).toBeLessThan(1);
    expect(a?.frac).toBeGreaterThanOrEqual(0);
  });

  it("agrees with nextPrayer on the upcoming prayer", () => {
    for (const [h, m] of [
      [6, 0],
      [13, 0],
      [20, 0],
      [2, 0],
    ] as const) {
      const now = at(h, m);
      expect(dayArc(T, now)?.nextId).toBe(nextPrayer(T, now)?.id);
    }
  });
});
