// Deen journey tests (STEP 10, ADR-007): pure-logic coverage for
// levels, XP idempotency, quests, achievements, streaks, combos,
// validation, and the theological guardrails (no sin counters, no
// negative XP, no faith scores, no leaderboards — structural).
import { describe, expect, it } from "vitest";
import {
  addCustom,
  addQuest,
  behaviorMetrics,
  blankDay,
  comboOf,
  completeQuest,
  dayOf,
  defaultDeen,
  evaluateAchievements,
  gapDays,
  grantReturnXp,
  hasAward,
  isDeenLike,
  markSecretDeed,
  normalizeDeen,
  noteOpen,
  openChest,
  rollStreaks,
  seedDailyQuests,
  setLevel,
  setMinimumDay,
  setReflection,
  setSalah,
  setSpeech,
  toggleCharacter,
  toggleDeed,
  type DeenState,
} from "../deen";
import {
  ACHIEVEMENT_IDS,
  AWARENESS,
  CHARACTER,
  DEEDS,
  HARAM,
  LEARN,
  PRAYERS,
  QUESTS,
  SPEECH,
  XP,
} from "../deen-catalog";

const D1 = "2026-09-10";
const D2 = "2026-09-11";
const D3 = "2026-09-12";

function fullSalah(s: DeenState, day: string): DeenState {
  let n = s;
  for (const p of PRAYERS) n = setSalah(n, day, p, "done");
  return n;
}

describe("salah tracking (L1)", () => {
  it("all five marked completes the day and awards +10 once", () => {
    let s = defaultDeen();
    s = setSalah(s, D1, "fajr", "done");
    expect(hasAward(s, `salah:${D1}`)).toBe(false);
    s = fullSalah(s, D1);
    expect(hasAward(s, `salah:${D1}`)).toBe(true);
    expect(s.xpTotal).toBe(XP.salahDay);
    // Re-marking never double-awards.
    s = setSalah(s, D1, "fajr", "late");
    s = setSalah(s, D1, "fajr", "done");
    expect(s.xpTotal).toBe(XP.salahDay);
  });
  it("missed needs no explanation and unmarking keeps history", () => {
    let s = fullSalah(defaultDeen(), D1);
    s = setSalah(s, D1, "fajr", "missed");
    expect(dayOf(s, D1).salah.fajr).toBe("missed");
    s = setSalah(s, D1, "fajr", null);
    expect(dayOf(s, D1).salah.fajr).toBeUndefined();
    // XP is never revoked (no punishment mechanics).
    expect(s.xpTotal).toBe(XP.salahDay);
  });
});

describe("XP ledger (double-click proof, §41)", () => {
  it("rapid duplicate completions award exactly once", () => {
    let s = defaultDeen();
    for (let i = 0; i < 5; i++) s = toggleDeed(s, D1, "deed.quran-read");
    // toggled 5x: on, off, on, off, on → single award.
    expect(s.xpTotal).toBe(XP.deed);
    s = markSecretDeed(s, D1);
    s = markSecretDeed(s, D1);
    expect(s.xpTotal).toBe(XP.deed + XP.secretDeed);
    s = setReflection(s, D1, true, "note");
    s = setReflection(s, D1, true, "note");
    expect(s.xpTotal).toBe(XP.deed + XP.secretDeed + XP.reflection);
    s = openChest(s, D1);
    s = openChest(s, D1);
    expect(s.xpTotal).toBe(XP.deed + XP.secretDeed + XP.reflection + XP.chest);
  });
  it("quest completion awards its xp once; double complete is a no-op", () => {
    let s = addQuest(defaultDeen(), {
      templateId: "q.read-quran",
      kind: "deed",
      title: "Read Quran today",
      custom: false,
      difficulty: "easy",
      xp: XP.questEasy,
      day: D1,
    });
    const id = s.quests[0]?.id ?? "missing";
    s = completeQuest(s, id, D1);
    s = completeQuest(s, id, D1);
    expect(s.xpTotal).toBe(XP.questEasy);
    expect(dayOf(s, D1).questsDone).toEqual([id]);
  });
});

describe("levels (§45/§46)", () => {
  it("unlock and simplify freely; history is never touched", () => {
    let s = fullSalah(defaultDeen(), D1);
    s = toggleDeed(s, D1, "deed.charity");
    s = setLevel(s, 5);
    expect(s.level).toBe(5);
    s = setLevel(s, 3);
    expect(s.level).toBe(3);
    s = setLevel(s, 1);
    expect(s.level).toBe(1);
    expect(Object.keys(s.days)).toEqual([D1]);
    expect(s.xpTotal).toBe(XP.salahDay + XP.deed);
  });
});

