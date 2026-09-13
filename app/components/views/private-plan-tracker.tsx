// Private-plan tracking tools (STEP 4): usage limits, journey timeline,
// triggers, replacements. The urge timer + emergency exits live in
// private-plan-timer.tsx; support/settings in private-plan-care.tsx.
"use client";

import { useState, type RefObject } from "react";
import { addUnique, logTrigger, logUsage, type PrivatePlan } from "../../lib/private-plans";
import type { Mutate, PlanData, TFn } from "./private-plan-detail";
import { EmergencySection, TimerSection } from "./private-plan-timer";

type Common = {
  t: TFn;
  plan: PrivatePlan;
  today: string;
  data: PlanData;
  mutate: Mutate;
};

export function PlanTracker(
  props: Common & {
    onBack: () => void;
    onOpenTimer: () => void;
    timerScrollRef: RefObject<HTMLDivElement | null>;
    pendingStrategy: string | null;
    setPendingStrategy: (s: string | null) => void;
    thanks: boolean;
    setThanks: (v: boolean) => void;
    answerStrategy: (helped: boolean) => void;
  },
) {
  const { t, plan, today, data, mutate } = props;
  return (
    <>
      {plan.mode !== "abstinence" && <UsageSection {...props} />}
      <TimelineSection t={t} plan={plan} data={data} />
      <TriggersSection t={t} plan={plan} today={today} mutate={mutate} data={data} />
      <ReplacementsSection
        t={t}
        plan={plan}
        today={today}
        mutate={mutate}
        data={data}
        pendingStrategy={props.pendingStrategy}
        setPendingStrategy={props.setPendingStrategy}
        thanks={props.thanks}
        setThanks={props.setThanks}
        answerStrategy={props.answerStrategy}
      />
      <TimerSection
        t={t}
        scrollRef={props.timerScrollRef}
        setPendingStrategy={props.setPendingStrategy}
        setThanks={props.setThanks}
      />
      <EmergencySection t={t} onBack={props.onBack} onOpenTimer={props.onOpenTimer} />
    </>
  );
}

function UsageSection({ t, plan, today, data, mutate }: Common) {
  const [minutes, setMinutes] = useState("");
  const pct = (v: number, cap: number): number =>
    Math.max(0, Math.min(100, Math.round((v / cap) * 100)));
  return (
    <>
      <h3 className="pp-sec">{t("pp.usageToday")}</h3>
      <div className="pp-card">
        <p className="pp-run-hero">
          {t("pp.minutesFmt", { n: data.todayMin })}
          {plan.dailyMinutes != null && (
            <span className={data.todayMin <= plan.dailyMinutes ? "pp-ok" : "pp-over"}>
              {" · "}
              {data.todayMin <= plan.dailyMinutes ? t("pp.within") : t("pp.over")}
            </span>
          )}
        </p>
        {plan.dailyMinutes != null && (
          <div className="pp-bar" role="img" aria-label={t("pp.dailyLimit")}>
            <span
              className={`pp-fill${data.todayMin <= plan.dailyMinutes ? "" : " over"}`}
              style={{ inlineSize: `${pct(data.todayMin, plan.dailyMinutes)}%` }}
            />
          </div>
        )}
        {plan.dailyMinutes != null && data.withinWeek !== null && (
          <p className="backup-msg">{t("pp.weekWithin", { n: data.withinWeek })}</p>
        )}
        {plan.weeklyMinutes != null && (
          <>
            <p className="backup-msg">
              {t("pp.minutesFmt", { n: data.weekTotal })} /{" "}
              {t("pp.minutesFmt", { n: plan.weeklyMinutes })}
            </p>
            <div className="pp-bar" role="img" aria-label={t("pp.weeklyLimit")}>
              <span
                className={`pp-fill${data.weekTotal <= plan.weeklyMinutes ? "" : " over"}`}
                style={{ inlineSize: `${pct(data.weekTotal, plan.weeklyMinutes)}%` }}
              />
            </div>
          </>
        )}
        {data.week.every((d) => d.minutes === 0) && <p className="backup-msg">{t("pp.noUsage")}</p>}
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
  );
}

