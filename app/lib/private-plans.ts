// Private self-management plans (STEP 4): optional, local-only plans for
// working on a behavior the user personally finds hard to control — or any
// ordinary personal goal. No diagnosis, no cloud, no analytics SDK, no
// surveillance: pure functions over per-profile localStorage. Language is
// neutral by contract: a setback restarts the current run and NEVER erases
// history. See docs/features/private-recovery.md for the full contract.
import { dayId, diffDays, loadFromStorage, saveToStorage } from "./wird";

export const PRIVATE_PLANS_KEY = "wird-recovery-plans-v1";
export const PRIVATE_PLANS_EXCLUDE_KEY = "wird-private-plans-excluded-v1";

/** Dated detail records older than this are pruned on save (setback days stay forever). */
export const PRIVATE_PLAN_RETENTION_DAYS = 730;

export type PlanMode = "abstinence" | "reduction" | "time-limit";

export type Replacement = { id: string; label: string; forTrigger?: string };
export type StrategyUse = { day: string; strategy: string; helped: boolean | null };
export type TriggerUse = { day: string; trigger: string };
export type UsageLog = { day: string; minutes: number };
export type Checkin = { day: string; note?: string };
export type SetbackMeta = { trigger?: string; note?: string; next?: string };

export type PrivatePlan = {
  id: string;
  name: string;
  category?: string;
  mode: PlanMode;
  startDay: string;
  discreet: boolean;
  reminder: boolean;
  reasons: string[];
  triggers: string[];
  replacements: Replacement[];
  milestones: number[];
  dailyMinutes?: number;
  weeklyMinutes?: number;
  setbacks: string[];
  setbackMeta: Record<string, SetbackMeta>;
  checkins: Checkin[];
  usage: UsageLog[];
  triggerUses: TriggerUse[];
  strategyUses: StrategyUse[];
  trustedPerson?: string;
  islamicSupport: boolean;
  createdAt: number;
};

export const DEFAULT_MILESTONES = [1, 3, 7, 14, 30, 60, 90];

// ---------- day helpers (noon-anchored so DST shifts can't drift a day) ----------

