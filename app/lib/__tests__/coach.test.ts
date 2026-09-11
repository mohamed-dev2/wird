import { describe, expect, it } from "vitest";
import {
  atRisk,
  buildBrief,
  buildCatalog,
  categoryBalance,
  liftScores,
  neglectList,
  type Deed,
} from "../coach";
import type { History } from "../history";

const DEEDS: Deed[] = [
  { id: "fajr-jamaa", title: "الفجر", weight: 3, category: "salah" },
  { id: "witr", title: "الوتر", weight: 3, category: "salah" },
  { id: "quran", title: "القرآن", weight: 4, category: "quran" },
];

function days(n: number, end: string): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const ms = Date.parse(`${end}T12:00:00Z`) - i * 86400000;
    out.push(new Date(ms).toISOString().slice(0, 10));
  }
  return out;
}

describe("neglectList", () => {
  it("ranks a collapsed deed above a steady one", () => {
    // 30 days: fajr always done; witr done first 21, missed last 9
    const h: History = {};
    for (const d of days(30, "2026-09-10")) {
      const early = d < "2026-09-02";
      h[d] = { day: d, ids: early ? ["fajr-jamaa", "witr"] : ["fajr-jamaa"], pages: 1 };
    }
    const list = neglectList(
      h,
      DEEDS.filter((d) => d.id !== "quran"),
      "2026-09-10",
    );
    expect(list[0]?.id).toBe("witr");
    expect(list[0]?.miss).toBe(9);
    expect(list.find((n) => n.id === "fajr-jamaa")).toBeUndefined();
  });
});

describe("liftScores", () => {
  it("detects a deed that lifts the rest of the day", () => {
    const h: History = {};
    for (const d of days(20, "2026-09-10")) {
      // odd days: quran + 3 others; even days: 1 other only
      const odd = Number(d.slice(-2)) % 2 === 1;
      h[d] = { day: d, ids: odd ? ["quran", "a", "b", "c"] : ["a"], pages: odd ? 2 : 0 };
    }
    const lift = liftScores(h, DEEDS, "2026-09-10").find((l) => l.id === "quran");
    expect(lift?.samples).toBeGreaterThan(0);
    expect(lift?.lift).toBeGreaterThan(1);
  });
});

describe("atRisk", () => {
  it("flags a deed missed on the same weekday repeatedly", () => {
    // endDay 2026-09-10 is a Thursday; miss witr every Thursday, done otherwise
    const h: History = {};
    for (const d of days(35, "2026-09-10")) {
      const wd = new Date(`${d}T12:00:00Z`).getUTCDay();
      h[d] = { day: d, ids: wd === 4 ? ["fajr-jamaa"] : ["fajr-jamaa", "witr"], pages: 1 };
    }
    const risks = atRisk(h, DEEDS, "2026-09-10");
    expect(risks[0]?.id).toBe("witr");
    expect(risks[0]?.prob).toBeGreaterThanOrEqual(60);
  });
});

describe("categoryBalance", () => {
  it("splits completion by category", () => {
    const h: History = {};
    for (const d of days(7, "2026-09-10")) h[d] = { day: d, ids: ["fajr-jamaa"], pages: 0 };
    const bal = categoryBalance(h, DEEDS, "2026-09-10");
    expect(bal.find((b) => b.category === "salah")?.pct).toBeGreaterThan(0);
    expect(bal.find((b) => b.category === "quran")?.pct).toBe(0);
  });
});

describe("buildBrief", () => {
  it("stays quiet with sparse data and praises long witr streaks", () => {
    expect(buildBrief({}, DEEDS, "2026-09-10").neglect).toEqual([]);
    const h: History = {};
    for (const d of days(10, "2026-09-10")) h[d] = { day: d, ids: ["witr"], pages: 0 };
    expect(buildBrief(h, DEEDS, "2026-09-10").praise).toMatch("10");
  });
});

describe("buildCatalog", () => {
  it("covers every habit and categorizes prayer ids as salah", () => {
    const cat = buildCatalog();
    expect(cat.length).toBeGreaterThan(30);
    expect(cat.find((d) => d.id === "isha-jamaa")?.category).toBe("salah");
    expect(cat.find((d) => d.id === "quran")?.category).toBe("quran");
  });
});
