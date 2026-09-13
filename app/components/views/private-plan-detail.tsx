// Single private plan (STEP 4): shell + progress stats + daily check-in +
// neutral setback flow. Tracking tools live in private-plan-tracker.tsx,
// support/settings in private-plan-care.tsx — the split keeps the urgent
// 1-second timer ticks inside the timer card instead of re-rendering this
// whole tree. Shown only after the user explicitly opens the plan.
"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../lib/i18n";
import { dayId } from "../../lib/wird";
import {
  attemptCount,
  averageRunDays,
  averageSetbackGap,
  checkedInToday,
  currentRunDays,
  logStrategy,
  longestRunDays,
  milestonesReached,
  planLetter,
  planTimeline,
  recordCheckin,
  recordSetback,
  strategyStats,
  totalSuccessfulDays,
  triggerStats,
  usageLast7,
  usageOnDay,
  type PrivatePlan,
  type TimelineEntry,
} from "../../lib/private-plans";
import { PlanCare } from "./private-plan-care";
import { PlanTracker } from "./private-plan-tracker";

export type TFn = (k: string, v?: Record<string, string | number>) => string;
export type Mutate = (fn: (p: PrivatePlan) => PrivatePlan) => void;

/** All derived plan numbers, computed once per plan/day (not per render). */
export type PlanData = {
  cur: number;
  longest: number;
  average: number;
  total: number;
  setbackCount: number;
  gap: number | null;
  reached: number[];
  next: number | null;
  trigStats: Array<{ trigger: string; count: number }>;
  stratStats: Array<{ strategy: string; uses: number; helped: number }>;
  week: Array<{ day: string; minutes: number }>;
  todayMin: number;
  weekTotal: number;
  withinWeek: number | null;
  timeline: TimelineEntry[];
};

type Props = {
  plan: PrivatePlan;
  index: number;
  onBack: () => void;
  onChange: (next: PrivatePlan) => void;
  onDelete: () => void;
  onToggleReminder: () => void;
};

/** List-visible name: real name only when the user opted out of discreet mode. */
export function planDisplayName(t: TFn, plan: PrivatePlan, index: number): string {
  if (!plan.discreet && plan.name) return plan.name;
  return t("pp.defaultName", { l: planLetter(index) });
}

export function PrivatePlanDetail({
  plan,
  index,
  onBack,
  onChange,
  onDelete,
  onToggleReminder,
}: Props) {
  const t = useT();
  const router = useRouter();
  const today = dayId();
  const [msg, setMsg] = useState("");
  const [pendingStrategy, setPendingStrategy] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);
  const timerRef = useRef<HTMLDivElement>(null);

  const mutate: Mutate = (fn) => {
    try {
      onChange(fn(plan));
    } catch {
      setMsg(t("pp.saveFail"));
    }
  };
  const notify = (m: string) => setMsg(m);

  const answerStrategy = (helped: boolean) => {
    if (pendingStrategy) mutate((p) => logStrategy(p, today, pendingStrategy, helped));
    setPendingStrategy(null);
    setThanks(true);
  };

  const data: PlanData = useMemo(() => {
    const week = usageLast7(plan, today);
    return {
      cur: currentRunDays(plan, today),
      longest: longestRunDays(plan, today),
      average: averageRunDays(plan, today),
      total: totalSuccessfulDays(plan, today),
      setbackCount: attemptCount(plan, today) - 1,
      gap: averageSetbackGap(plan, today),
      reached: milestonesReached(plan, today).reached,
      next: milestonesReached(plan, today).next,
      trigStats: triggerStats(plan),
      stratStats: strategyStats(plan),
      week,
      todayMin: usageOnDay(plan, today),
      weekTotal: week.reduce((a, d) => a + d.minutes, 0),
      withinWeek:
        plan.dailyMinutes != null
          ? week.filter((d) => d.minutes <= (plan.dailyMinutes as number)).length
          : null,
      timeline: planTimeline(plan, today),
    };
  }, [plan, today]);

  const modeLabel =
    plan.mode === "abstinence"
      ? t("pp.modeAbstinence")
      : plan.mode === "reduction"
        ? t("pp.modeReduction")
        : t("pp.modeTimeLimit");

  return (
    <section className="destination-view" aria-label={t("pp.title")}>
      <div className="book-chips">
        <button type="button" className="linklike" onClick={onBack}>
          {t("pp.back")}
        </button>
        <button type="button" className="linklike" onClick={() => router.push("/")}>
          {t("pp.quickExit")}
        </button>
      </div>
      <div className="pp-hero">
        <h2>{planDisplayName(t, plan, index)}</h2>
        {plan.category && <p className="backup-msg">{plan.category}</p>}
        <p className="backup-msg">{modeLabel}</p>
      </div>
      {msg && (
        <p className="backup-msg" aria-live="polite">
          {msg}
        </p>
      )}

      <h3 className="pp-sec">{t("pp.stats")}</h3>
      <div className="pp-stats" role="group" aria-label={t("pp.stats")}>
        <div className="pp-stat pp-stat-hero">
          <b>{t("pp.daysFmt", { n: data.cur })}</b>
          <span>{t("pp.currentRun")}</span>
        </div>
        <div className="pp-stat">
          <b>{t("pp.daysFmt", { n: data.longest })}</b>
          <span>{t("pp.longestRun")}</span>
        </div>
        <div className="pp-stat">
          <b>{t("pp.daysFmt", { n: data.average })}</b>
          <span>{t("pp.averageRun")}</span>
        </div>
        <div className="pp-stat">
          <b>{data.total}</b>
          <span>{t("pp.totalDays")}</span>
        </div>
        <div className="pp-stat">
          <b>{data.setbackCount}</b>
          <span>{t("pp.attempts")}</span>
        </div>
        <div className="pp-stat">
          <b>{data.gap ?? t("pp.noData")}</b>
          <span>{t("pp.interval")}</span>
        </div>
      </div>
      {(data.reached.length > 0 || data.next !== null) && (
        <p className="backup-msg">
          {data.reached.length > 0 &&
            t("pp.milestoneDone", { n: data.reached[data.reached.length - 1] as number })}
          {data.reached.length > 0 && data.next !== null && " · "}
          {data.next !== null && t("pp.milestoneNext", { n: data.next })}
        </p>
      )}

      <CheckinSection t={t} plan={plan} today={today} mutate={mutate} />
      <SetbackSection t={t} plan={plan} today={today} mutate={mutate} notify={notify} />
      <PlanTracker
        t={t}
        plan={plan}
        today={today}
        data={data}
        mutate={mutate}
        onBack={onBack}
        onOpenTimer={() => timerRef.current?.scrollIntoView({ block: "start" })}
        timerScrollRef={timerRef}
        pendingStrategy={pendingStrategy}
        setPendingStrategy={setPendingStrategy}
        thanks={thanks}
        setThanks={setThanks}
        answerStrategy={answerStrategy}
      />
      <PlanCare
        t={t}
        plan={plan}
        mutate={mutate}
        onDelete={onDelete}
        onToggleReminder={onToggleReminder}
      />
    </section>
  );
}