const dayMs = (d: string): number => Date.parse(`${d}T12:00:00`);
const msDay = (ms: number): string => dayId(new Date(ms));
const isDay = (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
const shiftDayId = (d: string, n: number): string => msDay(dayMs(d) + n * 86400000);
const nextDay = (d: string): string => shiftDayId(d, 1);

// ---------- construction / validation ----------

export function newPlanId(): string {
  return `pp-${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function planLetter(index: number): string {
  const base = String.fromCharCode(65 + (Math.max(0, index) % 26));
  return index >= 26 ? `${base}${Math.floor(index / 26) + 1}` : base;
}

export function newPrivatePlan(input: {
  name?: string;
  category?: string;
  mode: PlanMode;
  startDay?: string;
}): PrivatePlan {
  const start = isDay(input.startDay) ? input.startDay : dayId();
  return {
    id: newPlanId(),
    name: (input.name ?? "").trim(),
    category: (input.category ?? "").trim() || undefined,
    mode: input.mode,
    startDay: start,
    discreet: true,
    reminder: false,
    reasons: [],
    triggers: [],
    replacements: [],
    milestones: [...DEFAULT_MILESTONES],
    setbacks: [],
    setbackMeta: {},
    checkins: [],
    usage: [],
    triggerUses: [],
    strategyUses: [],
    trustedPerson: undefined,
    islamicSupport: false,
    createdAt: Date.now(),
  };
}

const isStrArr = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

/** Structural check for one plan (schema.ts keeps its own copy — R2 forbids importing this file there). */
export function isPrivatePlanLike(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    (p.mode === "abstinence" || p.mode === "reduction" || p.mode === "time-limit") &&
    isDay(p.startDay) &&
    Array.isArray(p.setbacks)
  );
}

/** Fill defaults for missing optional fields (storage may predate them). */
export function normalizePrivatePlan(v: unknown): PrivatePlan | null {
  if (!isPrivatePlanLike(v)) return null;
  const p = v as Partial<PrivatePlan> & {
    id: string;
    name: string;
    mode: PlanMode;
    startDay: string;
  };
  const strArr = (x: unknown): string[] => (isStrArr(x) ? [...new Set(x)].slice(0, 200) : []);
  return {
    id: p.id,
    name: p.name,
    category: typeof p.category === "string" && p.category ? p.category : undefined,
    mode: p.mode,
    startDay: p.startDay,
    discreet: p.discreet !== false,
    reminder: p.reminder === true,
    reasons: strArr(p.reasons).slice(0, 50),
    triggers: strArr(p.triggers).slice(0, 100),
    replacements: Array.isArray(p.replacements)
      ? p.replacements
          .filter((r) => r && typeof (r as Replacement).label === "string")
          .slice(0, 100)
          .map((r) => ({
            id: typeof (r as Replacement).id === "string" ? (r as Replacement).id : newPlanId(),
            label: (r as Replacement).label.slice(0, 200),
            forTrigger:
              typeof (r as Replacement).forTrigger === "string"
                ? (r as Replacement).forTrigger
                : undefined,
          }))
      : [],
    milestones:
      Array.isArray(p.milestones) && p.milestones.length > 0
        ? [...new Set(p.milestones.filter((m) => Number.isInteger(m) && m > 0 && m <= 3650))].sort(
            (a, b) => (a as number) - (b as number),
          )
        : [...DEFAULT_MILESTONES],
    dailyMinutes:
      typeof p.dailyMinutes === "number" && p.dailyMinutes > 0
        ? Math.min(1440, Math.floor(p.dailyMinutes))
        : undefined,
    weeklyMinutes:
      typeof p.weeklyMinutes === "number" && p.weeklyMinutes > 0
        ? Math.min(10080, Math.floor(p.weeklyMinutes))
        : undefined,
    setbacks: [...new Set((p.setbacks as string[]).filter(isDay))].sort().slice(-5000),
    setbackMeta:
      p.setbackMeta && typeof p.setbackMeta === "object"
        ? (p.setbackMeta as Record<string, SetbackMeta>)
        : {},
    checkins: Array.isArray(p.checkins)
      ? p.checkins.filter((c) => c && isDay((c as Checkin).day)).slice(-5000)
      : [],
    usage: Array.isArray(p.usage)
      ? p.usage.filter((u) => u && isDay((u as UsageLog).day)).slice(-5000)
      : [],
    triggerUses: Array.isArray(p.triggerUses)
      ? p.triggerUses.filter((t) => t && isDay((t as TriggerUse).day)).slice(-5000)
      : [],
    strategyUses: Array.isArray(p.strategyUses)
      ? p.strategyUses.filter((s) => s && isDay((s as StrategyUse).day)).slice(-5000)
      : [],
    trustedPerson:
      typeof p.trustedPerson === "string" && p.trustedPerson
        ? p.trustedPerson.slice(0, 200)
        : undefined,
    islamicSupport: p.islamicSupport === true,
    createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
  };
}

// ---------- runs / history (setbacks split time; nothing is ever deleted by a reset) ----------

/** Distinct setback days within [startDay, today], oldest first. */
export function setbacksInRange(plan: PrivatePlan, today: string): string[] {
  return [...new Set(plan.setbacks)]
    .filter((s) => isDay(s) && s >= plan.startDay && s <= today)
    .sort();
}

/** Current run length in days. A setback recorded today restarts the run (0). */
export function currentRunDays(plan: PrivatePlan, today: string): number {
  const sb = setbacksInRange(plan, today);
  const last = sb[sb.length - 1];
  if (last === today) return 0;
  const start = last && last >= plan.startDay ? nextDay(last) : plan.startDay;
  if (!isDay(today) || start > today) return 0;
  return diffDays(start, today) + 1;
}

export type RunSegment = { start: string; end: string; days: number; current: boolean };

/** Chronological run segments; the trailing open segment is flagged current. */
export function runSegments(plan: PrivatePlan, today: string): RunSegment[] {
  const cuts = setbacksInRange(plan, today);
  const segs: RunSegment[] = [];
  let cur = plan.startDay;
  for (const s of cuts) {
    if (s < cur) continue;
    if (s > cur)
      segs.push({
        start: cur,
        end: shiftDayId(s, -1),
        days: diffDays(cur, shiftDayId(s, -1)) + 1,
        current: false,
      });
    cur = nextDay(s);
    if (cur > today) break;
  }
  if (cur <= today && isDay(today))
    segs.push({ start: cur, end: today, days: diffDays(cur, today) + 1, current: true });
  return segs;
}

export function longestRunDays(plan: PrivatePlan, today: string): number {
  const lens = runSegments(plan, today).map((s) => s.days);
  return lens.length ? Math.max(...lens) : 0;
}

export function averageRunDays(plan: PrivatePlan, today: string): number {
  const done = runSegments(plan, today).filter((s) => !s.current);
  if (!done.length) return currentRunDays(plan, today);
  return Math.round((done.reduce((a, s) => a + s.days, 0) / done.length) * 10) / 10;
}

/** Days without a recorded setback since the plan started (generous, neutral). */
export function totalSuccessfulDays(plan: PrivatePlan, today: string): number {
  if (!isDay(today) || plan.startDay > today) return 0;
  const elapsed = diffDays(plan.startDay, today) + 1;
  return Math.max(0, elapsed - setbacksInRange(plan, today).length);
}

export function attemptCount(plan: PrivatePlan, today: string): number {
  return setbacksInRange(plan, today).length + 1;
}

/** Mean gap in days between consecutive setbacks; null when fewer than two. */
export function averageSetbackGap(plan: PrivatePlan, today: string): number | null {
  const sb = setbacksInRange(plan, today);
  if (sb.length < 2) return null;
  let sum = 0;
  for (let i = 1; i < sb.length; i++) sum += diffDays(sb[i - 1] ?? "", sb[i] ?? "");
  return Math.round((sum / (sb.length - 1)) * 10) / 10;
}

export type TimelineEntry =
  | { type: "start"; day: string }
  | { type: "run"; start: string; end: string; days: number; current: boolean }
  | { type: "setback"; day: string };

/** Whole journey, oldest first: start → runs → setbacks → current run. */
export function planTimeline(plan: PrivatePlan, today: string, limit = 120): TimelineEntry[] {
  const out: TimelineEntry[] = [{ type: "start", day: plan.startDay }];
  for (const s of runSegments(plan, today))
    out.push({ type: "run", start: s.start, end: s.end, days: s.days, current: s.current });
  for (const s of setbacksInRange(plan, today)) out.push({ type: "setback", day: s });
  out.sort((a, b) => {
    const da = a.type === "run" ? a.start : a.day;
    const db = b.type === "run" ? b.start : b.day;
    if (da !== db) return da < db ? -1 : 1;
    const rank = { start: 0, setback: 1, run: 2 };
    return rank[a.type] - rank[b.type];
  });
  return out.slice(-limit);
}

// ---------- triggers / strategies (observations from the user's own records) ----------

export function triggerStats(plan: PrivatePlan): Array<{ trigger: string; count: number }> {
  const m = new Map<string, number>();
  for (const t of plan.triggerUses) {
    if (!t.trigger) continue;
    m.set(t.trigger, (m.get(t.trigger) ?? 0) + 1);
  }
  for (const [day, meta] of Object.entries(plan.setbackMeta)) {
    if (isDay(day) && meta.trigger) m.set(meta.trigger, (m.get(meta.trigger) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count);
}

export function strategyStats(
  plan: PrivatePlan,
): Array<{ strategy: string; uses: number; helped: number }> {
  const m = new Map<string, { uses: number; helped: number }>();
  for (const s of plan.strategyUses) {
    if (!s.strategy) continue;
    const e = m.get(s.strategy) ?? { uses: 0, helped: 0 };
    e.uses++;
    if (s.helped === true) e.helped++;
    m.set(s.strategy, e);
  }
  return [...m.entries()]
    .map(([strategy, v]) => ({ strategy, ...v }))
    .sort((a, b) => b.uses - a.uses);
}

// ---------- milestones / check-ins / usage ----------

export function milestonesReached(
  plan: PrivatePlan,
  today: string,
): { reached: number[]; next: number | null } {
  const cur = currentRunDays(plan, today);
  const sorted = [...plan.milestones].sort((a, b) => a - b);
  return { reached: sorted.filter((m) => m <= cur), next: sorted.find((m) => m > cur) ?? null };
}

export function checkedInToday(plan: PrivatePlan, today: string): boolean {
  return plan.checkins.some((c) => c.day === today);
}

export function usageOnDay(plan: PrivatePlan, day: string): number {
  return plan.usage
    .filter((u) => u.day === day)
    .reduce((a, u) => a + Math.max(0, u.minutes || 0), 0);
}

export function usageLast7(
  plan: PrivatePlan,
  today: string,
): Array<{ day: string; minutes: number }> {
  const out: Array<{ day: string; minutes: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = shiftDayId(today, -i);
    out.push({ day: d, minutes: d <= today ? usageOnDay(plan, d) : 0 });
  }
  return out;
}

// ---------- mutations (always return a new plan; callers persist) ----------

export function recordCheckin(plan: PrivatePlan, day: string, note?: string): PrivatePlan {
  if (!isDay(day)) return plan;
  const rest = plan.checkins.filter((c) => c.day !== day);
  const clean = (note ?? "").trim().slice(0, 500);
  return { ...plan, checkins: [...rest, clean ? { day, note: clean } : { day }] };
}

export function recordSetback(
  plan: PrivatePlan,
  day: string,
  meta?: { trigger?: string; note?: string; next?: string },
): PrivatePlan {
  if (!isDay(day)) return plan;
  const setbacks = [...new Set([...plan.setbacks, day])].sort();
  const cleanMeta: SetbackMeta = {};
  const trig = (meta?.trigger ?? "").trim().slice(0, 200);
  const note = (meta?.note ?? "").trim().slice(0, 500);
  const next = (meta?.next ?? "").trim().slice(0, 500);
  if (trig) cleanMeta.trigger = trig;
  if (note) cleanMeta.note = note;
  if (next) cleanMeta.next = next;
  const setbackMeta = { ...plan.setbackMeta };
  if (Object.keys(cleanMeta).length) setbackMeta[day] = cleanMeta;
  return { ...plan, setbacks, setbackMeta };
}

export function logUsage(plan: PrivatePlan, day: string, minutes: number): PrivatePlan {
  if (!isDay(day) || !Number.isFinite(minutes) || minutes <= 0) return plan;
  const mins = Math.min(1440, Math.floor(minutes));
  return { ...plan, usage: [...plan.usage, { day, minutes: mins }] };
}

export function logTrigger(plan: PrivatePlan, day: string, trigger: string): PrivatePlan {
  const t = trigger.trim().slice(0, 200);
  if (!isDay(day) || !t) return plan;
  return { ...plan, triggerUses: [...plan.triggerUses, { day, trigger: t }] };
}

export function logStrategy(
  plan: PrivatePlan,
  day: string,
  strategy: string,
  helped: boolean | null,
): PrivatePlan {
  const s = strategy.trim().slice(0, 200);
  if (!isDay(day) || !s) return plan;
  return { ...plan, strategyUses: [...plan.strategyUses, { day, strategy: s, helped }] };
}

/** Drop dated detail records older than the retention window (setback days are history — kept). */
export function prunePlan(plan: PrivatePlan, today: string): PrivatePlan {
  if (!isDay(today)) return plan;
  const cutoff = shiftDayId(today, -PRIVATE_PLAN_RETENTION_DAYS);
  const meta: Record<string, SetbackMeta> = {};
  for (const [d, m] of Object.entries(plan.setbackMeta)) if (d >= cutoff) meta[d] = m;
  return {
    ...plan,
    checkins: plan.checkins.filter((c) => c.day >= cutoff),
    usage: plan.usage.filter((u) => u.day >= cutoff),
    triggerUses: plan.triggerUses.filter((t) => t.day >= cutoff),
    strategyUses: plan.strategyUses.filter((s) => s.day >= cutoff),
    setbackMeta: meta,
  };
}

// ---------- storage (per-profile via loadFromStorage; exclusion flag is device-global) ----------

export function loadPrivatePlans(): PrivatePlan[] {
  const raw = loadFromStorage<unknown>(PRIVATE_PLANS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizePrivatePlan)
    .filter((p): p is PrivatePlan => p !== null)
    .slice(0, 50);
}

export function savePrivatePlans(plans: PrivatePlan[]): void {
  const today = dayId();
  saveToStorage(PRIVATE_PLANS_KEY, plans.map((p) => prunePlan(p, today)).slice(0, 50));
}

export function loadExcludeFlag(): boolean {
  return loadFromStorage<boolean>(PRIVATE_PLANS_EXCLUDE_KEY, false) === true;
}

export function saveExcludeFlag(excluded: boolean): void {
  saveToStorage(PRIVATE_PLANS_EXCLUDE_KEY, excluded === true);
}

/** True when the stored key holds private-plan data (global or per-profile form). */
export function isPrivatePlansKey(storedKey: string): boolean {
  return storedKey === PRIVATE_PLANS_KEY || storedKey.endsWith(`_${PRIVATE_PLANS_KEY}`);
}

function unwrapStored(raw: string | null): unknown {
  if (raw == null) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "__wird" in parsed)
      return (parsed as { d?: unknown }).d;
    return parsed;
  } catch {
    return undefined;
  }
}

/** Any non-empty private-plan dataset on this device (any profile)? Used for the export warning. */
export function privatePlansPresent(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const st = window.localStorage;
    for (let i = 0; i < st.length; i++) {
      const k = st.key(i);
      if (!k || !isPrivatePlansKey(k)) continue;
      const v = unwrapStored(st.getItem(k));
      if (Array.isArray(v) && v.length > 0) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Whether backups/exports must skip private-plan datasets right now. */
export function privatePlansExcluded(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    return unwrapStored(window.localStorage.getItem(PRIVATE_PLANS_EXCLUDE_KEY)) === true;
  } catch {
    return false;
  }
}
