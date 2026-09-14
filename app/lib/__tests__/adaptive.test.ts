// Adaptive suggestions (STEP 6): difficulty signals fire only on real
// evidence; co-occurrence is observational math with strict gates, never
// causal claims. Synthetic histories only.
import { describe, expect, it } from "vitest";
import {
  bestCoOccurrence,
  challengeAdvice,
  coOccurrence,
  shiftDay,
  smartInsights,
} from "../analytics";
import type { History } from "../history";

const TODAY = "2026-09-12";

function challenge(over: Partial<{ target: number; start: string; checks: string[] }>) {
  return {
    id: "c1",
    title: "t",
    target: 10,
    start: "2026-09-01",
    checks: [] as string[],
    ...over,
  };
}

describe("challengeAdvice", () => {
  it("stays silent when on track, done, or unknowable", () => {
    expect(
      challengeAdvice(
        challenge({
          target: 20,
          start: "2026-09-01",
          checks: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"],
        }),
        TODAY,
      ),
    ).toBeNull();
    expect(
      challengeAdvice(
        challenge({ checks: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }),
        TODAY,
      ),
    ).toBeNull();
    expect(challengeAdvice(challenge({ target: 0 }), TODAY)).toBeNull();
    expect(challengeAdvice(challenge({ start: "bogus" }), TODAY)).toBeNull();
  });
  it("flags ended-below-target challenges", () => {
    expect(
      challengeAdvice(challenge({ target: 5, start: "2026-08-01", checks: ["a"] }), TODAY),
    ).toBe("ended");
  });
  it("suggests easier only past halfway under 40%", () => {
    // 12 elapsed of 20 target with 3 checks (15%) → suggest
    expect(
      challengeAdvice(
        challenge({ target: 20, start: "2026-09-01", checks: ["a", "b", "c"] }),
        "2026-09-13",
      ),
    ).toBe("consider-easier");
    // early in the window → silent even when behind
    expect(
      challengeAdvice(challenge({ target: 20, start: "2026-09-10", checks: ["a"] }), "2026-09-13"),
    ).toBeNull();
    // strong rate → silent
    expect(
      challengeAdvice(
        challenge({
          target: 20,
          start: "2026-09-01",
          checks: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n"],
        }),
        "2026-09-13",
      ),
    ).toBeNull();
  });
});

function pairHistory(): History {
  // 90 days: A on even offsets, B on all A days + rare loners → strong lift.
  const h: History = {};
  for (let o = 0; o < 90; o++) {
    const day = shiftDay(TODAY, -o);
    const ids: string[] = [];
    if (o % 2 === 0) ids.push("fajr", "witr");
    else if (o % 10 === 1) ids.push("witr");
    h[day] = { day, ids, pages: 0 };
  }
  return h;
}

describe("coOccurrence", () => {
  it("measures lift without claiming cause", () => {
    const c = coOccurrence(pairHistory(), "fajr", "witr", TODAY);
    expect(c).not.toBeNull();
    expect(c?.both).toBe(45);
    expect(c?.rateWithA).toBe(1);
    expect(c?.rateWithoutA).toBeCloseTo(0.2, 2);
    expect(c?.lift).toBeGreaterThan(0.5);
    expect(c?.confidence).toBe("high");
  });
  it("refuses thin or weak evidence", () => {
    const h = pairHistory();
    expect(coOccurrence(h, "fajr", "fajr", TODAY)).toBeNull();
    expect(coOccurrence(h, "fajr", "witr", TODAY, 20)).toBeNull();
    expect(coOccurrence(h, "fajr", "nope", TODAY)).toBeNull();
    expect(coOccurrence({}, "fajr", "witr", TODAY)).toBeNull();
  });
  it("bestCoOccurrence picks the strongest pair only", () => {
    const best = bestCoOccurrence(pairHistory(), ["fajr", "witr", "nope"], TODAY);
    expect([best?.a, best?.b].sort()).toEqual(["fajr", "witr"]);
    expect(best?.lift).toBeGreaterThan(0.79);
    expect(bestCoOccurrence({}, ["fajr", "witr"], TODAY)).toBeNull();
  });
  it("smartInsights emits the observational rule with evidence", () => {
    const out = smartInsights({
      history: pairHistory(),
      reviews: {},
      challenges: [],
      commitments: 0,
      endDay: TODAY,
    });
    const co = out.find((i) => i.id === "cooccur");
    expect(co).toBeDefined();
    expect(co?.confidence).not.toBe("low");
    expect(typeof co?.evidence["a"]).toBe("string");
    expect(typeof co?.evidence["pa"]).toBe("number");
  });
});
