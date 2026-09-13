// Private plans (STEP 4): runs math, history-preserving resets, neutral
// language, generic reminders/errors, storage wiring. Synthetic neutral
// fixtures only ("Private Plan A") — never sensitive example data.
import { describe, expect, it } from "vitest";
import { readRecord, SCHEMAS, writeRecord, type StorageLike } from "../schema";
import { tr } from "../strings";
import {
  attemptCount,
  averageRunDays,
  averageSetbackGap,
  checkedInToday,
  currentRunDays,
  isPrivatePlanLike,
  isPrivatePlansKey,
  logStrategy,
  logTrigger,
  logUsage,
  longestRunDays,
  milestonesReached,
  newPrivatePlan,
  normalizePrivatePlan,
  planLetter,
  planTimeline,
  PRIVATE_PLANS_EXCLUDE_KEY,
  PRIVATE_PLANS_KEY,
  prunePlan,
  recordCheckin,
  recordSetback,
  runSegments,
  strategyStats,
  totalSuccessfulDays,
  triggerStats,
  usageLast7,
  usageOnDay,
  type PrivatePlan,
} from "../private-plans";

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

const plan = (startDay = "2026-01-01"): PrivatePlan =>
  normalizePrivatePlan(
    newPrivatePlan({ name: "Private Plan A", mode: "abstinence", startDay }),
  ) as PrivatePlan;

describe("runs math", () => {
  it("fresh plan counts day one as run day 1", () => {
    expect(currentRunDays(plan("2026-01-01"), "2026-01-01")).toBe(1);
  });
  it("run grows while no setback is recorded", () => {
    expect(currentRunDays(plan("2026-01-01"), "2026-01-05")).toBe(5);
  });
  it("a setback recorded today restarts the run", () => {
    const p = recordSetback(plan("2026-01-01"), "2026-01-05");
    expect(currentRunDays(p, "2026-01-05")).toBe(0);
  });
  it("the day after a setback starts a new run at 1", () => {
    const p = recordSetback(plan("2026-01-01"), "2026-01-05");
    expect(currentRunDays(p, "2026-01-06")).toBe(1);
  });
  it("future setbacks do not affect the current run", () => {
    const p = recordSetback(plan("2026-01-01"), "2026-02-01");
    expect(currentRunDays(p, "2026-01-05")).toBe(5);
  });
});

describe("history survives resets", () => {
  it("setback keeps every previous day in the segments", () => {
    let p = plan("2026-01-01");
    p = recordSetback(p, "2026-01-08", { trigger: "Late night" });
    expect(p.setbacks).toEqual(["2026-01-08"]);
    expect(currentRunDays(p, "2026-01-08")).toBe(0);
    expect(longestRunDays(p, "2026-01-10")).toBe(7);
    expect(runSegments(p, "2026-01-10")).toHaveLength(2);
  });
  it("longest run remembers the best period, not just the current one", () => {
    let p = plan("2026-01-01");
    p = recordSetback(p, "2026-01-28");
    p = recordSetback(p, "2026-02-02");
    expect(longestRunDays(p, "2026-02-05")).toBe(27);
    expect(currentRunDays(p, "2026-02-05")).toBe(3);
    expect(averageRunDays(p, "2026-02-05")).toBe(15.5);
  });
  it("totals count every setback-free day, attempts count every restart", () => {
    let p = plan("2026-01-01");
    p = recordSetback(p, "2026-01-03");
    expect(totalSuccessfulDays(p, "2026-01-05")).toBe(4);
    expect(attemptCount(p, "2026-01-05")).toBe(2);
  });
  it("average gap needs two setbacks, else null", () => {
    expect(averageSetbackGap(plan(), "2026-01-10")).toBeNull();
    let p = recordSetback(plan("2026-01-01"), "2026-01-05");
    p = recordSetback(p, "2026-01-15");
    expect(averageSetbackGap(p, "2026-01-20")).toBe(10);
  });
  it("timeline walks the whole journey oldest-first", () => {
    let p = plan("2026-01-01");
    p = recordSetback(p, "2026-01-04");
    const tl = planTimeline(p, "2026-01-06");
    expect(tl.map((e) => e.type)).toEqual(["start", "run", "setback", "run"]);
    expect(tl[tl.length - 1]).toMatchObject({ type: "run", current: true });
  });
});

