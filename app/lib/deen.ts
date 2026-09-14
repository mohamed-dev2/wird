// Deen journey (STEP 10, ADR-007): levels, XP, quests, achievements,
// streaks, combos, reflections — pure logic over ONE per-profile key
// (wird-deen-v1) through the existing loadFromStorage/saveToStorage
// seam. No database, no new storage architecture, no network.
// Theological guardrails are structural: XP is in-app activity only
// (idempotent ledger, never negative), levels are user-chosen tracking
// depth (downgrade keeps history), streaks count RECORDED days only,
// and there is no sin counter, no negative XP, no leaderboard, and no
// faith percentage anywhere in this module (asserted by deen.test.ts).
import { dayId, loadFromStorage, saveToStorage } from "./wird";
import {
  ACHIEVEMENT_IDS,
  PRAYERS,
  QUESTS,
  STREAK_KINDS,
  XP,
  type AchievementId,
  type PrayerId,
  type StreakKind,
} from "./deen-catalog";

export const DEEN_KEY = "wird-deen-v1";
/** Day records older than this are pruned on save (achievements persist). */
export const DEEN_RETENTION_DAYS = 365;
/** Idempotency ledger cap: bounded, latest-first on prune. */
export const DEEN_AWARDS_CAP = 1000;
/** Reflection note ceiling (short structured notes, not journaling). */
export const DEEN_NOTE_MAX = 140;

export type DeenLevel = 1 | 2 | 3 | 4 | 5;
export type SalahMark = "done" | "late" | "missed";
export type ReflectAnswer = "no" | "yes" | "unsure" | "skip";
export type QuestState = "active" | "paused" | "skipped" | "done";
export type QuestKind =
  "daily" | "weekly" | "personal" | "deed" | "character" | "learning" | "discipline";

export type SpeechCheck = {
  answer: ReflectAnswer;
  trigger?: string;
  next?: string;
};

export type DayDeen = {
  day: string;
  salah: Partial<Record<PrayerId, SalahMark>>;
  deeds: string[];
  secretDeed: boolean;
  character: string[];
  /** Awareness items reduced today ("things to reduce", §10). */
  reduce: string[];
  speech: Record<string, SpeechCheck>;
  reflectionDone: boolean;
  reflectionNote?: string;
  questsDone: string[];
  chestOpened: boolean;
  minimumDay: boolean;
};

export type Quest = {
  id: string;
  templateId: string;
  kind: QuestKind;
  title: string;
  custom: boolean;
  difficulty: "easy" | "medium" | "advanced";
  xp: number;
  state: QuestState;
  day?: string;
};

export type StreakRec = { current: number; longest: number; lastDay: string };

export type DeenSettings = {
  showXp: boolean;
  showLevels: boolean;
  showStreaks: boolean;
  showCombos: boolean;
  showAchievements: boolean;
  showQuests: boolean;
  calmEffects: boolean;
};

export type CustomItem = { id: string; label: string };

export type DeenState = {
  v: 1;
  level: DeenLevel;
  xpTotal: number;
  /** Idempotency ledger: "kind:id:day" strings. Single-award guarantee. */
  awards: string[];
  quests: Quest[];
  achievements: Partial<Record<AchievementId, string>>;
  streaks: Record<StreakKind, StreakRec>;
  days: Record<string, DayDeen>;
  customs: { deeds: CustomItem[]; rules: CustomItem[] };
  settings: DeenSettings;
  returnCount: number;
  lastOpenDay: string;
};

export const DEFAULT_DEEN_SETTINGS: DeenSettings = {
  showXp: true,
  showLevels: true,
  showStreaks: true,
  showCombos: true,
  showAchievements: true,
  showQuests: true,
  calmEffects: true,
};

const blankStreaks = (): Record<StreakKind, StreakRec> => ({
  salah: { current: 0, longest: 0, lastDay: "" },
  quran: { current: 0, longest: 0, lastDay: "" },
  reflection: { current: 0, longest: 0, lastDay: "" },
  deed: { current: 0, longest: 0, lastDay: "" },
  habit: { current: 0, longest: 0, lastDay: "" },
});