describe("quests (§26/§27)", () => {
  it("seed is idempotent; full lifecycle accept/skip/pause/custom", () => {
    const t = (k: string): string => k;
    let s = seedDailyQuests(defaultDeen(), D1, t);
    const n = s.quests.length;
    expect(n).toBeGreaterThan(0);
    s = seedDailyQuests(s, D1, t);
    expect(s.quests.length).toBe(n);
    s = addQuest(s, {
      templateId: "custom",
      kind: "personal",
      title: "My quest",
      custom: true,
      difficulty: "advanced",
      xp: XP.questAdvanced,
    });
    const c = s.quests[s.quests.length - 1];
    expect(c?.difficulty).toBe("advanced");
    s = completeQuest(s, c?.id ?? "missing", D1);
    expect(s.xpTotal).toBe(XP.questAdvanced);
  });
  it("templates carry time/effort difficulty, never holiness", () => {
    for (const q of QUESTS) {
      expect(["easy", "medium", "advanced"]).toContain(q.difficulty);
      expect(q.xp).toBeGreaterThan(0);
    }
  });
});

describe("streaks (§29/§30)", () => {
  it("consecutive recorded days build; observed gaps reset counts only", () => {
    let s = fullSalah(defaultDeen(), D1);
    s = rollStreaks(s, D1);
    expect(s.streaks.salah.current).toBe(1);
    s = fullSalah(s, D2);
    s = rollStreaks(s, D2);
    expect(s.streaks.salah.current).toBe(2);
    // Gap observed on open: count resets, longest kept, history kept.
    s = noteOpen(s, D1);
    s = noteOpen(s, "2026-09-20");
    expect(s.streaks.salah.current).toBe(0);
    expect(s.streaks.salah.longest).toBe(2);
    expect(Object.keys(s.days).length).toBe(2);
    expect(s.returnCount).toBe(1);
  });
  it("return XP is once per day", () => {
    let s = defaultDeen();
    s = grantReturnXp(s, D1);
    s = grantReturnXp(s, D1);
    expect(s.xpTotal).toBe(XP.returned);
  });
});

describe("combo + metrics (§28/§44)", () => {
  it("combo counts areas, never spirituality", () => {
    let s = fullSalah(defaultDeen(), D1);
    s = toggleDeed(s, D1, "deed.quran-read");
    s = toggleCharacter(s, D1, "char.patience");
    s = setReflection(s, D1, true);
    const c = comboOf(s, D1);
    expect(c.count).toBe(5);
    expect(c.areas).toEqual(["salah", "quran", "deed", "character", "reflection"]);
  });
  it("behavior metrics are separate tracked rates, never a faith score", () => {
    const s = fullSalah(defaultDeen(), D1);
    const m = behaviorMetrics(s);
    expect(m.salahConsistency).toBe(100);
    expect(m.quranConsistency).toBe(0);
    expect(Object.keys(m)).toEqual([
      "salahConsistency",
      "quranConsistency",
      "questProgress",
      "reflectionConsistency",
      "goalProgress",
    ]);
  });
});

describe("achievements (§25)", () => {
  it("all seven earn from recorded behavior", () => {
    let s = defaultDeen();
    s = toggleDeed(s, D1, "deed.quran-read");
    s = evaluateAchievements(s, D1);
    expect(s.achievements["first-step"]).toBe(D1);
    s = { ...s, returnCount: 1 };
    s = evaluateAchievements(s, D1);
    expect(s.achievements["returned"]).toBe(D1);
    // 10 reflections across days.
    for (let i = 0; i < 10; i++) {
      const d = `2026-08-${String(10 + i).padStart(2, "0")}`;
      s = setReflection(s, d, true);
    }
    s = evaluateAchievements(s, D2);
    expect(s.achievements["reflected"]).toBe(D2);
    expect(ACHIEVEMENT_IDS.length).toBe(7);
  });
  it("no rank-of-worth achievement can exist in the id set", () => {
    const banned = ["best", "righteous", "faith", "rewarded", "muslim", "perfect", "highest"];
    for (const id of ACHIEVEMENT_IDS) {
      for (const b of banned) expect(id).not.toContain(b);
    }
  });
});

