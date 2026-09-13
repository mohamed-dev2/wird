// Single private plan (STEP 4): counter, neutral setback flow, triggers,
// replacements, offline urge timer, milestones, usage limits, timeline,
// support section. Shown only after the user explicitly opens the plan —
// nothing here leaks into dashboards, shares, notifications, or URLs.
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../lib/i18n";
import { dayId } from "../../lib/wird";
import { resolveVerse, surahNameAr, versesForTheme, type ResolvedVerse } from "../../lib/content";
import {
  attemptCount,
  averageRunDays,
  averageSetbackGap,
  checkedInToday,
  currentRunDays,
  logStrategy,
  logTrigger,
  logUsage,
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
} from "../../lib/private-plans";

type Props = {
  plan: PrivatePlan;
  index: number;
  onBack: () => void;
  onChange: (next: PrivatePlan) => void;
  onDelete: () => void;
  onToggleReminder: () => void;
};

const TIMER_PRESETS = [5, 10, 20];

/** List-visible name: real name only when the user opted out of discreet mode. */
export function planDisplayName(
  t: (k: string, v?: Record<string, string | number>) => string,
  plan: PrivatePlan,
  index: number,
): string {
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
  const [note, setNote] = useState("");
  const [setbackOpen, setSetbackOpen] = useState(false);
  const [sbTrigger, setSbTrigger] = useState("");
  const [sbNote, setSbNote] = useState("");
  const [sbNext, setSbNext] = useState("");
  const [sbSaved, setSbSaved] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [newTrigger, setNewTrigger] = useState("");
  const [newRep, setNewRep] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newMs, setNewMs] = useState("");
  const [repFor, setRepFor] = useState("");
  const [pendingStrategy, setPendingStrategy] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);
  const [timerMin, setTimerMin] = useState(5);
  const [customMin, setCustomMin] = useState("");
  const [left, setLeft] = useState<number | null>(null);
  const [timerDone, setTimerDone] = useState(false);
  const [verse, setVerse] = useState<ResolvedVerse | null>(null);
  const [editName, setEditName] = useState(plan.name);
  const [editCat, setEditCat] = useState(plan.category ?? "");
  const [trusted, setTrusted] = useState(plan.trustedPerson ?? "");
  const timerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Optional supportive verse: resolved at runtime from the verified
  // bundled text; renders nothing when unresolvable (authenticity rule).
  // Rendered only while islamicSupport is on, so no reset is needed here.
  useEffect(() => {
    if (!plan.islamicSupport) return;
    let live = true;
    const ref = versesForTheme("hope")[0];
    if (!ref) return;
    void resolveVerse(ref.surah, ref.ayah).then((v) => {
      if (live) setVerse(v);
    });
    return () => {
      live = false;
    };
  }, [plan.islamicSupport]);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  const mutate = (fn: (p: PrivatePlan) => PrivatePlan) => {
    try {
      onChange(fn(plan));
    } catch {
      setMsg(t("pp.saveFail"));
    }
  };

  const doCheckin = () => {
    mutate((p) => recordCheckin(p, today, note));
    setNote("");
  };

  const doSetback = () => {
    // The trigger lives only in this setback's metadata — never also in
    // triggerUses, so trigger statistics count it exactly once.
    mutate((p) =>
      recordSetback(p, today, {
        trigger: sbTrigger || undefined,
        note: sbNote || undefined,
        next: sbNext || undefined,
      }),
    );
    setSbTrigger("");
    setSbNote("");
    setSbNext("");
    setSetbackOpen(false);
    setSbSaved(true);
    setMsg(t("pp.setbackSaved"));
  };

  const answerStrategy = (helped: boolean) => {
    if (pendingStrategy) mutate((p) => logStrategy(p, today, pendingStrategy, helped));
    setPendingStrategy(null);
    setThanks(true);
  };

  const startTimer = (mins: number) => {
    if (!Number.isFinite(mins) || mins <= 0 || mins > 180) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerDone(false);
    setThanks(false);
    setLeft(Math.round(mins * 60));
    intervalRef.current = setInterval(() => {
      setLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fmtClock = (s: number): string =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const cur = currentRunDays(plan, today);
  const { reached, next } = milestonesReached(plan, today);
  const stats = triggerStats(plan);
  const strategies = strategyStats(plan);
  const week = usageLast7(plan, today);
  const todayMin = usageOnDay(plan, today);
  const weekTotal = week.reduce((a, d) => a + d.minutes, 0);
  const withinWeek =
    plan.dailyMinutes != null
      ? week.filter((d) => d.minutes <= (plan.dailyMinutes as number)).length
      : null;
  const timeline = planTimeline(plan, today);
  const modeLabel =
    plan.mode === "abstinence"
      ? t("pp.modeAbstinence")
      : plan.mode === "reduction"
        ? t("pp.modeReduction")
        : t("pp.modeTimeLimit");

  const addStr = (list: string[], v: string): string[] =>
    v.trim() && !list.includes(v.trim()) ? [...list, v.trim()].slice(0, 100) : list;

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
      <h2>{planDisplayName(t, plan, index)}</h2>
      {plan.category && <p className="backup-msg">{plan.category}</p>}
      <p className="backup-msg">{modeLabel}</p>
      {msg && (
        <p className="backup-msg" aria-live="polite">
          {msg}
        </p>
      )}

      <h3>{t("pp.stats")}</h3>
      <div className="row-detail">
        <p>
          {t("pp.currentRun")}: <strong>{t("pp.daysFmt", { n: cur })}</strong>
        </p>
        <p className="backup-msg">
          {t("pp.longestRun")}: {t("pp.daysFmt", { n: longestRunDays(plan, today) })} ·{" "}
          {t("pp.averageRun")}: {t("pp.daysFmt", { n: averageRunDays(plan, today) })} ·{" "}
          {t("pp.totalDays")}: {totalSuccessfulDays(plan, today)} · {t("pp.attempts")}:{" "}
          {attemptCount(plan, today) - 1} · {t("pp.interval")}:{" "}
          {averageSetbackGap(plan, today) ?? t("pp.noData")}
        </p>
        {reached.length > 0 && (
          <p className="backup-msg">
            {t("pp.milestoneDone", { n: reached[reached.length - 1] as number })}
          </p>
        )}
        {next !== null && next !== undefined && (
          <p className="backup-msg">{t("pp.milestoneNext", { n: next })}</p>
        )}
      </div>

      <h3>{t("pp.checkin")}</h3>
      <div className="row-detail">
        {checkedInToday(plan, today) ? (
          <p>{t("pp.checkedIn")}</p>
        ) : (
          <>
            <label>
              {t("pp.checkinNote")}
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </label>
            <div className="backup-actions">
              <button type="button" onClick={doCheckin}>
                {t("pp.checkin")}
              </button>
            </div>
          </>
        )}
      </div>

      <h3>{t("pp.setback")}</h3>
      <div className="row-detail">
        {!setbackOpen && !sbSaved && (
          <div className="backup-actions">
            <button type="button" onClick={() => setSetbackOpen(true)}>
              {t("pp.setback")}
            </button>
          </div>
        )}
        {sbSaved && <p aria-live="polite">{t("pp.setbackAffirm")}</p>}
        {setbackOpen && (
          <>
            <p>{t("pp.setbackTitle")}</p>
            <label>
              {t("pp.setbackTrigger")}
              <select value={sbTrigger} onChange={(e) => setSbTrigger(e.target.value)}>
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
              <input value={sbNote} onChange={(e) => setSbNote(e.target.value)} maxLength={500} />
            </label>
            <label>
              {t("pp.nextAction")}
              <input value={sbNext} onChange={(e) => setSbNext(e.target.value)} maxLength={500} />
            </label>
            <div className="backup-actions">
              <button type="button" onClick={doSetback}>
                {t("pp.confirmSetback")}
              </button>
              <button type="button" className="linklike" onClick={() => setSetbackOpen(false)}>
                {t("pp.cancel")}
              </button>
            </div>
          </>
        )}
      </div>

      {plan.mode !== "abstinence" && (
        <>
          <h3>{t("pp.usageToday")}</h3>
          <div className="row-detail">
            <p>
              {t("pp.minutesFmt", { n: todayMin })}
              {plan.dailyMinutes != null &&
                (todayMin <= plan.dailyMinutes ? ` · ${t("pp.within")}` : ` · ${t("pp.over")}`)}
            </p>
            {plan.dailyMinutes != null && withinWeek !== null && (
              <p className="backup-msg">{t("pp.weekWithin", { n: withinWeek })}</p>
            )}
            {plan.weeklyMinutes != null && (
              <p className="backup-msg">
                {t("pp.minutesFmt", { n: weekTotal })} /{" "}
                {t("pp.minutesFmt", { n: plan.weeklyMinutes })}
              </p>
            )}
            {week.every((d) => d.minutes === 0) && <p className="backup-msg">{t("pp.noUsage")}</p>}
            <label>
              {t("pp.logMinutes")}
              <input
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                inputMode="numeric"
                placeholder={t("pp.minutesPh")}
              />
            </label>
            <div className="backup-actions">
              <button
                type="button"
                onClick={() => {
                  const m = parseInt(minutes, 10);
                  if (Number.isFinite(m) && m > 0) {
                    mutate((p) => logUsage(p, today, m));
                    setMinutes("");
                  }
                }}
              >
                {t("pp.logMinutes")}
              </button>
            </div>
          </div>
        </>
      )}

      <h3>{t("pp.timeline")}</h3>
      <div className="row-detail">
        {timeline.length <= 1 ? (
          <p className="backup-msg">{t("pp.timelineEmpty")}</p>
        ) : (
          timeline.map((e, i) => (
            <p key={i} className="backup-msg">
              {e.type === "start" && `${t("pp.planStart")} · ${e.day}`}
              {e.type === "setback" && `${t("pp.setbackMark")} · ${e.day}`}
              {e.type === "run" &&
                `${t("pp.runSeg")} · ${t("pp.daysFmt", { n: e.days })} · ${e.start} → ${e.end}${e.current ? ` · ${t("pp.currentBadge")}` : ""}`}
            </p>
          ))
        )}
      </div>

      <h3>{t("pp.triggers")}</h3>
      <div className="row-detail">
        {plan.triggers.length === 0 && <p className="backup-msg">{t("pp.noTriggersYet")}</p>}
        {plan.triggers.map((trg) => (
          <p key={trg}>
            {trg}{" "}
            <button
              type="button"
              className="linklike"
              onClick={() => mutate((p) => logTrigger(p, today, trg))}
            >
              {t("pp.logTrigger")}
            </button>{" "}
            <button
              type="button"
              className="linklike"
              onClick={() =>
                mutate((p) => ({ ...p, triggers: p.triggers.filter((x) => x !== trg) }))
              }
            >
              {t("pp.remove")}
            </button>
          </p>
        ))}
        <label>
          {t("pp.addTrigger")}
          <input
            value={newTrigger}
            onChange={(e) => setNewTrigger(e.target.value)}
            placeholder={t("pp.triggerPh")}
            maxLength={200}
          />
        </label>
        <div className="backup-actions">
          <button
            type="button"
            onClick={() => {
              mutate((p) => ({ ...p, triggers: addStr(p.triggers, newTrigger) }));
              setNewTrigger("");
            }}
          >
            {t("pp.addTrigger")}
          </button>
        </div>
        {stats.length > 0 && (
          <>
            <p>{t("pp.topTriggers")}</p>
            {stats.slice(0, 5).map((s) => (
              <p key={s.trigger} className="backup-msg">
                {t("pp.triggerNote", { t: s.trigger, n: s.count })}
              </p>
            ))}
          </>
        )}
      </div>

      <h3>{t("pp.replacements")}</h3>
      <div className="row-detail">
        {plan.replacements.length === 0 && <p className="backup-msg">{t("pp.noStrategiesYet")}</p>}
        {plan.replacements.map((r) => (
          <p key={r.id}>
            {r.label}
            {r.forTrigger ? ` · ${r.forTrigger}` : ""}{" "}
            <button
              type="button"
              className="linklike"
              onClick={() => {
                setThanks(false);
                setPendingStrategy(r.label);
              }}
            >
              {t("pp.markUsed")}
            </button>{" "}
            <button
              type="button"
              className="linklike"
              onClick={() =>
                mutate((p) => ({ ...p, replacements: p.replacements.filter((x) => x.id !== r.id) }))
              }
            >
              {t("pp.remove")}
            </button>
          </p>
        ))}
        <label>
          {t("pp.addReplacement")}
          <input
            value={newRep}
            onChange={(e) => setNewRep(e.target.value)}
            placeholder={t("pp.replacementPh")}
            maxLength={200}
          />
        </label>
        <label>
          {t("pp.setbackTrigger")}
          <select value={repFor} onChange={(e) => setRepFor(e.target.value)}>
            <option value="">—</option>
            {plan.triggers.map((trg) => (
              <option key={trg} value={trg}>
                {trg}
              </option>
            ))}
          </select>
        </label>
        <div className="backup-actions">
          <button
            type="button"
            onClick={() => {
              const label = newRep.trim();
              if (!label) return;
              mutate((p) => ({
                ...p,
                replacements: [
                  ...p.replacements,
                  { id: `${Date.now().toString(36)}`, label, forTrigger: repFor || undefined },
                ].slice(-100),
              }));
              setNewRep("");
              setRepFor("");
            }}
          >
            {t("pp.addReplacement")}
          </button>
        </div>
        {pendingStrategy && (
          <p aria-live="polite">
            {t("pp.didHelp")}{" "}
            <button type="button" className="linklike" onClick={() => answerStrategy(true)}>
              {t("pp.helpedYes")}
            </button>{" "}
            <button type="button" className="linklike" onClick={() => answerStrategy(false)}>
              {t("pp.helpedNo")}
            </button>
          </p>
        )}
        {thanks && !pendingStrategy && <p className="backup-msg">{t("pp.usedThanks")}</p>}
        {strategies.length > 0 && (
          <>
            <p>{t("pp.topStrategies")}</p>
            {strategies.slice(0, 5).map((s) => (
              <p key={s.strategy} className="backup-msg">
                {t("pp.strategyNote", { s: s.strategy, a: s.helped, u: s.uses })}
              </p>
            ))}
          </>
        )}
      </div>

      <div ref={timerRef}>
        <h3>{t("pp.timer")}</h3>
        <div className="row-detail">
          <p className="backup-msg">{t("pp.timerDesc")}</p>
          <div className="backup-actions" role="group" aria-label={t("pp.timer")}>
            {TIMER_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={timerMin === m}
                className={timerMin === m ? "selected" : ""}
                onClick={() => setTimerMin(m)}
              >
                {t("pp.minutesFmt", { n: m })}
              </button>
            ))}
          </div>
          <label>
            {t("pp.logMinutes")}
            <input
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              inputMode="numeric"
              placeholder={t("pp.minutesPh")}
            />
          </label>
          <div className="backup-actions">
            <button
              type="button"
              onClick={() => {
                const m = customMin.trim() ? parseInt(customMin, 10) : timerMin;
                setCustomMin("");
                startTimer(m);
              }}
            >
              {t("pp.startTimer")}
            </button>
          </div>
          {left !== null && !timerDone && (
            <p aria-live="polite" aria-label={t("pp.timerLeft")}>
              {fmtClock(left)}
            </p>
          )}
          {timerDone && (
            <p aria-live="polite">
              {t("pp.timerDone")}{" "}
              <button
                type="button"
                className="linklike"
                onClick={() => {
                  setTimerDone(false);
                  setLeft(null);
                  setThanks(false);
                  setPendingStrategy(t("pp.timer"));
                }}
              >
                {t("pp.didHelp")}
              </button>
            </p>
          )}
        </div>
      </div>

      <h3>{t("pp.emergency")}</h3>
      <div className="row-detail">
        <p className="backup-msg">{t("pp.emergencyDesc")}</p>
        <div className="backup-actions">
          <button type="button" onClick={() => router.push("/")}>
            {t("pp.leaveNow")}
          </button>
          <button
            type="button"
            onClick={() => timerRef.current?.scrollIntoView({ block: "start" })}
          >
            {t("pp.openTimer")}
          </button>
          <button type="button" className="linklike" onClick={onBack}>
            {t("pp.openPlan")}
          </button>
        </div>
      </div>

      <h3>{t("pp.supportTitle")}</h3>
      <div className="row-detail">
        <p className="backup-msg">{t("pp.supportDesc")}</p>
        <label>
          {t("pp.trusted")}
          <input
            value={trusted}
            onChange={(e) => setTrusted(e.target.value)}
            placeholder={t("pp.trustedPh")}
            maxLength={200}
            onBlur={() => mutate((p) => ({ ...p, trustedPerson: trusted.trim() || undefined }))}
          />
        </label>
        <p className="backup-msg">{t("pp.emergencyNote")}</p>
        <button
          type="button"
          className="linklike"
          aria-pressed={plan.islamicSupport}
          onClick={() => mutate((p) => ({ ...p, islamicSupport: !p.islamicSupport }))}
        >
          {plan.islamicSupport ? "✓ " : ""}
          {t("pp.islamic")}
        </button>
        {plan.islamicSupport && (
          <p className="backup-msg">
            {t("pp.islamicNote")}
            {verse && (
              <>
                {" — "}
                {verse.ar} ({t("pp.verseRef", { s: surahNameAr(verse.surah), a: verse.ayah })})
              </>
            )}
          </p>
        )}
      </div>

      <h3>{t("pp.milestones")}</h3>
      <div className="row-detail">
        <p className="backup-msg">{plan.milestones.join(" · ")}</p>
        <label>
          {t("pp.addMilestone")}
          <input
            value={newMs}
            onChange={(e) => setNewMs(e.target.value)}
            inputMode="numeric"
            placeholder={t("pp.milestonePh")}
          />
        </label>
        <div className="backup-actions">
          <button
            type="button"
            onClick={() => {
              const m = parseInt(newMs, 10);
              if (Number.isInteger(m) && m > 0 && m <= 3650) {
                mutate((p) => ({
                  ...p,
                  milestones: [...new Set([...p.milestones, m])].sort((a, b) => a - b),
                }));
              }
              setNewMs("");
            }}
          >
            {t("pp.addMilestone")}
          </button>
        </div>
      </div>

      <h3>{t("pp.reasons")}</h3>
      <div className="row-detail">
        {plan.reasons.map((r) => (
          <p key={r}>
            {r}{" "}
            <button
              type="button"
              className="linklike"
              onClick={() => mutate((p) => ({ ...p, reasons: p.reasons.filter((x) => x !== r) }))}
            >
              {t("pp.remove")}
            </button>
          </p>
        ))}
        <label>
          {t("pp.addReason")}
          <input
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder={t("pp.reasonPh")}
            maxLength={500}
          />
        </label>
        <div className="backup-actions">
          <button
            type="button"
            onClick={() => {
              mutate((p) => ({ ...p, reasons: addStr(p.reasons, newReason).slice(0, 50) }));
              setNewReason("");
            }}
          >
            {t("pp.addReason")}
          </button>
        </div>
      </div>

      <h3>{t("pp.name")}</h3>
      <div className="row-detail">
        <label>
          {t("pp.name")}
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={t("pp.namePh")}
            maxLength={80}
          />
        </label>
        <label>
          {t("pp.category")}
          <input
            value={editCat}
            onChange={(e) => setEditCat(e.target.value)}
            placeholder={t("pp.categoryPh")}
            maxLength={80}
          />
        </label>
        <div className="backup-actions">
          <button
            type="button"
            onClick={() =>
              mutate((p) => ({
                ...p,
                name: editName.trim(),
                category: editCat.trim() || undefined,
              }))
            }
          >
            {t("pp.save")}
          </button>
        </div>
        <button
          type="button"
          className="linklike"
          aria-pressed={plan.discreet}
          onClick={() => mutate((p) => ({ ...p, discreet: !p.discreet }))}
        >
          {plan.discreet ? "✓ " : ""}
          {t("pp.discreet")}
        </button>
        <p className="backup-msg">{t("pp.discreetDesc")}</p>
        <button
          type="button"
          className="linklike"
          aria-pressed={plan.reminder}
          onClick={onToggleReminder}
        >
          {plan.reminder ? "✓ " : ""}
          {plan.reminder ? t("pp.reminderOn") : t("pp.reminderOff")}
        </button>
        <p className="backup-msg">
          {t("pp.reminder")} — {t("pp.reminderDesc")}
        </p>
      </div>

      <h3>{t("pp.delete")}</h3>
      <div className="row-detail">
        <div className="backup-actions">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t("pp.deleteAsk"))) onDelete();
            }}
          >
            {t("pp.delete")}
          </button>
        </div>
      </div>
    </section>
  );
}
