"use client";

// Analytics layers (ADD-ON BG): overview → trends → habits → quran → adhkar
// → goals → returns → history. Progressive disclosure: every layer shows its
// headline first; details expand on demand. Nothing renders without evidence
// (an.nodata), percentages are integers, and all copy is observational.

import { useMemo, useState } from "react";
import {
  adhkarStats,
  bestWeekdays,
  categoryDeltas,
  challengeAdvice,
  challengeStats,
  compareHabits,
  compareWindows,
  dataQuality,
  daysInRange,
  detectMilestones,
  detectReturns,
  fmtDelta,
  fmtPct,
  frictionByGroups,
  goalStats,
  habitStats,
  heatmap,
  isActiveDay,
  memRecency,
  monthReview,
  moodStats,
  periodRate,
  pledgeStats,
  preAbsenceBaseline,
  quranStats,
  rebuildSpeed,
  restartSizeEvidence,
  returnStats,
  reviewStats,
  rollingRate,
  smartInsights,
  streakStats,
  volatility,
  weekdayStats,
  type AdhkarLog,
  type Challenge,
  type Goal,
  type Pledge,
  type ReviewEntry,
} from "../lib/analytics";
import { categorize } from "../lib/coach";
import { dayId, loadFromStorage, sections } from "../lib/wird";
import { loadPersonalize } from "../lib/personalize";
import { useStoredState } from "../lib/use-stored-state";
import { useT } from "../lib/i18n";
import { useWird } from "./wird-store";

const PRESETS = [7, 30, 90, 365];

function TrendArrow({ dir }: { dir: "up" | "flat" | "down" }) {
  const t = useT();
  const label = dir === "up" ? t("an.up") : dir === "flat" ? t("an.flat") : t("an.down");
  return (
    <span role="img" aria-label={label}>
      {label}
    </span>
  );
}

function weekdayName(lang: string, wd: number): string {
  try {
    // 2026-09-13 is a Sunday; offset to the requested weekday.
    const d = new Date(Date.UTC(2026, 8, 13 + wd, 12));
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en", { weekday: "long" }).format(d);
  } catch {
    return `#${wd}`;
  }
}

