import { describe, expect, it } from "vitest";
import {
  assessUser,
  coreDeeds,
  logGuidance,
  rotateIndex,
  selectGuidance,
  type CompanionInput,
  type GuideLog,
} from "../companion";
import type { History } from "../history";

const TODAY = "2026-09-12"; // a Saturday (not Friday, not Ramadan)

function daysAgo(n: number): string {
  const ms = Date.parse(`${TODAY}T12:00:00Z`) - n * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Synthetic history: active on the given offsets (0 = today). */
function hist(activeOffsets: number[], ids: string[] = ["a", "b", "c"]): History {
  const h: History = {};
  for (const off of activeOffsets) {
    const day = daysAgo(off);
    h[day] = { day, ids: [...ids], pages: 1 };
  }
  return h;
}

const range = (from: number, to: number): number[] => {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
};

function base(over: Partial<CompanionInput> = {}): CompanionInput {
  return {
    today: TODAY,
    hour: 15,
    isFriday: false,
    ramadan: false,
    hijriMonth: 3,
    history: {},
    // neutral midday progress (5/10): trips neither LOW_DAY nor STRONG_DAY
    doneToday: ["a", "b", "c", "d", "e"],
    totalToday: 10,
    lastSeen: null,
    createdDay: null,
    commitments: 6,
    deedIds: ["a", "b", "c"],
    challengesDone: [],
    recentMoods: [],
    gratitudeRecent: false,
    hasKids: false,
    ...over,
  };
}

function primary(inp: CompanionInput): string {
  return assessUser(inp).primary;
}

describe("companion user states", () => {
  it("detects first use vs new user vs active", () => {
    expect(primary(base())).toBe("FIRST_USE");
    // a first-timer's empty afternoon is a beginning, not a bad day
    expect(primary(base({ doneToday: [], hour: 18 }))).toBe("FIRST_USE");
    expect(primary(base({ history: hist([0, 1, 2]), doneToday: ["a", "b", "c", "d", "e"] }))).toBe(
      "NEW_USER",
    );
    // steady 4/7 with a 3/7 prior week — no trend either way
    expect(
      primary(base({ history: hist([0, 1, 2, 3, 7, 8, 9]), doneToday: ["a", "b", "c", "d"] })),
    ).toBe("ACTIVE");
  });

  it("detects consistency, momentum, improvement, slipping, struggling", () => {
    // flat 5/7 + 4/7 prior: consistent without trend or momentum
    expect(primary(base({ history: hist([0, 1, 2, 3, 4, 7, 8, 9, 10]) }))).toBe("CONSISTENT");
    expect(primary(base({ history: hist(range(0, 14)) }))).toBe("STRONG_MOMENTUM");
    // prev week 2/7, this week 6/7
    expect(primary(base({ history: hist([0, 1, 2, 3, 4, 5, 9, 12]) }))).toBe("IMPROVING");
    // prev 7/7, this week 2/7
    expect(primary(base({ history: hist([0, 3, ...range(7, 13)]) }))).toBe("SLIPPING");
    // old base, quiet week, still opening
    expect(primary(base({ history: hist([1, ...range(20, 26)]) }))).toBe("STRUGGLING");
  });

  it("detects quiet opening (usually active, nothing logged yet)", () => {
    expect(primary(base({ history: hist([0, 1, 2, 4, 5]), doneToday: [], hour: 15 }))).toBe(
      "QUIET_PERIOD",
    );
    // morning emptiness is not a signal
    expect(primary(base({ history: hist([0, 1, 2, 4, 5]), doneToday: [], hour: 9 }))).not.toBe(
      "QUIET_PERIOD",
    );
  });

  it("grades absence depth", () => {
    const away = (off: number) => base({ history: hist([off]), doneToday: [] });
    expect(primary(away(4))).toBe("ABSENT_SHORT");
    expect(primary(away(10))).toBe("ABSENT_MED");
    expect(primary(away(30))).toBe("ABSENT_LONG");
    expect(primary(away(90))).toBe("ABSENT_VERY_LONG");
  });

  it("detects return, rebuild, strong return", () => {
    expect(primary(base({ history: hist([5]), doneToday: ["a", "b"] }))).toBe("RETURNING");
    expect(primary(base({ history: hist([0, 1, 10]), doneToday: ["a"] }))).toBe("REBUILDING");
    expect(primary(base({ history: hist([0, 1, 2, 14]), doneToday: ["a", "b", "c"] }))).toBe(
      "STRONG_RETURN",
    );
  });

  it("detects repeated restarts without shaming", () => {
    const h = hist([4, 15, 16, 33]);
    const a = assessUser(base({ history: h, doneToday: [] }));
    expect(a.states).toContain("REPEATED_RESTART");
    // recent return in progress: restart pattern leads over quiet
    const h2 = hist([0, 1, 8, 25, 26]);
    expect(primary(base({ history: h2, doneToday: [] }))).toBe("REPEATED_RESTART");
  });

  it("detects overload, milestones, day shapes, recovery", () => {
    // thin week + older block: no restart cycles, low week, many commitments
    expect(primary(base({ history: hist([0, 1, 8, 9, 10]), commitments: 20 }))).toBe("OVERLOADED");
    expect(
      primary(
        base({
          history: hist([0, 1, 2]),
          doneToday: ["a", "b", "c", "d", "e"],
          challengesDone: [{ id: "c1", title: "Fajr" }],
        }),
      ),
    ).toBe("CHALLENGE_MILESTONE");
    expect(primary(base({ history: {}, doneToday: range(0, 7).map(String), hour: 18 }))).toBe(
      "STRONG_DAY",
    );
    expect(primary(base({ history: hist([0, 1, 2, 4]), doneToday: ["a"], hour: 18 }))).toBe(
      "LOW_DAY",
    );
    // morning low completion is not a signal
    expect(primary(base({ history: hist([0, 1, 2, 4]), doneToday: ["a"], hour: 9 }))).not.toBe(
      "LOW_DAY",
    );
    // ...nor is a newcomer's empty day (formation, not failure)
    expect(primary(base({ history: hist([0]), doneToday: [], hour: 18 }))).toBe("NEW_USER");
    // yesterday 2/10, today 7/10
    const rec = hist([1], ["a", "b"]);
    expect(
      primary(base({ history: rec, doneToday: ["a", "b", "c", "d", "e", "f", "g"], hour: 18 })),
    ).toBe("RECOVERY_DAY");
  });

  it("detects first week, Friday, Ramadan, post-Ramadan", () => {
    // first-week milestone leads once, then consistency takes over
    const fw = base({ history: hist(range(0, 6)) });
    expect(assessUser(fw).primary).toBe("FIRST_WEEK");
    const flat = base({ history: hist([0, 1, 2, 3, 4, 7, 8, 9, 10]) });
    const g = selectGuidance(assessUser(flat), flat, [{ kind: "once:FIRST_WEEK", day: TODAY }]);
    expect(g?.state).toBe("CONSISTENT");
    expect(assessUser(base({ history: hist([0, 1, 2, 4, 6]), doneToday: ["a"] })).states).toContain(
      "FIRST_WEEK",
    );
    const friBase = { history: hist([0, 1, 2, 3, 7, 8, 9]) };
    expect(primary(base({ ...friBase, isFriday: true }))).toBe("FRIDAY");
    expect(primary(base({ ...friBase, ramadan: true }))).toBe("RAMADAN");
    // Shawwal + strong window 2 weeks ago + quiet week
    expect(
      primary(base({ history: hist([14, 15, 16, 17, 18]), doneToday: [], hijriMonth: 10 })),
    ).toBe("POST_RAMADAN");
  });

  it("ranks return above Friday, today above milestones", () => {
    expect(primary(base({ history: hist([10]), doneToday: ["a"], isFriday: true }))).toBe(
      "RETURNING",
    );
    const both = base({
      history: hist([0, 1, 2, 4]),
      doneToday: ["a"],
      hour: 18,
      challengesDone: [{ id: "c1", title: "X" }],
    });
    const g = selectGuidance(assessUser(both), both, [], { id: "c1", title: "X" });
    expect(g?.state).toBe("LOW_DAY");
  });

  it("low confidence narrows to gentle states only", () => {
    // 2 active days, slipping-like shape: must not produce strong claims
    const g = selectGuidance(
      assessUser(base({ history: hist([0, 8]), doneToday: ["a"] })),
      base({ history: hist([0, 8]), doneToday: ["a"] }),
      [],
    );
    expect(["NEW_USER", "ACTIVE", "FIRST_USE", "ABSENT_SHORT", "RETURNING"]).toContain(g?.state);
    expect(g?.confidence).toBe("low");
  });
});
describe("fatigue, rotation, core, log", () => {
  const lowDay = () => base({ history: hist([0, 1, 2, 4]), doneToday: ["a"], hour: 18 });

  it("skips recently shown kinds, returns null when all tired", () => {
    const a = assessUser(lowDay());
    const g1 = selectGuidance(a, lowDay(), []);
    expect(g1?.state).toBe("LOW_DAY");
    const log: GuideLog = [{ kind: "state:LOW_DAY", day: TODAY }];
    const g2 = selectGuidance(a, lowDay(), log);
    expect(g2?.state).not.toBe("LOW_DAY");
    // everything tired → null (UI shows nothing, not a repeat)
    const allTired: GuideLog = [
      "state:LOW_DAY",
      "once:NEW_USER",
      "state:ACTIVE",
      "state:CONSISTENT",
      "state:IMPROVING",
      "state:QUIET_PERIOD",
      "state:FRIDAY",
      "state:RAMADAN",
    ].map((kind) => ({ kind, day: TODAY }));
    expect(selectGuidance(a, lowDay(), allTired)).toBeNull();
  });

  it("once-ever kinds fire exactly once per identity", () => {
    const mk = (challengesDone: { id: string; title: string }[]) =>
      base({
        history: hist([0, 1, 2], ["a", "b", "c", "d", "e"]),
        doneToday: ["a", "b", "c", "d", "e", "f"],
        hour: 10,
        challengesDone,
      });
    const a = assessUser(mk([{ id: "c1", title: "X" }]));
    const g1 = selectGuidance(a, mk([{ id: "c1", title: "X" }]), [], { id: "c1", title: "X" });
    expect(g1?.state).toBe("CHALLENGE_MILESTONE");
    const g2 = selectGuidance(
      a,
      mk([{ id: "c1", title: "X" }]),
      [{ kind: "once:CHALLENGE_MILESTONE:c1", day: TODAY }],
      { id: "c1", title: "X" },
    );
    expect(g2?.state).not.toBe("CHALLENGE_MILESTONE");
    // a different challenge still gets recognized
    const g3 = selectGuidance(
      assessUser(mk([{ id: "c2", title: "Y" }])),
      mk([{ id: "c2", title: "Y" }]),
      [{ kind: "once:CHALLENGE_MILESTONE:c1", day: "2026-09-01" }],
      { id: "c2", title: "Y" },
    );
    expect(g3?.state).toBe("CHALLENGE_MILESTONE");
  });

  it("rotation is deterministic per day and varies across days", () => {
    expect(rotateIndex(TODAY, "hope", 3)).toBe(rotateIndex(TODAY, "hope", 3));
    const seen = new Set(Array.from({ length: 30 }, (_, i) => rotateIndex(daysAgo(i), "hope", 3)));
    expect(seen.size).toBeGreaterThan(1);
    expect(rotateIndex(TODAY, "x", 0)).toBe(0);
  });

  it("coreDeeds reflects the user's own frequent deeds", () => {
    const h = hist(
      range(0, 29).filter((d) => d % 2 === 0),
      ["a", "b"],
    );
    expect(coreDeeds(h, ["a", "b", "c"], TODAY)).toEqual(["a", "b"]);
    expect(coreDeeds({}, ["a"], TODAY)).toEqual([]);
  });

  it("logGuidance dedupes and caps", () => {
    const save = () => {};
    let log: GuideLog = [];
    log = logGuidance(save, log, "state:X", TODAY);
    log = logGuidance(save, log, "state:X", TODAY);
    expect(log.length).toBe(1);
    for (let i = 0; i < 40; i++) log = logGuidance(save, log, `state:${i}`, daysAgo(i + 1));
    expect(log.length).toBeLessThanOrEqual(30);
  });
});