describe("milestones, check-ins, usage", () => {
  it("milestones split into reached and next on the current run", () => {
    const p = plan("2026-01-01");
    const { reached, next } = milestonesReached(p, "2026-01-08");
    expect(reached).toEqual([1, 3, 7]);
    expect(next).toBe(14);
  });
  it("check-in is idempotent per day", () => {
    let p = recordCheckin(plan(), "2026-01-02", "steady");
    p = recordCheckin(p, "2026-01-02");
    expect(checkedInToday(p, "2026-01-02")).toBe(true);
    expect(p.checkins).toHaveLength(1);
    expect(checkedInToday(p, "2026-01-03")).toBe(false);
  });
  it("usage minutes sum per day and clamp to a day", () => {
    let p = logUsage(plan(), "2026-01-02", 90);
    p = logUsage(p, "2026-01-02", 5000);
    expect(usageOnDay(p, "2026-01-02")).toBe(90 + 1440);
    expect(usageOnDay(p, "2026-01-03")).toBe(0);
  });
  it("weekly window always covers seven days", () => {
    const p = logUsage(plan(), "2026-01-05", 30);
    expect(usageLast7(p, "2026-01-05")).toHaveLength(7);
    expect(usageLast7(p, "2026-01-05")[6]).toMatchObject({ day: "2026-01-05", minutes: 30 });
  });
  it("invalid inputs leave the plan untouched", () => {
    const p = plan();
    expect(recordCheckin(p, "not-a-day")).toBe(p);
    expect(recordSetback(p, "")).toBe(p);
    expect(logUsage(p, "2026-01-02", -5)).toBe(p);
    expect(logTrigger(p, "2026-01-02", "  ")).toBe(p);
  });
});

describe("trigger and strategy observations", () => {
  it("setback triggers count exactly once (metadata only)", () => {
    const p = recordSetback(plan(), "2026-01-02", { trigger: "Boredom" });
    expect(triggerStats(p)).toEqual([{ trigger: "Boredom", count: 1 }]);
  });
  it("standalone trigger logs merge with setback triggers", () => {
    let p = recordSetback(plan(), "2026-01-02", { trigger: "Boredom" });
    p = logTrigger(p, "2026-01-03", "Boredom");
    p = logTrigger(p, "2026-01-04", "Stress");
    expect(triggerStats(p)).toEqual([
      { trigger: "Boredom", count: 2 },
      { trigger: "Stress", count: 1 },
    ]);
  });
  it("strategy stats track uses and helped counts without verdicts", () => {
    let p = logStrategy(plan(), "2026-01-02", "Timer", true);
    p = logStrategy(p, "2026-01-03", "Timer", false);
    p = logStrategy(p, "2026-01-04", "Walk", null);
    expect(strategyStats(p)).toEqual([
      { strategy: "Timer", uses: 2, helped: 1 },
      { strategy: "Walk", uses: 1, helped: 0 },
    ]);
  });
});

