import { describe, expect, it } from "vitest";
import { tr } from "../strings";

// Religious-safety guardrails (§2.60, §2.70): application-generated guidance
// must never read as revelation, hadith, fatwa, or knowledge of the heart.
// These run over the exact rendered strings (AR+EN) for every guidance key
// the companion engine can emit.

const STATES = [
  "first_use",
  "new_user",
  "first_week",
  "active",
  "consistent",
  "strong_momentum",
  "improving",
  "slipping",
  "struggling",
  "quiet_period",
  "absent_short",
  "absent_med",
  "absent_long",
  "absent_very_long",
  "returning",
  "rebuilding",
  "strong_return",
  "repeated_restart",
  "overloaded",
  "challenge_milestone",
  "strong_day",
  "low_day",
  "recovery_day",
  "friday",
  "ramadan",
  "post_ramadan",
];

const REASONS = [
  "cm.r.absent",
  "cm.r.comeback",
  "cm.r.rebuild",
  "cm.r.restarts",
  "cm.r.milestone",
  "cm.r.firstweek",
  "cm.r.today",
  "cm.r.recovery",
  "cm.r.postramadan",
  "cm.r.slip",
  "cm.r.week",
  "cm.r.improve",
  "cm.r.momentum",
  "cm.r.overload",
];

const GUIDANCE_KEYS = [
  ...STATES.flatMap((s) => [`cm.${s}.t`, `cm.${s}.b`]),
  ...REASONS,
  "cm.mergeFriday",
  "cm.mergeRamadan",
  "cm.coreT",
  "tw.t",
  "tw.s",
  "ret.shortT",
  "ret.shortS",
  "ret.medT",
  "ret.medS",
  "ret.longT",
  "ret.longS",
  "ret.vlongT",
  "ret.vlongS",
];

// Markers that would present app text as revelation / prophetic speech.
const REVELATION_MARKERS = ["﴿", "﴾", "قال رسول الله", "قال الله", "قال تعالى", "ﷺ"];
// Rulings and heart-claims the app must never utter.
const FORBIDDEN_CLAIMS = [
  "فتوى",
  "fatwa",
  "حرام عليك",
  "إيمانك ضعيف",
  "iman is weak",
  "abandoned your worship",
  "تركت عبادتك",
  "Allah is angry",
  "الله غاضب",
  "your iman improved",
  "إيمانك تحسن",
  "you're becoming lazy",
  "أنت كسول",
  "you struggle every",
];

describe("guidance religious safety", () => {
  it("every guidance key exists in both languages", () => {
    for (const key of GUIDANCE_KEYS) {
      for (const lang of ["ar", "en"] as const) {
        const s = tr(lang, key, { n: 3, pct: 50, now: 60, prev: 40, title: "X", a: 1, q: 1 });
        expect(s, `${lang}:${key}`).not.toBe(key);
        expect(s.length, `${lang}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("guidance never mimics revelation or prophetic speech", () => {
    for (const key of GUIDANCE_KEYS) {
      for (const lang of ["ar", "en"] as const) {
        const s = tr(lang, key, { n: 3, pct: 50, now: 60, prev: 40, title: "X", a: 1, q: 1 });
        for (const m of REVELATION_MARKERS) {
          expect(s, `${lang}:${key} contains ${m}`).not.toContain(m);
        }
      }
    }
  });

  it("guidance never shames, rules, or claims the heart", () => {
    for (const key of GUIDANCE_KEYS) {
      for (const lang of ["ar", "en"] as const) {
        const s = tr(lang, key, { n: 3, pct: 50, now: 60, prev: 40, title: "X", a: 1, q: 1 });
        for (const m of FORBIDDEN_CLAIMS) {
          expect(s, `${lang}:${key} contains ${m}`).not.toContain(m);
        }
      }
    }
  });

  it("source labels stay visually and semantically distinct", () => {
    for (const lang of ["ar", "en"] as const) {
      const q = tr(lang, "cm.quran");
      const h = tr(lang, "cm.hadith");
      const g = tr(lang, "cm.guide");
      expect(new Set([q, h, g]).size).toBe(3);
    }
  });
});
