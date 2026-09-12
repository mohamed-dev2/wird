// Adaptive Islamic companion engine (§2): a central, LOCAL, deterministic
// decision layer over existing Wird data. Pure functions only — no storage,
// no network, no AI. Components assemble inputs, memoize assessUser(), and
// render at most ONE guidance card (never a wall of cards).
//
// Religious-safety contract (see also content.ts):
// - The engine observes only: completed / missed / recorded / returned /
//   tracked. It NEVER outputs claims about iman, sincerity, or divine judgment.
// - All user-facing copy lives in strings.ts (cm.*) in AR+EN; verse/hadith
//   content is resolved exclusively from verified local datasets.

import { lastNDays, type History } from "./history";
import { diffDays } from "./wird";

export type Theme =
  | "return"
  | "mercy"
  | "hope"
  | "patience"
  | "consistency"
  | "remembrance"
  | "gratitude"
  | "intention"
  | "difficult"
  | "new"
  | "ramadan"
  | "friday"
  | "night"
  | "morning"
  | "evening";

export type UserState =
  | "FIRST_USE"
  | "NEW_USER"
  | "FIRST_WEEK"
  | "ACTIVE"
  | "CONSISTENT"
  | "STRONG_MOMENTUM"
  | "IMPROVING"
  | "SLIPPING"
  | "STRUGGLING"
  | "QUIET_PERIOD"
  | "ABSENT_SHORT"
  | "ABSENT_MED"
  | "ABSENT_LONG"
  | "ABSENT_VERY_LONG"
  | "RETURNING"
  | "REBUILDING"
  | "STRONG_RETURN"
  | "REPEATED_RESTART"
  | "OVERLOADED"
  | "CHALLENGE_MILESTONE"
  | "STRONG_DAY"
  | "LOW_DAY"
  | "RECOVERY_DAY"
  | "FRIDAY"
  | "RAMADAN"
  | "POST_RAMADAN";

export type Confidence = "high" | "medium" | "low";

export type GuideAction =
  "rescue" | "review" | "core" | "intention" | "tawbah" | "quran" | "friday" | "none";

export type CompanionInput = {
  today: string;
  hour: number;
  isFriday: boolean;
  ramadan: boolean;
  hijriMonth: number | null;
  history: History;
  doneToday: string[];
  totalToday: number;
  lastSeen: string | null;
  createdDay: string | null;
  commitments: number;
  deedIds: string[];
  challengesDone: { id: string; title: string }[];
  recentMoods: ("good" | "ok" | "low" | null)[];
  gratitudeRecent: boolean;
  hasKids: boolean;
};

export type Metrics = {
  activeDays: number;
  spanDays: number;
  absentDays: number;
  appAbsentDays: number;
  adher7: number;
  adherPrev7: number;
  adher14: number;
  todayRatio: number;
  consecActive: number;
  restarts60: number;
  topDeedId: string | null;
};

export type Assessment = {
  states: UserState[];
  primary: UserState;
  m: Metrics;
  overlays: { friday: boolean; ramadan: boolean };
};

function activeSet(history: History): Set<string> {
  const s = new Set<string>();
  for (const [day, rec] of Object.entries(history)) {
    if (rec && Array.isArray(rec.ids) && rec.ids.length > 0) s.add(day);
  }
  return s;
}

function shiftDay(dayId: string, delta: number): string {
  const ms = Date.parse(`${dayId}T12:00:00Z`) + delta * 86400000;
  return Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : dayId;
}

function activeRatio(history: History, endDay: string, days: number): number {
  if (days <= 0) return 0;
  const win = lastNDays(history, days, endDay);
  return win.filter((d) => d.ids.length > 0).length / days;
}

/** Consecutive active days ending endDay (today included if active). */
function consecActive(history: History, endDay: string): number {
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const rec = history[shiftDay(endDay, -i)];
    if (rec && rec.ids.length > 0) n++;
    else break;
  }
  return n;
}

/** Idle days between the current active run and older activity (0 = none older). */
function gapBeforeStreak(history: History, endDay: string): number {
  let i = 0;
  while (i < 400) {
    const rec = history[shiftDay(endDay, -i)];
    if (rec && rec.ids.length > 0) i++;
    else break;
  }
  let gap = 0;
  let older = false;
  while (i < 400) {
    const rec = history[shiftDay(endDay, -i)];
    if (rec && rec.ids.length > 0) {
      older = true;
      break;
    }
    gap++;
    i++;
  }
  return older ? gap : 0;
}