function CheckinSection({
  t,
  plan,
  today,
  mutate,
}: {
  t: TFn;
  plan: PrivatePlan;
  today: string;
  mutate: Mutate;
}) {
  const [note, setNote] = useState("");
  return (
    <>
      <h3 className="pp-sec">{t("pp.checkin")}</h3>
      <div className="pp-card pp-checkin-card">
        {checkedInToday(plan, today) ? (
          <p>{t("pp.checkedIn")}</p>
        ) : (
          <>
            <label>
              {t("pp.checkinNote")}
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </label>
            <div className="backup-actions">
              <button
                type="button"
                onClick={() => {
                  mutate((p) => recordCheckin(p, today, note));
                  setNote("");
                }}
              >
                {t("pp.checkin")}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function SetbackSection({
  t,
  plan,
  today,
  mutate,
  notify,
}: {
  t: TFn;
  plan: PrivatePlan;
  today: string;
  mutate: Mutate;
  notify: (m: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState("");
  const [note, setNote] = useState("");
  const [next, setNext] = useState("");
  const [saved, setSaved] = useState(false);
  return (
    <>
      <h3 className="pp-sec">{t("pp.setback")}</h3>
      <div className="pp-card pp-setback-card">
        {!open && !saved && (
          <div className="backup-actions">
            <button type="button" onClick={() => setOpen(true)}>
              {t("pp.setback")}
            </button>
          </div>
        )}
        {saved && <p aria-live="polite">{t("pp.setbackAffirm")}</p>}
        {open && (
          <>
            <p>{t("pp.setbackTitle")}</p>
            <label>
              {t("pp.setbackTrigger")}
              <select value={trigger} onChange={(e) => setTrigger(e.target.value)}>
                <option value="">{t("pp.idk")}</option>
                {plan.triggers.map((trg) => (
                  <option key={trg} value={trg}>
                    {trg}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("pp.setbackWhich")}
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </label>
            <label>
              {t("pp.nextAction")}
              <input value={next} onChange={(e) => setNext(e.target.value)} maxLength={500} />
            </label>
            <div className="backup-actions">
              <button
                type="button"
                onClick={() => {
                  // The trigger lives only in this setback's metadata —
                  // never also in triggerUses, so statistics count it once.
                  mutate((p) =>
                    recordSetback(p, today, {
                      trigger: trigger || undefined,
                      note: note || undefined,
                      next: next || undefined,
                    }),
                  );
                  setTrigger("");
                  setNote("");
                  setNext("");
                  setOpen(false);
                  setSaved(true);
                  notify(t("pp.setbackSaved"));
                }}
              >
                {t("pp.confirmSetback")}
              </button>
              <button type="button" className="linklike" onClick={() => setOpen(false)}>
                {t("pp.cancel")}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