function TimelineSection({ t, data }: { t: TFn; plan: PrivatePlan; data: PlanData }) {
  return (
    <>
      <h3 className="pp-sec">{t("pp.timeline")}</h3>
      <div className="pp-card">
        {data.timeline.length <= 1 ? (
          <p className="backup-msg">{t("pp.timelineEmpty")}</p>
        ) : (
          <ol className="pp-timeline">
            {data.timeline.map((e, i) => (
              <li
                key={i}
                className={`pp-tl-item${e.type === "setback" ? " is-setback" : ""}${e.type === "run" && e.current ? " is-current" : ""}`}
              >
                {e.type === "start" && `${t("pp.planStart")} · ${e.day}`}
                {e.type === "setback" && `${t("pp.setbackMark")} · ${e.day}`}
                {e.type === "run" &&
                  `${t("pp.runSeg")} · ${t("pp.daysFmt", { n: e.days })} · ${e.start} → ${e.end}${e.current ? ` · ${t("pp.currentBadge")}` : ""}`}
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}

function TriggersSection({
  t,
  plan,
  today,
  mutate,
  data,
}: {
  t: TFn;
  plan: PrivatePlan;
  today: string;
  mutate: Mutate;
  data: PlanData;
}) {
  const [draft, setDraft] = useState("");
  return (
    <>
      <h3 className="pp-sec">{t("pp.triggers")}</h3>
      <div className="pp-card">
        {plan.triggers.length === 0 && <p className="backup-msg">{t("pp.noTriggersYet")}</p>}
        {plan.triggers.length > 0 && (
          <div className="pp-chip-row">
            {plan.triggers.map((trg) => (
              <span key={trg} className="pp-chip">
                {trg}
                <button
                  type="button"
                  className="linklike"
                  onClick={() => mutate((p) => logTrigger(p, today, trg))}
                  aria-label={`${t("pp.logTrigger")}: ${trg}`}
                >
                  {t("pp.logTrigger")}
                </button>
                <button
                  type="button"
                  className="linklike"
                  onClick={() =>
                    mutate((p) => ({ ...p, triggers: p.triggers.filter((x) => x !== trg) }))
                  }
                  aria-label={`${t("pp.remove")}: ${trg}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <label>
          {t("pp.addTrigger")}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("pp.triggerPh")}
            maxLength={200}
          />
        </label>
        <div className="backup-actions">
          <button
            type="button"
            onClick={() => {
              mutate((p) => ({ ...p, triggers: addUnique(p.triggers, draft) }));
              setDraft("");
            }}
          >
            {t("pp.addTrigger")}
          </button>
        </div>
        {data.trigStats.length > 0 && (
          <>
            <p>{t("pp.topTriggers")}</p>
            {data.trigStats.slice(0, 5).map((s) => (
              <p key={s.trigger} className="backup-msg">
                {t("pp.triggerNote", { t: s.trigger, n: s.count })}
              </p>
            ))}
          </>
        )}
      </div>
    </>
  );
}

function ReplacementsSection({
  t,
  plan,
  mutate,
  data,
  pendingStrategy,
  setPendingStrategy,
  thanks,
  setThanks,
  answerStrategy,
}: Common & {
  pendingStrategy: string | null;
  setPendingStrategy: (s: string | null) => void;
  thanks: boolean;
  setThanks: (v: boolean) => void;
  answerStrategy: (helped: boolean) => void;
}) {
  const [label, setLabel] = useState("");
  const [repFor, setRepFor] = useState("");
  return (
    <>
      <h3 className="pp-sec">{t("pp.replacements")}</h3>
      <div className="pp-card">
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
            value={label}
            onChange={(e) => setLabel(e.target.value)}
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
              const clean = label.trim();
              if (!clean) return;
              mutate((p) => ({
                ...p,
                replacements: [
                  ...p.replacements,
                  {
                    id: `${Date.now().toString(36)}`,
                    label: clean,
                    forTrigger: repFor || undefined,
                  },
                ].slice(-100),
              }));
              setLabel("");
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
        {data.stratStats.length > 0 && (
          <>
            <p>{t("pp.topStrategies")}</p>
            {data.stratStats.slice(0, 5).map((s) => (
              <p key={s.strategy} className="backup-msg">
                {t("pp.strategyNote", { s: s.strategy, a: s.helped, u: s.uses })}
              </p>
            ))}
          </>
        )}
      </div>
    </>
  );
}
