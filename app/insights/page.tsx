"use client";

import { useMemo, useState } from "react";
import { dataStreak, lastNDays } from "../lib/history";
import { buildBrief, buildCatalog, categoryBalance, type Category } from "../lib/coach";
import { dayId, hijriParts } from "../lib/wird";
import { useT } from "../lib/i18n";
import { useWird } from "../components/wird-store";

const PERIODS: { k: string; n: number }[] = [
  { k: "ins.p0", n: 1 },
  { k: "ins.p1", n: 7 },
  { k: "ins.p2", n: 14 },
  { k: "ins.p3", n: 30 },
  { k: "ins.p4", n: 90 },
  { k: "ins.p5", n: 180 },
  { k: "ins.p6", n: 365 },
];

function Radar({ values }: { values: { category: Category; pct: number }[] }) {
  const t = useT();
  const C = 75;
  const R = 52;
  const pt = (i: number, frac: number) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(C + R * frac * Math.cos(a)).toFixed(1)},${(C + R * frac * Math.sin(a)).toFixed(1)}`;
  };
  const poly = values.map((v, i) => pt(i, Math.max(0.04, v.pct / 100))).join(" ");
  return (
    <svg viewBox="0 0 150 150" className="radar" role="img" aria-label="توازن العبادات">
      {[0.33, 0.66, 1].map((f) => (
        <polygon
          key={f}
          points={values.map((_, i) => pt(i, f)).join(" ")}
          fill="none"
          stroke="#e2ebe4"
        />
      ))}
      {values.map((v, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return (
          <g key={v.category}>
            <line
              x1={C}
              y1={C}
              x2={C + R * Math.cos(a)}
              y2={C + R * Math.sin(a)}
              stroke="#e2ebe4"
            />
            <text
              x={C + (R + 16) * Math.cos(a)}
              y={C + (R + 16) * Math.sin(a)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="#718077"
            >
              {t(`cat.${v.category}`)} {v.pct}٪
            </text>
          </g>
        );
      })}
      <polygon points={poly} fill="rgba(23,116,94,0.18)" stroke="#17745e" strokeWidth="2" />
    </svg>
  );
}

export default function InsightsPage() {
  const t = useT();
  const { history, customs, allHabits, lang } = useWird();
  const todayId = useMemo(() => dayId(), []);
  const [periodDays, setPeriodDays] = useState(7);
  const deeds = useMemo(() => buildCatalog(customs), [customs]);

  const bars = useMemo(() => {
    const bucket = periodDays <= 14 ? 1 : 7;
    const days = lastNDays(history, periodDays, todayId);
    const out: { label: string; pct: number }[] = [];
    for (let i = 0; i < days.length; i += bucket) {
      const chunk = days.slice(i, i + bucket);
      const withData = chunk.filter((d) => d.ids.length > 0 || d.pages > 0);
      const pct =
        withData.length === 0
          ? 0
          : Math.round(
              (withData.reduce((s, d) => s + d.ids.length, 0) /
                (withData.length * Math.max(1, allHabits.length))) *
                100,
            );
      out.push({
        label: bucket === 1 ? (chunk[0]?.day.slice(5) ?? "") : `أسبوع ${out.length + 1}`,
        pct,
      });
    }
    return out;
  }, [history, periodDays, todayId, allHabits.length]);

  const metrics = useMemo(() => {
    const win = lastNDays(history, periodDays, todayId).filter((d) => d.ids.length > 0);
    const avg =
      win.length === 0
        ? 0
        : Math.round(
            (win.reduce((s, d) => s + d.ids.length, 0) /
              (win.length * Math.max(1, allHabits.length))) *
              100,
          );
    return {
      avg,
      witr: win.filter((d) => d.ids.includes("witr")).length,
      pages: win.reduce((s, d) => s + d.pages, 0),
      streak: dataStreak(history, (d) => d.ids.length > 0, todayId),
    };
  }, [history, periodDays, todayId, allHabits.length]);

  const strip = useMemo(() => lastNDays(history, 30, todayId), [history, todayId]);
  const balance = useMemo(
    () => categoryBalance(history, deeds, todayId, 7),
    [history, deeds, todayId],
  );
  const brief = useMemo(
    () => buildBrief(history, deeds, todayId, lang),
    [history, deeds, todayId, lang],
  );

  const yearStats = useMemo(() => {
    const curH = hijriParts(new Date(`${todayId}T12:00:00Z`));
    if (!curH) return null;
    const recs = Object.values(history).filter(
      (d) => hijriParts(new Date(`${d.day}T12:00:00Z`))?.year === curH.year,
    );
    if (recs.length === 0) return null;
    const active = recs.filter((d) => d.ids.length > 0);
    const pages = recs.reduce((s, d) => s + d.pages, 0);
    const scored = recs.filter((d) => d.score != null);
    const avg = scored.length
      ? Math.round(scored.reduce((s, d) => s + (d.score ?? 0), 0) / scored.length)
      : null;
    const witr = recs.filter((d) => d.ids.includes("witr")).length;
    const sortedDays = recs.map((d) => d.day).sort();
    let best = 0;
    let run = 0;
    let prev = "";
    for (const day of sortedDays) {
      const rec = history[day];
      const on = !!rec && rec.ids.length > 0;
      const cont = prev !== "" && Date.parse(day) - Date.parse(prev) === 86400000;
      run = on ? (cont ? run + 1 : 1) : 0;
      best = Math.max(best, run);
      prev = day;
    }
    const byMonth = new Map<string, { sum: number; n: number }>();
    for (const d of active) {
      const m = d.day.slice(0, 7);
      const e = byMonth.get(m) ?? { sum: 0, n: 0 };
      e.sum += d.ids.length / Math.max(1, allHabits.length);
      e.n += 1;
      byMonth.set(m, e);
    }
    let bestMonth: string | null = null;
    let bestAvg = -1;
    for (const [m, e] of byMonth) {
      const a = e.sum / e.n;
      if (a > bestAvg) {
        bestAvg = a;
        bestMonth = m;
      }
    }
    return { year: curH.year, days: active.length, pages, avg, witr, best, bestMonth };
  }, [history, todayId, allHabits.length]);

  return (
    <section className="destination-view">
      <div className="view-hero">
        <p className="eyebrow">{t("ins.heroE")}</p>
        <h2>{t("ins.heroT")}</h2>
        <p>{t("ins.heroS")}</p>
        <div className="periods">
          {PERIODS.map((p) => (
            <button
              type="button"
              key={p.k}
              onClick={() => setPeriodDays(p.n)}
              aria-pressed={periodDays === p.n}
              className={periodDays === p.n ? "selected" : ""}
            >
              {t(p.k)}
            </button>
          ))}
        </div>
      </div>
      <div className="metric-row">
        <article data-tilt>
          <span>{metrics.avg}٪</span>
          <p>{t("ins.avg")}</p>
          <small>{t("ins.avgS")}</small>
        </article>
        <article data-tilt>
          <span>{metrics.witr}</span>
          <p>{t("ins.witr")}</p>
          <small>{t("ins.witrS")}</small>
        </article>
        <article data-tilt>
          <span>{metrics.pages}</span>
          <p>{t("ins.pages")}</p>
          <small>{t("ins.pagesS")}</small>
        </article>
        <article data-tilt>
          <span>🔥 {metrics.streak}</span>
          <p>{t("ins.streak")}</p>
          <small>{t("ins.streakS")}</small>
        </article>
      </div>
      <div className="brief-card">
        <p className="eyebrow">{t("ins.coach")}</p>
        {brief.risks.length === 0 &&
        brief.neglect.length === 0 &&
        !brief.pace &&
        !brief.topLift &&
        !brief.praise ? (
          <p>{t("ins.warm")}</p>
        ) : (
          <ul>
            {brief.risks.map((r) => (
              <li key={r.id}>
                🛡 <b>{r.title}</b> {t("br.risk")} — {r.reason}
              </li>
            ))}
            {brief.neglect.map((n) => (
              <li key={n.id}>
                📉 <b>{n.title}</b> {t("br.neglect", { n: n.miss })}
              </li>
            ))}
            {brief.pace && (
              <li>
                🐢{" "}
                {t("br.pace", {
                  d: brief.pace.dropPct,
                  n: brief.pace.now.toFixed(1),
                  p: brief.pace.prev.toFixed(1),
                })}
              </li>
            )}
            {brief.topLift && (
              <li>
                💪 {t("br.liftA")} <b>{brief.topLift.title}</b>{" "}
                {t("br.liftB", { n: brief.topLift.lift.toFixed(1) })} — {t("br.protect")}
              </li>
            )}
            {brief.praise && <li>🌟 {brief.praise}</li>}
          </ul>
        )}
      </div>
      {yearStats && (
        <div className="brief-card year-card">
          <p className="eyebrow">
            {t("yr.title")} · {yearStats.year}هـ
          </p>
          <div className="metric-row">
            <article data-tilt>
              <span>{yearStats.days}</span>
              <p>{t("yr.days")}</p>
            </article>
            <article data-tilt>
              <span>{yearStats.pages}</span>
              <p>{t("yr.pages")}</p>
            </article>
            <article data-tilt>
              <span>
                {yearStats.avg ?? "—"}
                {yearStats.avg != null ? "٪" : ""}
              </span>
              <p>{t("yr.score")}</p>
            </article>
            <article data-tilt>
              <span>{yearStats.best}</span>
              <p>{t("yr.streak")}</p>
            </article>
          </div>
          <p className="year-line">
            🌙 {yearStats.witr} {t("yr.witr")}
            {yearStats.bestMonth ? ` · 🏆 ${t("yr.best")}: ${yearStats.bestMonth}` : ""}
          </p>
        </div>
      )}
      <div className="insight-grid">
        <article className="weekly-chart">
          <div>
            <p className="eyebrow">{t("ins.chartE")}</p>
            <h2>{t("ins.chartT")}</h2>
          </div>
          <div className="chart">
            {bars.length === 0 && <p className="chart-caption">{t("ins.chartEmpty")}</p>}
            {bars.map((b, i) => (
              <div key={i}>
                <i style={{ height: `${Math.max(4, b.pct)}%` }} />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="soft-insight radar-card">
          <p className="eyebrow">{t("ins.radarE")}</p>
          <h2>{t("ins.radarT")}</h2>
          <Radar values={balance} />
        </article>
      </div>
      <div className="badge-row">
        <p>{t("ins.stripT")}</p>
        <div className="day-strip">
          {strip.map((d) => {
            const pct =
              d.ids.length === 0
                ? -1
                : Math.round((d.ids.length / Math.max(1, allHabits.length)) * 100);
            return (
              <i
                key={d.day}
                title={`${d.day}: ${pct < 0 ? "لا بيانات" : `${pct}٪`}`}
                className={
                  pct < 0 ? "empty" : pct >= 70 ? "excellent" : pct >= 40 ? "good" : "partial"
                }
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