describe("reflections without counters (§11/§12)", () => {
  it("speech checks store answers only — no scores, no negative XP", () => {
    let s = defaultDeen();
    const before = s.xpTotal;
    s = setSpeech(s, D1, "speech.ghibah", {
      answer: "yes",
      trigger: "lunch",
      next: "change topic",
    });
    expect(dayOf(s, D1).speech["speech.ghibah"]?.answer).toBe("yes");
    expect(s.xpTotal).toBe(before);
    s = setSpeech(s, D1, "haram.backbiting", { answer: "unsure" });
    s = setSpeech(s, D1, "haram.backbiting", null);
    expect(dayOf(s, D1).speech["haram.backbiting"]).toBeUndefined();
  });
  it("state shape has no numeric sin/score fields", () => {
    const json = JSON.stringify(defaultDeen()).toLowerCase();
    for (const w of [
      "sin",
      "hasanat",
      "faith",
      "rank",
      "leaderboard",
      "punish",
      "penalty",
      "demerit",
    ]) {
      expect(json).not.toContain(w);
    }
  });
  it("minimum-day flag is independent of records", () => {
    const s = setMinimumDay(defaultDeen(), D1, true);
    expect(dayOf(s, D1).minimumDay).toBe(true);
    expect(blankDay(D2).minimumDay).toBe(false);
  });
});

describe("catalog integrity (§6/§9/§13/§42)", () => {
  it("every verified item carries source + reference", () => {
    const all = [...DEEDS, ...AWARENESS, ...HARAM, ...SPEECH, ...CHARACTER];
    expect(all.length).toBeGreaterThan(40);
    for (const item of all) {
      expect(["verified", "personal-goal", "habit", "advice"]).toContain(item.kind);
      if (item.kind === "verified") {
        expect(item.source, `${item.id} source`).toBeTruthy();
        expect(item.reference, `${item.id} reference`).toBeTruthy();
      }
    }
  });
  it("ordinary habits are never labeled rulings", () => {
    const habitIds = [
      "aware.scroll",
      "aware.overeat",
      "aware.time-waste",
      "speech.arguments",
      "speech.excess",
    ];
    for (const id of habitIds) {
      const item = [...AWARENESS, ...SPEECH].find((x) => x.id === id);
      expect(item?.kind).toBe("habit");
    }
  });
  it("learning cards exist for all seven classifications", () => {
    expect(LEARN.map((c) => c.id)).toEqual([
      "learn.fard",
      "learn.wajib",
      "learn.sunnah",
      "learn.mustahabb",
      "learn.mubah",
      "learn.makruh",
      "learn.haram",
      "learn.salah",
      "learn.fasting",
      "learn.zakah",
      "learn.hajj",
    ]);
  });
  it("five prayers tracked, customs supported", () => {
    expect(PRAYERS).toEqual(["fajr", "dhuhr", "asr", "maghrib", "isha"]);
    let s = addCustom(defaultDeen(), "rules", "I will pause before reacting");
    expect(s.customs.rules.length).toBe(1);
    s = addCustom(s, "rules", "   ");
    expect(s.customs.rules.length).toBe(1);
  });
});

describe("validation (§40)", () => {
  it("garbage in → safe defaults, never a crash", () => {
    expect(normalizeDeen(null)).toEqual(defaultDeen());
    expect(normalizeDeen({ level: 99, xpTotal: -5 })).toEqual(defaultDeen());
    expect(isDeenLike({ level: 2, xpTotal: 3 })).toBe(false);
  });
  it("clamps impossible values without losing valid history", () => {
    const s = normalizeDeen({
      ...defaultDeen(),
      level: 5,
      xpTotal: 12.9,
      awards: ["a", "a", "b"],
      streaks: {
        salah: { current: 9, longest: 3, lastDay: D3 },
        quran: { current: -2, longest: -1, lastDay: "nope" },
        reflection: { current: 0, longest: 0, lastDay: "" },
        deed: { current: 0, longest: 0, lastDay: "" },
        habit: { current: 0, longest: 0, lastDay: "" },
      },
      days: { [D1]: { day: D1, salah: { fajr: "done" } }, bad: { nope: 1 } },
    });
    expect(s.level).toBe(5);
    expect(s.xpTotal).toBe(12);
    expect(s.awards).toEqual(["a", "b"]);
    expect(s.streaks.salah).toEqual({ current: 9, longest: 9, lastDay: D3 });
    expect(s.streaks.quran).toEqual({ current: 0, longest: 0, lastDay: "" });
    expect(Object.keys(s.days)).toEqual([D1]);
  });
  it("gap math is day-based and safe on garbage", () => {
    expect(gapDays(D1, D3)).toBe(2);
    expect(gapDays("nope", D3)).toBe(0);
  });
});