describe("validation and pruning", () => {
  it("rejects non-plans and fills defaults for old shapes", () => {
    expect(normalizePrivatePlan(null)).toBeNull();
    expect(normalizePrivatePlan({})).toBeNull();
    const p = normalizePrivatePlan({
      id: "x",
      name: "",
      mode: "abstinence",
      startDay: "2026-01-01",
      setbacks: [],
    });
    expect(p).toMatchObject({ discreet: true, reminder: false, islamicSupport: false });
    expect(isPrivatePlanLike(p)).toBe(true);
  });
  it("pruning drops stale detail records but keeps setback days", () => {
    let p = plan("2024-01-01");
    p = { ...p, checkins: [{ day: "2024-02-01" }], usage: [{ day: "2024-02-01", minutes: 10 }] };
    p = recordSetback(p, "2024-02-01");
    const pruned = prunePlan(p, "2026-06-01");
    expect(pruned.checkins).toEqual([]);
    expect(pruned.usage).toEqual([]);
    expect(pruned.setbacks).toEqual(["2024-02-01"]);
  });
  it("schema registry owns both keys at version 1", () => {
    expect(SCHEMAS[PRIVATE_PLANS_KEY]?.version).toBe(1);
    expect(SCHEMAS[PRIVATE_PLANS_EXCLUDE_KEY]?.version).toBe(1);
  });
  it("plans round-trip through the schema layer with salvage", () => {
    const st = memStore();
    const good = plan();
    const res = writeRecord(st, PRIVATE_PLANS_KEY, PRIVATE_PLANS_KEY, [good, { bogus: true }]);
    expect(res.ok).toBe(true);
    const { value } = readRecord<PrivatePlan[]>(st, PRIVATE_PLANS_KEY, PRIVATE_PLANS_KEY);
    expect(value).toHaveLength(1);
    expect(value?.[0]?.name).toBe("Private Plan A");
  });
  it("key matcher covers global and per-profile stored forms", () => {
    expect(isPrivatePlansKey(PRIVATE_PLANS_KEY)).toBe(true);
    expect(isPrivatePlansKey("p_abc123_wird-recovery-plans-v1")).toBe(true);
    expect(isPrivatePlansKey("wird-recovery-v1")).toBe(false);
    expect(isPrivatePlansKey("wird-history-v1")).toBe(false);
  });
  it("plan letters stay generic and stable", () => {
    expect(planLetter(0)).toBe("A");
    expect(planLetter(2)).toBe("C");
  });
});

describe("neutral language and privacy-safe copy", () => {
  const en = (k: string, v?: Record<string, string | number>) => tr("en", k, v);
  const ar = (k: string, v?: Record<string, string | number>) => tr("ar", k, v);
  it("setback copy acknowledges without shaming", () => {
    expect(en("pp.setbackAffirm")).toBe(
      "Your current run restarted. Your previous progress remains in your history.",
    );
    expect(en("pp.setbackSaved")).toBe("Setback saved. Your history is preserved.");
    expect(ar("pp.setbackAffirm")).toBe("بدأ مداك الحالي من جديد. تقدّمك السابق محفوظ في سجلك.");
  });
  it("reminders are generic: no names, counts, or categories", () => {
    expect(en("pp.reminderTitle")).toBe("Private plan");
    expect(en("pp.reminderBody")).toBe("Your private plan is ready for today's check-in.");
    expect(en("pp.reminderBody")).not.toMatch(/\d/);
    expect(ar("pp.reminderBody")).not.toMatch(/\d/);
  });
  it("errors never name a category", () => {
    expect(en("pp.saveFail")).toBe("Failed to save private plan.");
    expect(en("pp.exportWarn")).toBe(
      "This file contains sensitive personal information from your private plans. Continue?",
    );
  });
  it("milestone and timer copy make no victory or treatment claims", () => {
    expect(en("pp.milestoneDone", { n: 7 })).toBe("7 days completed in your current plan.");
    expect(en("pp.timerDone")).toBe(
      "The timer finished. Whatever you choose next, your history is preserved.",
    );
    expect(en("pp.disclaimer")).toContain("not medical treatment");
  });
  it("no shaming vocabulary anywhere in the English recovery copy", () => {
    const banned = [
      "you failed",
      "ruined",
      "back to zero",
      "addict",
      "disease",
      "cure you",
      "defeated your",
      "weak",
      "shame",
      "guilt",
      "punish",
    ];
    const keys = [
      "pp.title",
      "pp.sub",
      "pp.disclaimer",
      "pp.setbackTitle",
      "pp.setbackAffirm",
      "pp.setbackSaved",
      "pp.timerDone",
      "pp.milestoneDone",
      "pp.emergencyNote",
      "pp.supportDesc",
      "pp.islamicNote",
      "pp.emptySub",
    ];
    for (const k of keys) {
      const s = en(k, { n: 7 }).toLowerCase();
      for (const b of banned) expect(`${k} ⇒ ${s}`).not.toContain(b);
    }
  });
});