/** Absence→return cycles (gap ≥3d then activity) inside the last 60 days. */
function countRestarts(history: History, endDay: string): number {
  let gaps = 0;
  let idle = 0;
  let seenActive = false;
  for (let i = 1; i <= 60; i++) {
    const rec = history[shiftDay(endDay, -i)];
    const active = !!rec && rec.ids.length > 0;
    if (active) {
      if (idle >= 3 && seenActive) gaps++;
      idle = 0;
      seenActive = true;
    } else {
      idle++;
    }
  }
  return gaps;
}

function topDeed(history: History, deedIds: string[], endDay: string): string | null {
  const counts = new Map<string, number>();
  for (const d of lastNDays(history, 30, endDay)) {
    for (const id of d.ids) {
      if (deedIds.includes(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [id, n] of counts) {
    if (n > bestN) {
      bestN = n;
      best = id;
    }
  }
  return bestN >= 3 ? best : null;
}

export function assessUser(inp: CompanionInput): Assessment {
  const act = activeSet(inp.history);
  const activeDays = act.size;
  const days = [...act].sort();
  const firstDay = days[0] ?? null;
  const lastActive = days[days.length - 1] ?? null;
  const spanDays = firstDay ? diffDays(firstDay, inp.today) + 1 : 0;
  // Activity gap (history owns the past). App absence (last open) drives the
  // return screens and stays stable for the whole session; history-derived
  // gap drives trend states.
  const absentDays = lastActive ? diffDays(lastActive, inp.today) : 0;
  const appAbsent = inp.lastSeen ? diffDays(inp.lastSeen, inp.today) : absentDays;
  const adher7 = activeRatio(inp.history, inp.today, 7);
  const prevEnd = shiftDay(inp.today, -7);
  const adherPrev7 = activeRatio(inp.history, prevEnd, 7);
  const adher14 = activeRatio(inp.history, inp.today, 14);
  const todayRatio = inp.totalToday > 0 ? inp.doneToday.length / inp.totalToday : 0;
  const consec = consecActive(inp.history, inp.today);
  const restarts = countRestarts(inp.history, inp.today);
  const states = new Set<UserState>();

  if (activeDays === 0) {
    states.add("FIRST_USE");
  } else if (spanDays <= 3) {
    states.add("NEW_USER");
  }
  if (spanDays >= 7 && spanDays <= 9 && activeDays >= 4) states.add("FIRST_WEEK");
  if (inp.challengesDone.length > 0) states.add("CHALLENGE_MILESTONE");

  if (appAbsent >= 61) states.add("ABSENT_VERY_LONG");
  else if (appAbsent >= 21) states.add("ABSENT_LONG");
  else if (appAbsent >= 7) states.add("ABSENT_MED");
  else if (appAbsent >= 3) states.add("ABSENT_SHORT");

  const back = appAbsent >= 3 && inp.doneToday.length > 0;
  const gapBefore = gapBeforeStreak(inp.history, inp.today);
  if (back && consec <= 1) states.add("RETURNING");
  if (gapBefore >= 7 && consec >= 2 && consec <= 5) states.add("REBUILDING");
  if (gapBefore >= 7 && consec >= 3 && activeRatio(inp.history, inp.today, consec) >= 0.75) {
    states.add("STRONG_RETURN");
  }
  if (gapBefore >= 14 && inp.doneToday.length > 0 && todayRatio >= 0.6) {
    states.add("STRONG_RETURN");
  }
  if (restarts >= 2) states.add("REPEATED_RESTART");

  if (activeDays >= 14 && adher14 >= 0.8) states.add("STRONG_MOMENTUM");
  else if (activeDays >= 7 && adher7 >= 0.71) states.add("CONSISTENT");
  if (adherPrev7 >= 0 && adher7 - adherPrev7 >= 0.2 && adher7 >= 0.4 && activeDays >= 4) {
    states.add("IMPROVING");
  }
  if (adherPrev7 >= 0.5 && adherPrev7 - adher7 >= 0.25) states.add("SLIPPING");
  if (adher7 < 0.3 && activeDays >= 7 && absentDays < 3) states.add("STRUGGLING");
  // Opened the app midday but logged nothing, while usually active: the
  // gentler alternative to LOW_DAY for established users (no percentages).
  if (
    absentDays < 3 &&
    activeDays >= 3 &&
    inp.doneToday.length === 0 &&
    inp.hour >= 12 &&
    adher7 >= 0.5
  ) {
    states.add("QUIET_PERIOD");
  }

  if (inp.totalToday >= 5 && inp.doneToday.length >= 4 && todayRatio >= 0.8) {
    states.add("STRONG_DAY");
  }
  // A "bad day" is only meaningful with an established baseline — never
  // greet a brand-new user with "today didn't go as planned".
  if (
    inp.totalToday >= 4 &&
    todayRatio <= 0.35 &&
    inp.hour >= 12 &&
    activeDays >= 1 &&
    spanDays > 3
  ) {
    states.add("LOW_DAY");
  }
  const yest = inp.history[shiftDay(inp.today, -1)];
  if (yest && inp.totalToday > 0 && yest.ids.length / inp.totalToday < 0.4 && todayRatio >= 0.6) {
    states.add("RECOVERY_DAY");
  }

  if (inp.commitments >= 16 && adher7 < 0.4 && activeDays >= 5) states.add("OVERLOADED");

  // Post-Ramadan drop: Shawwal + a strong recent window + quiet week.
  let postRamadan = false;
  if (inp.hijriMonth === 10 && adher7 < 0.4) {
    for (let back = 7; back <= 53; back++) {
      if (activeRatio(inp.history, shiftDay(inp.today, -back), 7) >= 0.7) {
        postRamadan = true;
        break;
      }
    }
  }
  if (postRamadan) states.add("POST_RAMADAN");

  if (states.size === 0) states.add("ACTIVE");

  const order: UserState[] = [
    "STRONG_RETURN",
    "RETURNING",
    "ABSENT_VERY_LONG",
    "POST_RAMADAN",
    "ABSENT_LONG",
    "ABSENT_MED",
    "ABSENT_SHORT",
    "REBUILDING",
    "REPEATED_RESTART",
    "QUIET_PERIOD",
    "LOW_DAY",
    "STRONG_DAY",
    "RECOVERY_DAY",
    "CHALLENGE_MILESTONE",
    "FIRST_WEEK",
    "SLIPPING",
    "STRUGGLING",
    "IMPROVING",
    "STRONG_MOMENTUM",
    "CONSISTENT",
    "OVERLOADED",
    "NEW_USER",
    "FIRST_USE",
    "RAMADAN",
    "FRIDAY",
    "ACTIVE",
  ];
  let primary: UserState = "ACTIVE";
  for (const s of order) {
    if (states.has(s)) {
      primary = s;
      break;
    }
  }
  // Calendar overlays merge into the card instead of competing with it —
  // except when the day is otherwise ordinary, when they lead.
  const overlays = { friday: inp.isFriday, ramadan: inp.ramadan };
  if (primary === "ACTIVE" || primary === "QUIET_PERIOD") {
    if (inp.ramadan) primary = "RAMADAN";
    else if (inp.isFriday) primary = "FRIDAY";
  }

  return {
    states: [...states],
    primary,
    m: {
      activeDays,
      spanDays,
      absentDays,
      appAbsentDays: appAbsent,
      adher7,
      adherPrev7,
      adher14,
      todayRatio,
      consecActive: consec,
      restarts60: restarts,
      topDeedId: topDeed(inp.history, inp.deedIds, inp.today),
    },
    overlays,
  };
}

// ---------- guidance selection: rank, fatigue, rotate ----------

export type GuideLog = { kind: string; day: string }[];
export const GUIDE_LOG_KEY = "wird-guide-log-v1";
const GUIDE_LOG_MAX = 30;
const FATIGUE_DAYS = 3;

export function loadGuideLog(load: <T>(key: string, fallback: T) => T): GuideLog {
  try {
    const v = load<GuideLog>(GUIDE_LOG_KEY, []);
    return Array.isArray(v) ? v.filter((e) => e && typeof e.kind === "string") : [];
  } catch {
    return [];
  }
}

export function logGuidance(
  save: (key: string, value: unknown) => void,
  log: GuideLog,
  kind: string,
  day: string,
): GuideLog {
  const next = [...log.filter((e) => e.day !== day || e.kind !== kind), { kind, day }].slice(
    -GUIDE_LOG_MAX,
  );
  try {
    save(GUIDE_LOG_KEY, next);
  } catch {}
  return next;
}

function shownRecently(log: GuideLog, kind: string, today: string): boolean {
  for (const e of log) {
    if (e.kind === kind && diffDays(e.day, today) <= FATIGUE_DAYS) return true;
  }
  return false;
}

function shownEver(log: GuideLog, kind: string): boolean {
  return log.some((e) => e.kind === kind);
}

export type Guidance = {
  state: UserState;
  titleKey: string;
  bodyKey: string;
  vars: Record<string, string | number>;
  reasonKey: string | null;
  reasonVars: Record<string, string | number>;
  confidence: Confidence;
  action: GuideAction;
  theme: Theme;
  logKind: string;
  onceEver: boolean;
};

function conf(activeDays: number): Confidence {
  return activeDays >= 7 ? "high" : activeDays >= 3 ? "medium" : "low";
}

function pct(x: number): number {
  return Math.round(x * 100);
}

/**
 * Rank applicable states into ONE guidance. Returns null when the primary
 * was recently shown (fatigue) and nothing else qualifies — the UI then
 * shows no card at all rather than repeating itself.
 */
export function selectGuidance(
  a: Assessment,
  inp: CompanionInput,
  log: GuideLog,
  challenge?: { id: string; title: string },
): Guidance | null {
  const c = conf(a.m.activeDays);
  const mk = (
    state: UserState,
    theme: Theme,
    action: GuideAction,
    vars: Record<string, string | number> = {},
    reasonKey: string | null = null,
    reasonVars: Record<string, string | number> = {},
    onceEver = false,
  ): Guidance => ({
    state,
    titleKey: `cm.${state.toLowerCase()}.t`,
    bodyKey: `cm.${state.toLowerCase()}.b`,
    vars,
    reasonKey,
    reasonVars,
    confidence: c,
    action,
    theme,
    logKind: onceEver ? `once:${state}` : `state:${state}`,
    onceEver,
  });

  const candidates: Guidance[] = [];
  const has = (s: UserState) => a.states.includes(s);

  if (has("ABSENT_VERY_LONG"))
    candidates.push(
      mk("ABSENT_VERY_LONG", "return", "tawbah", { n: a.m.absentDays }, "cm.r.absent", {
        n: a.m.absentDays,
      }),
    );
  if (has("ABSENT_LONG"))
    candidates.push(
      mk("ABSENT_LONG", "return", "tawbah", { n: a.m.absentDays }, "cm.r.absent", {
        n: a.m.absentDays,
      }),
    );
  if (has("ABSENT_MED"))
    candidates.push(
      mk("ABSENT_MED", "mercy", "core", { n: a.m.absentDays }, "cm.r.absent", {
        n: a.m.absentDays,
      }),
    );
  if (has("ABSENT_SHORT"))
    candidates.push(
      mk("ABSENT_SHORT", "hope", "core", { n: a.m.absentDays }, "cm.r.absent", {
        n: a.m.absentDays,
      }),
    );
  if (has("STRONG_RETURN"))
    candidates.push(
      mk("STRONG_RETURN", "hope", "none", { n: a.m.consecActive }, "cm.r.comeback", {
        n: a.m.consecActive,
      }),
    );
  if (has("RETURNING"))
    candidates.push(
      mk("RETURNING", "return", "core", { n: a.m.absentDays }, "cm.r.absent", {
        n: a.m.absentDays,
      }),
    );
  if (has("REBUILDING"))
    candidates.push(
      mk("REBUILDING", "patience", "core", { n: a.m.consecActive }, "cm.r.rebuild", {
        n: a.m.consecActive,
      }),
    );
  if (has("REPEATED_RESTART"))
    candidates.push(
      mk("REPEATED_RESTART", "mercy", "core", { n: a.m.restarts60 }, "cm.r.restarts", {
        n: a.m.restarts60,
      }),
    );
  if (has("CHALLENGE_MILESTONE"))
    candidates.push({
      ...mk(
        "CHALLENGE_MILESTONE",
        "gratitude",
        "none",
        { title: challenge?.title ?? "" },
        "cm.r.milestone",
        {},
        true,
      ),
      // Per-challenge once-ever: each completed challenge is recognized once.
      logKind: `once:CHALLENGE_MILESTONE:${challenge?.id ?? "?"}`,
    });
  if (has("FIRST_WEEK"))
    candidates.push(
      mk(
        "FIRST_WEEK",
        "gratitude",
        "none",
        { n: a.m.activeDays },
        "cm.r.firstweek",
        { n: a.m.activeDays },
        true,
      ),
    );
  if (has("LOW_DAY"))
    candidates.push(
      mk("LOW_DAY", "difficult", "rescue", { pct: pct(a.m.todayRatio) }, "cm.r.today", {
        pct: pct(a.m.todayRatio),
      }),
    );
  if (has("STRONG_DAY"))
    candidates.push(
      mk("STRONG_DAY", "gratitude", "none", { pct: pct(a.m.todayRatio) }, "cm.r.today", {
        pct: pct(a.m.todayRatio),
      }),
    );
  if (has("RECOVERY_DAY"))
    candidates.push(mk("RECOVERY_DAY", "hope", "none", {}, "cm.r.recovery", {}));
  if (has("POST_RAMADAN"))
    candidates.push(mk("POST_RAMADAN", "mercy", "core", {}, "cm.r.postramadan", {}));
  if (has("SLIPPING"))
    candidates.push(
      mk(
        "SLIPPING",
        "patience",
        "core",
        { now: pct(a.m.adher7), prev: pct(a.m.adherPrev7) },
        "cm.r.slip",
        { now: pct(a.m.adher7), prev: pct(a.m.adherPrev7) },
      ),
    );
  if (has("STRUGGLING"))
    candidates.push(
      mk("STRUGGLING", "patience", "core", { pct: pct(a.m.adher7) }, "cm.r.week", {
        pct: pct(a.m.adher7),
      }),
    );
  if (has("IMPROVING"))
    candidates.push(
      mk(
        "IMPROVING",
        "hope",
        "none",
        { now: pct(a.m.adher7), prev: pct(a.m.adherPrev7) },
        "cm.r.improve",
        { now: pct(a.m.adher7), prev: pct(a.m.adherPrev7) },
      ),
    );
  if (has("STRONG_MOMENTUM"))
    candidates.push(
      mk("STRONG_MOMENTUM", "consistency", "none", { pct: pct(a.m.adher14) }, "cm.r.momentum", {
        pct: pct(a.m.adher14),
      }),
    );
  if (has("CONSISTENT"))
    candidates.push(
      mk("CONSISTENT", "consistency", "none", { pct: pct(a.m.adher7) }, "cm.r.week", {
        pct: pct(a.m.adher7),
      }),
    );
  if (has("OVERLOADED"))
    candidates.push(
      mk("OVERLOADED", "mercy", "core", { n: inp.commitments }, "cm.r.overload", {
        n: inp.commitments,
      }),
    );
  if (has("QUIET_PERIOD")) candidates.push(mk("QUIET_PERIOD", "hope", "rescue", {}, null, {}));
  if (has("NEW_USER"))
    candidates.push(mk("NEW_USER", "new", "intention", { n: a.m.activeDays }, null, {}, true));
  if (has("FIRST_USE")) candidates.push(mk("FIRST_USE", "new", "intention", {}, null, {}, true));
  if (has("RAMADAN")) candidates.push(mk("RAMADAN", "ramadan", "none", {}, null, {}));
  if (has("FRIDAY")) candidates.push(mk("FRIDAY", "friday", "friday", {}, null, {}));
  candidates.push(mk("ACTIVE", "remembrance", "none", {}, null, {}));

  // Respect ranking order: first candidate whose state matches the primary,
  // else the first ranked candidate. Fatigue: skip recently-shown kinds
  // (once-ever kinds skipped if ever shown).
  const rankOf = (s: UserState) =>
    [
      "STRONG_RETURN",
      "RETURNING",
      "ABSENT_VERY_LONG",
      "POST_RAMADAN",
      "ABSENT_LONG",
      "ABSENT_MED",
      "ABSENT_SHORT",
      "REBUILDING",
      "REPEATED_RESTART",
      "QUIET_PERIOD",
      "LOW_DAY",
      "STRONG_DAY",
      "RECOVERY_DAY",
      "CHALLENGE_MILESTONE",
      "FIRST_WEEK",
      "SLIPPING",
      "STRUGGLING",
      "IMPROVING",
      "STRONG_MOMENTUM",
      "CONSISTENT",
      "OVERLOADED",
      "NEW_USER",
      "FIRST_USE",
      "RAMADAN",
      "FRIDAY",
      "ACTIVE",
    ].indexOf(s);
  candidates.sort((x, y) => rankOf(x.state) - rankOf(y.state));

  // Low confidence: no specific claims — fall back to gentle generic states.
  const usable =
    c === "low"
      ? candidates.filter((g) =>
          [
            "RETURNING",
            "ABSENT_SHORT",
            "FIRST_USE",
            "NEW_USER",
            "ACTIVE",
            "FRIDAY",
            "RAMADAN",
          ].includes(g.state),
        )
      : candidates;

  for (const g of usable) {
    if (g.onceEver && shownEver(log, g.logKind)) continue;
    if (!g.onceEver && shownRecently(log, g.logKind, inp.today)) continue;
    return g;
  }
  return null;
}

/** Deterministic daily rotation index (varies by day, stable within a day). */
export function rotateIndex(today: string, salt: string, len: number): number {
  if (len <= 0) return 0;
  let h = 0;
  const s = `${today}:${salt}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % len;
}

/** Small sustainable core: most frequent deeds (user's own data only). */
export function coreDeeds(history: History, deedIds: string[], endDay: string): string[] {
  const counts = new Map<string, number>();
  for (const d of lastNDays(history, 30, endDay)) {
    for (const id of d.ids) {
      if (deedIds.includes(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);
}
