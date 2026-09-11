import { describe, expect, it } from "vitest";
import { buildDemo } from "../demo";

const IDS = ["fajr-jamaa", "witr", "quran", "morning", "parents"];

describe("buildDemo", () => {
  it("builds a deterministic 45-day history with a witr streak", () => {
    const a = buildDemo("2026-09-11", IDS);
    const b = buildDemo("2026-09-11", IDS);
    expect(a).toEqual(b);
    const days = Object.keys(a.history).sort();
    expect(days.length).toBeGreaterThan(35);
    expect(days.length).toBeLessThanOrEqual(45);
    for (let i = 0; i < 10; i++) {
      const ms = Date.parse("2026-09-11T12:00:00Z") - i * 86400000;
      const day = new Date(ms).toISOString().slice(0, 10);
      const rec = a.history[day];
      if (rec && rec.ids.length > 0) expect(rec.ids).toContain("witr");
    }
    expect(Object.keys(a.reviews).length).toBeGreaterThan(10);
  });
});