export function defaultDeen(): DeenState {
  return {
    v: 1,
    level: 1,
    xpTotal: 0,
    awards: [],
    quests: [],
    achievements: {},
    streaks: blankStreaks(),
    days: {},
    customs: { deeds: [], rules: [] },
    settings: { ...DEFAULT_DEEN_SETTINGS },
    returnCount: 0,
    lastOpenDay: "",
  };
}

// ---------- validation (structural twin lives in schema.ts — update both) ----------

const isDay = (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function isSalahMark(v: unknown): v is SalahMark {
  return v === "done" || v === "late" || v === "missed";
}

function isAnswer(v: unknown): v is ReflectAnswer {
  return v === "no" || v === "yes" || v === "unsure" || v === "skip";
}

function isDayDeenLike(v: unknown): v is DayDeen {
  if (!isObj(v) || !isDay(v.day)) return false;
  if (v.salah !== undefined) {
    if (!isObj(v.salah)) return false;
    for (const [k, m] of Object.entries(v.salah)) {
      if (!(PRAYERS as readonly string[]).includes(k) || !isSalahMark(m)) return false;
    }
  }
  for (const k of ["deeds", "character", "questsDone", "reduce"]) {
    const a = (v as Record<string, unknown>)[k];
    if (a !== undefined && !(Array.isArray(a) && a.every((x) => typeof x === "string")))
      return false;
  }
  if (v.speech !== undefined) {
    if (!isObj(v.speech)) return false;
    for (const c of Object.values(v.speech)) {
      if (!isObj(c) || !isAnswer(c.answer)) return false;
    }
  }
  if (v.reflectionNote !== undefined && typeof v.reflectionNote !== "string") return false;
  return true;
}

export function isDeenLike(v: unknown): boolean {
  if (!isObj(v)) return false;
  if (typeof v.level !== "number" || ![1, 2, 3, 4, 5].includes(v.level)) return false;
  if (typeof v.xpTotal !== "number" || !Number.isFinite(v.xpTotal)) return false;
  if (!Array.isArray(v.awards) || !v.awards.every((x) => typeof x === "string")) return false;
  if (!Array.isArray(v.quests)) return false;
  if (!isObj(v.achievements) || !isObj(v.streaks) || !isObj(v.days)) return false;
  if (!isObj(v.customs)) return false;
  if (!isObj(v.settings)) return false;
  return true;
}

/** Clamp + dedupe into a safe state; never throws, never invents history. */
export function normalizeDeen(v: unknown): DeenState {
  const d = defaultDeen();
  if (!isDeenLike(v)) return d;
  const r = v as Record<string, unknown>;
  d.level = (r.level as DeenLevel) ?? 1;
  d.xpTotal = Math.max(0, Math.floor(r.xpTotal as number));
  d.awards = [...new Set(r.awards as string[])].slice(-DEEN_AWARDS_CAP);
  d.quests = (r.quests as Quest[]).filter(
    (q) =>
      isObj(q) &&
      typeof q.id === "string" &&
      typeof q.title === "string" &&
      ["easy", "medium", "advanced"].includes(q.difficulty as string) &&
      ["active", "paused", "skipped", "done"].includes(q.state as string),
  );
  const ach = r.achievements as Record<string, unknown>;
  for (const id of ACHIEVEMENT_IDS) {
    if (typeof ach[id] === "string" && isDay(ach[id])) d.achievements[id] = ach[id] as string;
  }
  const st = r.streaks as Record<string, unknown>;
  for (const k of STREAK_KINDS) {
    const s = st[k] as { current?: unknown; longest?: unknown; lastDay?: unknown } | undefined;
    const cur = typeof s?.current === "number" && s.current >= 0 ? Math.floor(s.current) : 0;
    const lon = typeof s?.longest === "number" && s.longest >= 0 ? Math.floor(s.longest) : 0;
    d.streaks[k] = {
      current: cur,
      longest: Math.max(lon, cur),
      lastDay: typeof s?.lastDay === "string" && isDay(s.lastDay) ? s.lastDay : "",
    };
  }
  const days = r.days as Record<string, unknown>;
  for (const [day, rec] of Object.entries(days)) {
    if (isDay(day) && isDayDeenLike(rec)) {
      const note =
        typeof rec.reflectionNote === "string"
          ? rec.reflectionNote.slice(0, DEEN_NOTE_MAX)
          : undefined;
      d.days[day] = { ...rec, ...(note === undefined ? {} : { reflectionNote: note }) };
    }
  }
  const cu = r.customs as { deeds?: unknown; rules?: unknown };
  for (const k of ["deeds", "rules"] as const) {
    const list = cu[k];
    if (Array.isArray(list)) {
      d.customs[k] = list
        .filter(
          (c) =>
            isObj(c) &&
            typeof c.id === "string" &&
            typeof c.label === "string" &&
            c.label.length > 0,
        )
        .map((c) => ({ id: (c as CustomItem).id, label: (c as CustomItem).label.slice(0, 80) }));
    }
  }
  const s = r.settings as Record<string, unknown>;
  for (const k of Object.keys(d.settings) as (keyof DeenSettings)[]) {
    d.settings[k] = (s[k] ?? true) === true;
  }
  d.returnCount =
    typeof r.returnCount === "number" && r.returnCount >= 0 ? Math.floor(r.returnCount) : 0;
  d.lastOpenDay = typeof r.lastOpenDay === "string" && isDay(r.lastOpenDay) ? r.lastOpenDay : "";
  return d;
}

// ---------- storage (existing seam only: loadFromStorage/saveToStorage) ----------

export function loadDeen(): DeenState {
  return normalizeDeen(loadFromStorage<unknown>(DEEN_KEY, null));
}

/** Prune old day records + cap the ledger, then persist. History that
 *  achievements depend on is never pruned while un-earned counts need
 *  it — earned achievements persist independently. */
export function saveDeen(s: DeenState): void {
  const clean = normalizeDeen(s);
  const cutoff = shiftDay(dayId(), -DEEN_RETENTION_DAYS);
  for (const day of Object.keys(clean.days)) {
    if (day < cutoff) delete clean.days[day];
  }
  saveToStorage(DEEN_KEY, clean);
}

/** Erase all deen data (explicit user action, confirmed in UI). */
export function resetDeen(): void {
  saveToStorage(DEEN_KEY, defaultDeen());
}

// ---------- day helpers (noon-anchored, DST-safe like private-plans) ----------

const dayMs = (d: string): number => Date.parse(`${d}T12:00:00`);
const msDay = (ms: number): string => dayId(new Date(ms));
const shiftDay = (d: string, n: number): string => msDay(dayMs(d) + n * 86400000);

/** Number of calendar days between two dayIds (device clock, documented). */
export function gapDays(a: string, b: string): number {
  if (!isDay(a) || !isDay(b)) return 0;
  return Math.round((dayMs(b) - dayMs(a)) / 86400000);
}

export function blankDay(day: string): DayDeen {
  return {
    day,
    salah: {},
    deeds: [],
    secretDeed: false,
    character: [],
    reduce: [],
    speech: {},
    reflectionDone: false,
    questsDone: [],
    chestOpened: false,
    minimumDay: false,
  };
}

export function dayOf(s: DeenState, day: string): DayDeen {
  return s.days[day] ?? blankDay(day);
}

function putDay(s: DeenState, rec: DayDeen): DeenState {
  return { ...s, days: { ...s.days, [rec.day]: rec } };
}

// ---------- XP ledger (single-award guarantee: §41 double-click proof) ----------

function grant(s: DeenState, key: string, xp: number): DeenState {
  if (xp <= 0 || s.awards.includes(key)) return s;
  return { ...s, xpTotal: s.xpTotal + xp, awards: [...s.awards, key].slice(-DEEN_AWARDS_CAP) };
}

export function hasAward(s: DeenState, key: string): boolean {
  return s.awards.includes(key);
}

// ---------- mutations (all pure: state in, new state out) ----------

export function setSalah(
  s: DeenState,
  day: string,
  prayer: PrayerId,
  mark: SalahMark | null,
): DeenState {
  const rec = { ...dayOf(s, day), salah: { ...dayOf(s, day).salah } };
  if (mark === null) delete rec.salah[prayer];
  else rec.salah[prayer] = mark;
  let next = putDay(s, rec);
  if (isSalahDayComplete(next, day)) next = grant(next, `salah:${day}`, XP.salahDay);
  return next;
}

/** A salah day counts as tracked when all five prayers hold any mark. */
export function isSalahDayComplete(s: DeenState, day: string): boolean {
  const marks = dayOf(s, day).salah;
  return PRAYERS.every((p) => marks[p] !== undefined);
}

export function toggleDeed(s: DeenState, day: string, deedId: string): DeenState {
  const cur = dayOf(s, day);
  const has = cur.deeds.includes(deedId);
  const rec = {
    ...cur,
    deeds: has ? cur.deeds.filter((d) => d !== deedId) : [...cur.deeds, deedId],
  };
  let next = putDay(s, rec);
  // Un-completing never revokes XP (no punishment mechanics, ADR-007);
  // re-completing never double-awards (ledger).
  if (!has) next = grant(next, `deed:${deedId}:${day}`, XP.deed);
  return next;
}

export function markSecretDeed(s: DeenState, day: string): DeenState {
  const cur = dayOf(s, day);
  if (cur.secretDeed) return s;
  let next = putDay(s, { ...cur, secretDeed: true });
  next = grant(next, `secret:${day}`, XP.secretDeed);
  return next;
}

export function toggleCharacter(s: DeenState, day: string, itemId: string): DeenState {
  const cur = dayOf(s, day);
  const has = cur.character.includes(itemId);
  const rec = {
    ...cur,
    character: has ? cur.character.filter((c) => c !== itemId) : [...cur.character, itemId],
  };
  return putDay(s, rec);
}

/** Toggle a "things to reduce" item for today (personal tracking, §10). */
export function toggleReduce(s: DeenState, day: string, itemId: string): DeenState {
  const cur = dayOf(s, day);
  const has = cur.reduce.includes(itemId);
  const rec = {
    ...cur,
    reduce: has ? cur.reduce.filter((c) => c !== itemId) : [...cur.reduce, itemId],
  };
  return putDay(s, rec);
}

export function setSpeech(
  s: DeenState,
  day: string,
  itemId: string,
  check: SpeechCheck | null,
): DeenState {
  const cur = dayOf(s, day);
  const speech = { ...cur.speech };
  if (check === null) delete speech[itemId];
  else
    speech[itemId] = {
      answer: check.answer,
      ...(check.trigger ? { trigger: check.trigger.slice(0, DEEN_NOTE_MAX) } : {}),
      ...(check.next ? { next: check.next.slice(0, DEEN_NOTE_MAX) } : {}),
    };
  return putDay(s, { ...cur, speech });
}

export function setReflection(s: DeenState, day: string, done: boolean, note?: string): DeenState {
  const cur = dayOf(s, day);
  let next = putDay(s, {
    ...cur,
    reflectionDone: done,
    ...(note === undefined ? {} : { reflectionNote: note.slice(0, DEEN_NOTE_MAX) }),
  });
  if (done) next = grant(next, `reflect:${day}`, XP.reflection);
  return next;
}

export function openChest(s: DeenState, day: string): DeenState {
  const cur = dayOf(s, day);
  if (cur.chestOpened) return s;
  let next = putDay(s, { ...cur, chestOpened: true });
  next = grant(next, `chest:${day}`, XP.chest);
  return next;
}

export function setMinimumDay(s: DeenState, day: string, on: boolean): DeenState {
  const cur = dayOf(s, day);
  return putDay(s, { ...cur, minimumDay: on });
}

export function setLevel(s: DeenState, level: DeenLevel): DeenState {
  // Level changes tracking depth only — history is never touched (§46).
  return { ...s, level };
}

let questSeq = 0;
export function addQuest(
  s: DeenState,
  q: Pick<Quest, "templateId" | "kind" | "title" | "custom" | "difficulty" | "xp"> & {
    day?: string;
  },
): DeenState {
  questSeq += 1;
  const id = `u${Date.now().toString(36)}${questSeq}`;
  return {
    ...s,
    quests: [...s.quests, { ...q, id, state: "active" as QuestState }],
  };
}

export function setQuestState(s: DeenState, id: string, state: QuestState): DeenState {
  return { ...s, quests: s.quests.map((q) => (q.id === id ? { ...q, state } : q)) };
}

export function completeQuest(s: DeenState, id: string, day: string): DeenState {
  const q = s.quests.find((x) => x.id === id);
  if (!q || q.state === "done") return s;
  let next = setQuestState(s, id, "done");
  const rec = dayOf(next, day);
  if (!rec.questsDone.includes(id))
    next = putDay(next, { ...rec, questsDone: [...rec.questsDone, id] });
  next = grant(next, `quest:${id}:${day}`, q.xp);
  return next;
}

export function addCustom(s: DeenState, where: "deeds" | "rules", label: string): DeenState {
  const clean = label.trim().slice(0, 80);
  if (!clean) return s;
  questSeq += 1;
  return {
    ...s,
    customs: {
      ...s.customs,
      [where]: [
        ...s.customs[where],
        { id: `c${Date.now().toString(36)}${questSeq}`, label: clean },
      ],
    },
  };
}

/** Session open: decay streaks on observed gaps, count returns (§30/§31). */
export function noteOpen(s: DeenState, today: string): DeenState {
  if (!isDay(today)) return s;
  if (!s.lastOpenDay) return { ...s, lastOpenDay: today };
  if (s.lastOpenDay === today) return s;
  const gap = gapDays(s.lastOpenDay, today);
  let next: DeenState = { ...s, lastOpenDay: today };
  if (gap <= 0) return next;
  // Continuity into today is what keeps a streak honest: only a record
  // on yesterday (or today) preserves the run. Older records in the gap
  // are history, not continuity — counts reset, longest stays.
  const covered = Boolean(next.days[shiftDay(today, -1)]) || Boolean(next.days[today]);
  if (!covered) {
    const streaks = { ...next.streaks };
    for (const k of STREAK_KINDS) {
      const r = streaks[k];
      streaks[k] = { current: 0, longest: Math.max(r.longest, r.current), lastDay: r.lastDay };
    }
    next = { ...next, streaks };
  }
  if (gap >= 3) next = { ...next, returnCount: next.returnCount + 1 };
  return next;
}

/** Award return XP once per return day (welcome-back, §31). */
export function grantReturnXp(s: DeenState, today: string): DeenState {
  return grant(s, `return:${today}`, XP.returned);
}

/** Recompute streaks from recorded days (pure; UI persists via saveDeen). */
export function rollStreaks(s: DeenState, today: string): DeenState {
  const active = (kind: StreakKind, day: string): boolean => {
    const rec = s.days[day];
    if (!rec) return false;
    switch (kind) {
      case "salah":
        return PRAYERS.every((p) => rec.salah[p] !== undefined);
      case "quran":
        return (
          rec.deeds.includes("deed.quran-read") ||
          rec.questsDone.some((id) => questTitleHas(s, id, "q.read-quran"))
        );
      case "reflection":
        return rec.reflectionDone;
      case "deed":
        return rec.deeds.length > 0 || rec.secretDeed;
      case "habit":
        return (
          rec.character.length > 0 || Object.keys(rec.speech).length > 0 || rec.reduce.length > 0
        );
    }
  };
  const streaks = { ...s.streaks };
  for (const kind of STREAK_KINDS) {
    const prev = s.streaks[kind];
    if (active(kind, today)) {
      const cont =
        prev.lastDay === shiftDay(today, -1) || (prev.current > 0 && prev.lastDay === today);
      const current = cont ? (prev.lastDay === today ? prev.current : prev.current + 1) : 1;
      streaks[kind] = { current, longest: Math.max(prev.longest, current), lastDay: today };
    }
  }
  return { ...s, streaks };
}

function questTitleHas(s: DeenState, questId: string, templateId: string): boolean {
  return s.quests.some((q) => q.id === questId && q.templateId === templateId);
}

/** Seed today's quests from templates (idempotent per day). */
export function seedDailyQuests(
  s: DeenState,
  today: string,
  t: (key: string) => string,
): DeenState {
  if (s.quests.some((q) => q.kind === "daily" && q.day === today)) return s;
  let next = s;
  for (const tpl of QUESTS.filter((q) => q.difficulty === "easy").slice(0, 3)) {
    next = addQuest(next, {
      templateId: tpl.id,
      kind: "daily",
      title: t(tpl.nameKey),
      custom: false,
      difficulty: tpl.difficulty,
      xp: tpl.xp,
      day: today,
    });
  }
  return next;
}

/** Evaluate achievements from recorded history (pure; returns new state). */
export function evaluateAchievements(s: DeenState, today: string): DeenState {
  const earn = (id: AchievementId): boolean => !(id in s.achievements);
  const days = Object.values(s.days);
  const next = { ...s, achievements: { ...s.achievements } };
  if (earn("first-step") && days.length > 0) next.achievements["first-step"] = today;
  if (earn("returned") && s.returnCount > 0) next.achievements["returned"] = today;
  if (earn("consistent") && STREAK_KINDS.some((k) => s.streaks[k].current >= 7)) {
    next.achievements["consistent"] = today;
  }
  if (earn("reflected") && days.filter((d) => d.reflectionDone).length >= 10) {
    next.achievements["reflected"] = today;
  }
  if (
    earn("helpful") &&
    days.reduce((n, d) => n + d.deeds.length + (d.secretDeed ? 1 : 0), 0) >= 10
  ) {
    next.achievements["helpful"] = today;
  }
  const learnDone = s.quests.filter((q) => q.kind === "learning" && q.state === "done").length;
  if (earn("learner") && learnDone >= 10) next.achievements["learner"] = today;
  const ruleDays = new Set<string>();
  for (const d of days) {
    for (const c of d.character) {
      if (c.startsWith("rule:")) ruleDays.add(`${c}@${d.day}`);
    }
  }
  if (earn("disciplined") && ruleDays.size >= 7) next.achievements["disciplined"] = today;
  return next;
}

/** Deen combo: how many of today's five activity areas are present (§28). */
export function comboOf(s: DeenState, day: string): { count: number; areas: string[] } {
  const rec = dayOf(s, day);
  const areas: string[] = [];
  if (isSalahDayComplete(s, day)) areas.push("salah");
  if (rec.deeds.includes("deed.quran-read")) areas.push("quran");
  if (rec.deeds.length > 0 || rec.secretDeed) areas.push("deed");
  if (rec.character.length > 0) areas.push("character");
  if (rec.reflectionDone) areas.push("reflection");
  return { count: areas.length, areas };
}

/** Separate tracked-behavior metrics for display (never a faith score, §44). */
export function behaviorMetrics(s: DeenState): {
  salahConsistency: number;
  quranConsistency: number;
  questProgress: number;
  reflectionConsistency: number;
  goalProgress: number;
} {
  const days = Object.values(s.days)
    .sort((a, b) => (a.day < b.day ? -1 : 1))
    .slice(-30);
  const rate = (f: (d: DayDeen) => boolean): number =>
    days.length === 0 ? 0 : Math.round((days.filter(f).length / days.length) * 100);
  const quests = s.quests.filter((q) => q.state !== "skipped");
  return {
    salahConsistency: rate((d) => PRAYERS.every((p) => d.salah[p] !== undefined)),
    quranConsistency: rate((d) => d.deeds.includes("deed.quran-read")),
    questProgress:
      quests.length === 0
        ? 0
        : Math.round((quests.filter((q) => q.state === "done").length / quests.length) * 100),
    reflectionConsistency: rate((d) => d.reflectionDone),
    goalProgress: rate((d) => d.character.length > 0 || d.deeds.length > 0),
  };
}