export function AnalyticsLayers() {
  const t = useT();
  const { history, allHabits, challenges, customGoals, lang } = useWird();
  const todayId = useMemo(() => dayId(), []);
  const [preset, setPreset] = useState(30);
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const [memorized] = useStoredState<string[]>("wird-quran-mem-v1", []);
  const [bookmark] = useStoredState("wird-quran-bookmark-v1", { surah: 1, ayah: 1 });

  const reviews = useMemo(
    () => loadFromStorage<Record<string, ReviewEntry>>("wird-reviews-v1", {}),
    [],
  );
  const pledges = useMemo(() => loadFromStorage<Pledge[]>("wird-pledges-v1", []), []);
  const adhkarLog = useMemo(() => loadFromStorage<AdhkarLog>("wird-adhkar-log-v1", {}), []);

  const range = useMemo(() => {
    if (custom && from && to && from <= to) return { days: 0, from, to };
    return { days: preset, from: "", to: "" };
  }, [custom, from, to, preset]);

  const deedIds = useMemo(() => allHabits.map((h) => h.id), [allHabits]);
  const deedTitle = useMemo(() => {
    const m = new Map(allHabits.map((h) => [h.id, h.title] as const));
    return (id: string) => m.get(id) ?? id;
  }, [allHabits]);
  // STEP 6: adaptive suggestions render only when personalization allows.
  // Dashboards themselves stay visible (user-opened inspection).
  const personalize = useMemo(() => loadPersonalize(), []);

  const quality = useMemo(() => dataQuality(history, todayId), [history, todayId]);
  const streak = useMemo(() => streakStats(history, todayId), [history, todayId]);
  const cmp14 = useMemo(() => compareWindows(history, todayId, 14), [history, todayId]);
  const cmp30 = useMemo(() => compareWindows(history, todayId, 30), [history, todayId]);
  const base30 = useMemo(() => periodRate(history, todayId, 30), [history, todayId]);
  const prevBase30 = useMemo(
    () =>
      periodRate(
        history,
        new Date(Date.parse(`${todayId}T12:00:00Z`) - 30 * 86400000).toISOString().slice(0, 10),
        30,
      ),
    [history, todayId],
  );
  const vol = useMemo(() => volatility(history, todayId), [history, todayId]);
  const events = useMemo(() => detectReturns(history, todayId), [history, todayId]);
  const rstats = useMemo(() => returnStats(events), [events]);
  const restartEv = useMemo(() => restartSizeEvidence(events), [events]);
  const insights = useMemo(
    () =>
      smartInsights({
        history,
        reviews,
        challenges: challenges as Challenge[],
        commitments: allHabits.length + customGoals.length + challenges.length + pledges.length,
        endDay: todayId,
      }),
    [history, reviews, challenges, allHabits.length, customGoals.length, pledges.length, todayId],
  );
  const wd = useMemo(() => weekdayStats(history, todayId), [history, todayId]);
  const bestWd = useMemo(() => bestWeekdays(wd), [wd]);
  const comp = useMemo(() => compareHabits(history, deedIds, todayId), [history, deedIds, todayId]);
  const quran = useMemo(() => quranStats(history, todayId), [history, todayId]);
  const mem = useMemo(() => memRecency(memorized, todayId), [memorized, todayId]);
  const adhkar = useMemo(() => adhkarStats(adhkarLog, todayId), [adhkarLog, todayId]);
  const goals = useMemo(() => goalStats(customGoals as Goal[]), [customGoals]);
  const ch = useMemo(
    () => challengeStats(challenges as Challenge[], todayId),
    [challenges, todayId],
  );
  const pl = useMemo(() => pledgeStats(pledges, todayId), [pledges, todayId]);
  const rev = useMemo(() => reviewStats(reviews, history, todayId), [reviews, history, todayId]);
  const mood = useMemo(() => moodStats(reviews, history, todayId), [reviews, history, todayId]);
  const heat = useMemo(() => heatmap(history, todayId, 26), [history, todayId]);
  const month = useMemo(
    () => monthReview(history, reviews, todayId.slice(0, 7)),
    [history, reviews, todayId],
  );
  const prevMonth = useMemo(() => {
    const d = new Date(Date.parse(`${todayId.slice(0, 7)}-01T12:00:00Z`) - 86400000);
    return monthReview(history, reviews, d.toISOString().slice(0, 7));
  }, [history, reviews, todayId]);
  const sessions = useMemo(
    () => Object.values(history).filter((r) => r.pages > 0).length,
    [history],
  );
  const milestones = useMemo(
    () =>
      detectMilestones({
        history,
        challenges: challenges as Challenge[],
        quranSessions: sessions,
        endDay: todayId,
        events,
      }),
    [history, challenges, sessions, todayId, events],
  );
  const friction = useMemo(() => {
    const first = sections.slice(0, 3).flatMap((s) => s.habits.map((h) => h.id));
    const second = sections.slice(3).flatMap((s) => s.habits.map((h) => h.id));
    return frictionByGroups(
      history,
      [
        { label: "morning", ids: first },
        { label: "evening", ids: second },
      ],
      todayId,
    );
  }, [history, todayId]);
  const deltas = useMemo(
    () => categoryDeltas(history, deedIds, categorize, todayId, 30),
    [history, deedIds, todayId],
  );

  const rangeActive = useMemo(() => {
    if (range.days > 0) return periodRate(history, todayId, range.days);
    if (range.from && range.to) {
      const win = daysInRange(history, range.from, range.to);
      const active = win.filter(isActiveDay);
      return {
        activeDays: active.length,
        totalDays: win.length,
        rate: win.length === 0 ? 0 : active.length / win.length,
        pages: win.reduce((s, d) => s + d.pages, 0),
      };
    }
    return periodRate(history, todayId, 30);
  }, [history, todayId, range]);

  const lastReturn = rstats?.lastEvent ?? null;
  const lastRebuild = useMemo(
    () =>
      lastReturn
        ? rebuildSpeed(history, lastReturn, preAbsenceBaseline(history, lastReturn.returnDay))
        : null,
    [history, lastReturn],
  );

  return (
    <section className="analytics-layers">
      {/* range selector */}
      <div className="brief-card">
        <p className="eyebrow">{t("an.custom")}</p>
        <div className="backup-actions">
          {PRESETS.map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => {
                setPreset(n);
                setCustom(false);
              }}
              aria-pressed={!custom && preset === n}
              className={!custom && preset === n ? "selected" : ""}
            >
              {n === 7 ? t("an.week") : `${n}`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustom((c) => !c)}
            aria-pressed={custom}
            className={custom ? "selected" : ""}
          >
            {t("an.custom")}
          </button>
        </div>
        {custom && (
          <div className="backup-actions">
            <label className="time-label">
              {t("an.from")}
              <input
                type="date"
                value={from}
                max={todayId}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="time-label">
              {t("an.to")}
              <input type="date" value={to} max={todayId} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
        )}
        <p className="chart-caption">
          {t("an.base")}: {fmtPct(base30.rate)} · {t("an.prevBase")}: {fmtPct(prevBase30.rate)}
        </p>
        {(quality.futureDays.length > 0 || quality.invalidEntries > 0) && (
          <p className="backup-msg">
            {quality.futureDays.length > 0 && t("an.future", { n: quality.futureDays.length })}
          </p>
        )}
      </div>

      {/* L1 trends */}
      <div className="brief-card">
        <p className="eyebrow">{t("an.trends")}</p>
        {cmp14 ? (
          <>
            <p>
              <TrendArrow dir={cmp14.dir} /> {fmtDelta(cmp14.delta)}
            </p>
            <p className="chart-caption">
              {t("an.trendWhy", { prev: fmtPct(cmp14.prev.rate), cur: fmtPct(cmp14.cur.rate) })} ·{" "}
              {t("an.vsPrev")}
            </p>
          </>
        ) : (
          <p>{t("an.nodata")}</p>
        )}
        {cmp30 && (
          <p className="chart-caption">
            {t("an.roll", { n: 30 })} <TrendArrow dir={cmp30.dir} /> {fmtDelta(cmp30.delta)} ·{" "}
            {t("an.trendWhy", { prev: fmtPct(cmp30.prev.rate), cur: fmtPct(cmp30.cur.rate) })}
          </p>
        )}
        <p className="chart-caption">
          {t("an.roll", { n: 7 })}: {fmtPct(rollingRate(history, todayId, 7))} ·{" "}
          {t("an.roll", { n: 30 })}: {fmtPct(base30.rate)} · {t("an.roll", { n: 90 })}:{" "}
          {fmtPct(rollingRate(history, todayId, 90))}
        </p>
        <p className="chart-caption">
          {t("an.stability")}:{" "}
          {vol ? (vol.stdev < 0.2 ? t("an.stable") : t("an.swingy")) : t("an.nodata")}
        </p>
        {insights.length > 0 && (
          <ul>
            {insights.map((ins) => (
              <li key={ins.id}>
                💡 {t(`an.ins.${insightKey(ins.id)}`, insightVars(ins, lang, deedTitle))}
                <br />
                <small className="chart-caption">{t("an.ins.why", { n: 30 })}</small>
              </li>
            ))}
          </ul>
        )}
        {deltas.some((d) => Math.abs(d.delta) >= 0.12) && (
          <p>
            {t("an.changed")}{" "}
            {t("an.joint", {
              a: t(`cat.${topMover(deltas, 1)}`),
              b: t(`cat.${topMover(deltas, 2)}`),
            })}
          </p>
        )}
      </div>

      {/* L2 habits */}
      <div className="brief-card">
        <p className="eyebrow">{t("an.habits")}</p>
        {comp.mostConsistent ? (
          <>
            <p>
              {t("an.most")}: <b>{deedTitle(comp.mostConsistent.id)}</b>{" "}
              {fmtPct(comp.mostConsistent.rate)}
            </p>
            {comp.fastestImproving && (
              <p>
                {t("an.fastest")}: <b>{deedTitle(comp.fastestImproving.id)}</b>{" "}
                {fmtDelta(comp.fastestImproving.delta)}
              </p>
            )}
            {comp.needsAttention && (
              <p>
                {t("an.attention")}: <b>{deedTitle(comp.needsAttention.id)}</b>{" "}
                {fmtPct(comp.needsAttention.rate)}
              </p>
            )}
            <div className="backup-actions">
              <button type="button" className="linklike" onClick={() => toggle("habits")}>
                {open["habits"] ? "−" : "+"}
              </button>
            </div>
            {open["habits"] && (
              <ul>
                {topHabits(history, deedIds, todayId).map((id) => {
                  const s = habitStats(history, id, todayId);
                  if (!s) return null;
                  return (
                    <li key={id}>
                      <b>{deedTitle(id)}</b> {fmtPct(s.rate)}{" "}
                      <TrendArrow dir={s.trend?.dir ?? "flat"} />
                      <br />
                      <small className="chart-caption">
                        {t("an.best")}:{" "}
                        {s.bestWindow ? `${s.bestWindow.start}–${s.bestWindow.end}` : "—"} ·{" "}
                        {t("an.run")}: {s.currentRun} · {t("an.longest")}: {s.longestRun}
                      </small>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          <p>{t("an.qTempty")}</p>
        )}
        {wd ? (
          <>
            <p>
              {t("an.weekday")}: {t("an.bestDays")}:{" "}
              {bestWd.map((w) => weekdayName(lang, w)).join("، ")}
            </p>
            <div className="backup-actions">
              <button type="button" className="linklike" onClick={() => toggle("weekday")}>
                {open["weekday"] ? "−" : "+"}
              </button>
            </div>
            {open["weekday"] && (
              <ul>
                {wd.map((w) => (
                  <li key={w.weekday}>
                    {weekdayName(lang, w.weekday)} — {fmtPct(w.rate)} ({w.samples})
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="chart-caption">{t("an.nodata")}</p>
        )}
        {friction.length === 2 && (friction[0]?.rate ?? 0) - (friction[1]?.rate ?? 0) >= 0.2 && (
          <p>
            {t("an.friction")}: {t("an.eveningVs")} {t("an.makeSmall")}
          </p>
        )}
      </div>

      {/* streaks */}
      <div className="brief-card">
        <p className="eyebrow">
          {t("an.streak")} · {streak.current} · {t("an.bestStreak")} · {streak.best}
        </p>
        <p className="chart-caption">
          {t("an.avgRun")}: {streak.avgRun} · {t("an.avgBreak")}: {streak.avgBreak} ·{" "}
          {t("an.longBreak")}: {streak.longestBreak}
        </p>
      </div>

      {/* L3 quran */}
      <div className="brief-card">
        <p className="eyebrow">{t("an.quran")}</p>
        <p>
          {t("an.readDays")}: {quran.readingDays30} / 30 · {t("an.sessions")}: {quran.pages30}{" "}
          {quran.trend && <TrendArrow dir={quran.trend.dir} />}
        </p>
        <p className="chart-caption">
          {t("an.bookmark")}: {bookmark.surah}:{bookmark.ayah} · {t("an.mem")}: {mem.total} (
          {t("an.memRecent")}: {mem.recent} · {t("an.memStale")}: {mem.stale})
        </p>
        {quran.strongestFortnight && (
          <p className="chart-caption">
            {t("an.strongQ")}: {quran.strongestFortnight.start}–{quran.strongestFortnight.end}
          </p>
        )}
      </div>

      {/* L4 adhkar */}
      <div className="brief-card">
        <p className="eyebrow">{t("an.adhkar")}</p>
        {adhkar ? (
          <p>
            {t("an.daysUsed")}: {adhkar.daysUsed30} · {t("an.taps")}: {adhkar.totalTaps30}{" "}
            <TrendArrow dir={adhkar.trend ?? "flat"} /> · {t("an.topGroup")}:{" "}
            {adhkar.topGroup?.group ?? "—"}
          </p>
        ) : (
          <p className="chart-caption">{t("an.nodata")}</p>
        )}
      </div>

      {/* L5 goals */}
      <div className="brief-card">
        <p className="eyebrow">{t("an.goals")}</p>
        <p>
          {t("an.completed")}: {goals.completed} / {goals.total} · {t("an.challenges")}:{" "}
          {ch.completed} / {ch.started} · {t("an.pledges")}: {pl.created}
        </p>
        <p className="chart-caption">
          {t("an.abandoned")}: {ch.abandoned} · {t("an.avgCompletion")}: {fmtPct(ch.avgCompletion)}{" "}
          · {t("an.activeRec")}: {pl.activeRecent}
        </p>
        {challenges.length > 0 && (
          <ul>
            {challenges.map((c) => {
              const adv =
                personalize.master && personalize.analyzeHabits
                  ? challengeAdvice(c, todayId)
                  : null;
              return (
                <li key={c.id}>
                  {c.title} — {fmtPct(Math.min(1, c.checks.length / Math.max(1, c.target)))}
                  {adv === "consider-easier" && (
                    <>
                      <br />
                      <small className="chart-caption">
                        {t("an.advEasier")}{" "}
                        {t("an.advWhy", {
                          rate: fmtPct(Math.min(1, c.checks.length / Math.max(1, c.target))),
                        })}
                      </small>
                    </>
                  )}
                  {adv === "ended" && (
                    <>
                      <br />
                      <small className="chart-caption">{t("an.advEnded")}</small>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* reflections / mood */}
      <div className="brief-card">
        <p className="eyebrow">{t("an.reflect")}</p>
        {rev ? (
          <p>
            {t("an.reviewDays")}: {rev.reviewDays} · {t("an.gratitude")}: {rev.gratitudeDays}{" "}
            {rev.gratitudeTrend && <TrendArrow dir={rev.gratitudeTrend} />}
          </p>
        ) : (
          <p className="chart-caption">{t("an.nodata")}</p>
        )}
        {mood ? (
          <>
            <p>
              {t("an.mood")}: ✓{mood.distribution.good} · 😐{mood.distribution.ok} · ☁
              {mood.distribution.low}
            </p>
            {mood.activityCooccurrence && <p className="chart-caption">{t("an.cooccur")}</p>}
            <p className="chart-caption">{t("an.moodNote")}</p>
          </>
        ) : (
          <p className="chart-caption">{t("an.nodata")}</p>
        )}
      </div>

      {/* L6 returns */}
      <div className="brief-card">
        <p className="eyebrow">{t("an.returns")}</p>
        {rstats ? (
          <>
            <p>
              {t("an.returnsN")}: {rstats.count} · {t("an.avgGap")}: {rstats.avgGap} ·{" "}
              {t("an.sustain")}: {fmtPct(rstats.avgCont7 / 7)}
            </p>
            {rstats.breaksShortening && <p>{t("an.shortening")}</p>}
            {restartEv.small &&
              restartEv.large &&
              restartEv.small.avgCont14 > restartEv.large.avgCont14 && (
                <p>{t("an.smallRestart")}</p>
              )}
            {lastRebuild && (
              <p className="chart-caption">{t("an.rebuild", { n: lastRebuild.day50 ?? "—" })}</p>
            )}
            <div className="backup-actions">
              <button type="button" className="linklike" onClick={() => toggle("returns")}>
                {open["returns"] ? "−" : "+"}
              </button>
            </div>
            {open["returns"] && (
              <ul>
                {events.map((e) => (
                  <li key={e.returnDay}>
                    <span dir="ltr">{e.returnDay}</span> · {t("an.gap")}: {e.gapDays} ·{" "}
                    {t("an.cont", { n: 7 })}: {e.cont7} · {t("an.cont", { n: 30 })}: {e.cont30}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p>{t("an.nodata")}</p>
        )}
      </div>

      {/* L7 history: heatmap + month + milestones */}
      <div className="brief-card">
        <p className="eyebrow">{t("an.heat")}</p>
        <div className="day-strip heat-strip" role="img" aria-label={t("an.heat")}>
          {heat.map((d) => (
            <i
              key={d.day}
              title={`${d.day}`}
              className={
                d.level === 0
                  ? "empty"
                  : d.level >= 4
                    ? "excellent"
                    : d.level >= 3
                      ? "good"
                      : "partial"
              }
            />
          ))}
        </div>
        <p className="chart-caption">
          {t("an.l0")} · {t("an.l1")} · {t("an.l2")} · {t("an.l3")} · {t("an.l4")} —{" "}
          {t("an.heatNote")}
        </p>
      </div>

      <div className="brief-card">
        <p className="eyebrow">
          {t("an.yourMonth")}: <span dir="ltr">{month.month}</span>
        </p>
        <p>
          {t("an.activeDays")}: {month.activeDays} / {month.daysInMonth} · {t("an.longest")}:{" "}
          {month.longestRun} · {t("an.longBreak")}: {month.longestBreak}
        </p>
        <p className="chart-caption">
          {t("an.quran")}: {month.quranDelta === null ? "—" : fmtDelta(month.quranDelta)} ·{" "}
          {t("an.gratitude")}:{" "}
          {month.gratitudeDelta === null ? "—" : fmtDelta(month.gratitudeDelta)}
          {month.strongestWeekday !== null && (
            <>
              {" "}
              · {t("an.bestDays")}: {weekdayName(lang, month.strongestWeekday)}
            </>
          )}
        </p>
        <p className="chart-caption">
          {t("an.vsPrev")}: {prevMonth.month} {prevMonth.activeDays}/{prevMonth.daysInMonth}
        </p>
      </div>

      <div className="brief-card">
        <p className="eyebrow">{t("an.yourYear")}</p>
        <ul>
          {milestones.map((m) => (
            <li key={m.id}>
              {m.reached ? "✓" : "·"} {t(`an.${milestoneKey(m.id)}`)}
              {m.reached && m.day ? (
                <>
                  {" "}
                  · <span dir="ltr">{m.day}</span>
                </>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="chart-caption">
          {t("an.returnsN")}: {rstats?.count ?? 0} · {t("an.sessions")}: {sessions}
        </p>
      </div>

      {/* custom-range readout */}
      <div className="brief-card">
        <p className="eyebrow">
          {custom && range.from && range.to ? (
            <span dir="ltr">
              {range.from} → {range.to}
            </span>
          ) : (
            t("an.roll", { n: range.days })
          )}
        </p>
        <p>
          {t("an.activeDays")}: {rangeActive.activeDays} / {rangeActive.totalDays} (
          {fmtPct(rangeActive.rate)})
        </p>
      </div>
    </section>
  );
}

function insightVars(
  ins: { id: string; evidence: Record<string, string | number> },
  lang: string,
  titles: (id: string) => string,
): Record<string, string | number> {
  if (ins.id === "weekday" && typeof ins.evidence["weekday"] === "number") {
    return { day: weekdayName(lang, ins.evidence["weekday"]) };
  }
  if (ins.id === "overload" && ins.evidence["n"] !== undefined) {
    const n = ins.evidence["n"];
    return { n: typeof n === "number" ? n : 0 };
  }
  if (ins.id === "cooccur") {
    const { a, b, pa, pb } = ins.evidence;
    return {
      a: typeof a === "string" ? titles(a) : "",
      b: typeof b === "string" ? titles(b) : "",
      pa: typeof pa === "number" ? pa : 0,
      pb: typeof pb === "number" ? pb : 0,
    };
  }
  return {};
}

function insightKey(id: string): string {
  const map: Record<string, string> = {
    improve30: "improve30",
    decline30: "decline30",
    weekday: "weekday",
    overload: "overload",
    recovery: "recovery",
    "small-restart": "smallRestart",
    cooccur: "cooccur",
  };
  return map[id] ?? "improve30";
}

function milestoneKey(id: string): string {
  const map: Record<string, string> = {
    first7: "m7",
    first30: "m30",
    quran100: "m100q",
    "first-challenge": "mCh",
    "longest-run": "mRun",
    "strong-return": "mRet",
    "first-day": "mFirst",
  };
  return map[id] ?? "m7";
}

function topMover(deltas: { category: string; delta: number }[], rank: 1 | 2): string {
  const sorted = [...deltas].sort((a, b) => b.delta - a.delta);
  return sorted[rank - 1]?.category ?? sorted[0]?.category ?? "salah";
}

function topHabits(
  history: Parameters<typeof heatmap>[0],
  deedIds: string[],
  endDay: string,
): string[] {
  const counts = new Map<string, number>();
  for (const day of Object.keys(history)) {
    if (day > endDay) continue;
    const rec = (history as Record<string, { ids?: unknown }>)[day];
    const ids = Array.isArray(rec?.ids) ? (rec?.ids as string[]) : [];
    for (const id of ids) {
      if (deedIds.includes(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);
}
