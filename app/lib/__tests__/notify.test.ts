// Reminder tones + fatigue (STEP 6): the stored tone selects copy, never
// behavior; fatigue suggests less, never more. Balanced rows preserve the
// historic hardcoded copy verbatim (now localized).
import { describe, expect, it } from "vitest";
import { tr } from "../strings";
import { evaluateLadder, ladderText, reminderFatigue, type ReminderSettings } from "../notify";

const base: ReminderSettings = { enabled: true, bedtime: "22:00", ladder: true, tone: "balanced" };
const at = (hm: string): Date => new Date(`2026-09-13T${hm}:00`);

describe("tone-aware ladder", () => {
  it("selects keys carrying the tone slug", () => {
    for (const tone of ["gentle", "balanced", "strict"] as const) {
      const hit = evaluateLadder(at("23:00"), "2026-09-01", "2026-09-13", { ...base, tone });
      expect(hit?.kind).toBe("bedtime");
      expect(hit?.titleKey).toContain(`.${tone}.`);
      expect(hit?.bodyKey).toContain(`.${tone}.`);
    }
  });
  it("keeps historic balanced copy verbatim (Arabic)", () => {
    expect(tr("ar", "rm.lad.balanced.bedtime.t")).toBe("وقت حصاد اليوم 🌙");
    expect(tr("ar", "rm.lad.balanced.risk3.b")).toBe("يوم واحد يحفظ النور. سجل وردك الآن.");
    expect(tr("ar", "rm.lad.balanced.risk1.b")).toBe("لا بأس — اليوم صفحة جديدة.");
    expect(tr("ar", "rm.lad.balanced.gone.t")).toBe("وردك يشتاق إليك 🤍");
  });
  it("resolves display text in both languages", () => {
    const hit = evaluateLadder(at("23:00"), "2026-09-01", "2026-09-13", {
      ...base,
      tone: "strict",
    });
    expect(hit).not.toBeNull();
    if (!hit) return;
    for (const lang of ["ar", "en"] as const) {
      const { title, body } = ladderText(lang, hit);
      expect(title.length).toBeGreaterThan(0);
      expect(body.length).toBeGreaterThan(0);
      expect(title).not.toContain("rm.lad.");
    }
  });
  it("distinguishes risk bands and absence depths", () => {
    expect(evaluateLadder(at("12:00"), "2026-09-12", "2026-09-13", base)?.kind).toBe("risk1");
    expect(evaluateLadder(at("12:00"), "2026-09-09", "2026-09-13", base)?.kind).toBe("risk3");
    expect(evaluateLadder(at("12:00"), "2026-09-01", "2026-09-13", base)?.kind).toBe("gone");
    expect(evaluateLadder(at("12:00"), "2026-09-13", "2026-09-13", base)).toBeNull();
  });
  it("respects enabled + ladder flags", () => {
    expect(
      evaluateLadder(at("12:00"), "2026-09-01", "2026-09-13", { ...base, enabled: false }),
    ).toBeNull();
    expect(
      evaluateLadder(at("12:00"), "2026-09-01", "2026-09-13", { ...base, ladder: false }),
    ).toBeNull();
    expect(evaluateLadder(at("12:00"), null, "2026-09-13", base)).toBeNull();
  });
});

describe("reminder fatigue", () => {
  it("fires at 7+ days absent with ladder on", () => {
    expect(reminderFatigue("2026-09-01", "2026-09-13", base)).toEqual({
      kind: "fatigue",
      absent: 12,
    });
    expect(reminderFatigue("2026-09-06", "2026-09-13", base)).toEqual({
      kind: "fatigue",
      absent: 7,
    });
  });
  it("stays silent otherwise", () => {
    expect(reminderFatigue("2026-09-07", "2026-09-13", base)).toBeNull();
    expect(reminderFatigue("2026-09-01", "2026-09-13", { ...base, enabled: false })).toBeNull();
    expect(reminderFatigue("2026-09-01", "2026-09-13", { ...base, ladder: false })).toBeNull();
    expect(reminderFatigue(null, "2026-09-13", base)).toBeNull();
    expect(reminderFatigue("bogus", "2026-09-13", base)).toBeNull();
  });
});

describe("suggestion copy safety", () => {
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
    "lazy",
    "angry",
  ];
  const keys = [
    "rm.lad.gentle.bedtime.t",
    "rm.lad.gentle.bedtime.b",
    "rm.lad.gentle.risk3.t",
    "rm.lad.gentle.risk3.b",
    "rm.lad.gentle.risk1.t",
    "rm.lad.gentle.risk1.b",
    "rm.lad.gentle.gone.t",
    "rm.lad.gentle.gone.b",
    "rm.lad.balanced.bedtime.t",
    "rm.lad.balanced.bedtime.b",
    "rm.lad.balanced.risk3.t",
    "rm.lad.balanced.risk3.b",
    "rm.lad.balanced.risk1.t",
    "rm.lad.balanced.risk1.b",
    "rm.lad.balanced.gone.t",
    "rm.lad.balanced.gone.b",
    "rm.lad.strict.bedtime.t",
    "rm.lad.strict.bedtime.b",
    "rm.lad.strict.risk3.t",
    "rm.lad.strict.risk3.b",
    "rm.lad.strict.risk1.t",
    "rm.lad.strict.risk1.b",
    "rm.lad.strict.gone.t",
    "rm.lad.strict.gone.b",
    "rm.fatigueT",
    "rm.fatigueB",
    "an.advEasier",
    "an.advEnded",
    "an.advWhy",
    "ps.t",
    "ps.s",
    "ps.master",
    "ps.masterD",
    "ps.habits",
    "ps.habitsD",
    "ps.mood",
    "ps.moodD",
    "ps.reminders",
    "ps.remindersD",
    "ps.recoveryNote",
    "an.ins.cooccur",
  ];
  it("no shaming vocabulary in any suggestion string (both languages)", () => {
    for (const k of keys) {
      for (const lang of ["ar", "en"] as const) {
        const s = tr(lang, k, { n: 7, rate: "35%", a: "x", b: "y", pa: 80, pb: 50 }).toLowerCase();
        expect(s.length, `${lang}:${k}`).toBeGreaterThan(0);
        expect(s, `${lang}:${k} resolves`).not.toContain(k.toLowerCase());
        for (const b of banned) expect(`${lang}:${k} ⇒ ${s}`).not.toContain(b);
      }
    }
  });
});
