"use client";

import { useMemo, useState } from "react";
import { dataStreak, lastNDays } from "../lib/history";
import { buildBrief, buildCatalog, categoryBalance, type Category } from "../lib/coach";
import { dayId } from "../lib/wird";
import { useWird } from "../components/wird-store";

const PERIODS: [string, number][] = [
  ["اليوم", 1],
  ["آخر ٧ أيام", 7],
  ["أسبوعان", 14],
  ["الشهر الحالي", 30],
  ["٣ أشهر", 90],
  ["الموسم", 180],
  ["السنة", 365],
];

const CAT_LABEL: Record<Category, string> = {
  salah: "صلاة",
  quran: "قرآن",
  dhikr: "ذكر",
  knowledge: "علم",
  character: "خلق",
  family: "أسرة",
};

function Radar({ values }: { values: { category: Category; pct: number }[] }) {
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
              {CAT_LABEL[v.category]} {v.pct}٪
            </text>
          </g>
        );
      })}
      <polygon points={poly} fill="rgba(23,116,94,0.18)" stroke="#17745e" strokeWidth="2" />
    </svg>
  );
}

export default function InsightsPage() {
  const { history, customs, allHabits } = useWird();
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
  const brief = useMemo(() => buildBrief(history, deeds, todayId), [history, deeds, todayId]);

  return (
    <section className="destination-view">
      <div className="view-hero">
        <p className="eyebrow">تقدّمك من بياناتك — لا تخمين</p>
        <h2>خطواتك الهادئة تصنع أثرًا</h2>
        <p>اختر الفترة التي تود أن تتأملها، بلا مقارنة ولا لوم.</p>
        <div className="periods">
          {PERIODS.map(([label, n]) => (
            <button
              type="button"
              key={label}
              onClick={() => setPeriodDays(n)}
              aria-pressed={periodDays === n}
              className={periodDays === n ? "selected" : ""}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="metric-row">
        <article>
          <span>{metrics.avg}٪</span>
          <p>متوسط إنجازك</p>
          <small>في الفترة المختارة</small>
        </article>
        <article>
          <span>{metrics.witr}</span>
          <p>ليالي الوتر</p>
          <small>عادة ثابتة وجميلة</small>
        </article>
        <article>
          <span>{metrics.pages}</span>
          <p>صفحة قرآن</p>
          <small>مجموع الفترة</small>
        </article>
        <article>
          <span>🔥 {metrics.streak}</span>
          <p>سلسلة الالتزام</p>
          <small>يومًا متتاليًا</small>
        </article>
      </div>
      <div className="brief-card">
        <p className="eyebrow">مدربك الخاص ✦</p>
        {brief.risks.length === 0 &&
        brief.neglect.length === 0 &&
        !brief.pace &&
        !brief.topLift &&
        !brief.praise ? (
          <p>سجّل أيامًا أكثر ليبدأ التحليل الخبير — نحتاج ١٤ يومًا على الأقل.</p>
        ) : (
          <ul>
            {brief.risks.map((r) => (
              <li key={r.id}>
                🛡 <b>{r.title}</b> معرّض الليلة — {r.reason}
              </li>
            ))}
            {brief.neglect.map((n) => (
              <li key={n.id}>
                📉 <b>{n.title}</b> فاتك {n.miss} أيام متتالية
              </li>
            ))}
            {brief.pace && (
              <li>
                🐢 سرعة القرآن نزلت {brief.pace.dropPct}٪ عن معتادك ({brief.pace.now.toFixed(1)}{" "}
                مقابل {brief.pace.prev.toFixed(1)} صفحة/يوم)
              </li>
            )}
            {brief.topLift && (
              <li>
                💪 أيام <b>{brief.topLift.title}</b> ترفع بقية يومك +{brief.topLift.lift.toFixed(1)}{" "}
                — احمِ هذه أولًا
              </li>
            )}
            {brief.praise && <li>🌟 {brief.praise}</li>}
          </ul>
        )}
      </div>
      <div className="insight-grid">
        <article className="weekly-chart">
          <div>
            <p className="eyebrow">نظرة على الفترة</p>
            <h2>إنجازك اليومي</h2>
          </div>
          <div className="chart">
            {bars.length === 0 && (
              <p className="chart-caption">لا بيانات بعد — ابدأ التسجيل اليوم.</p>
            )}
            {bars.map((b, i) => (
              <div key={i}>
                <i style={{ height: `${Math.max(4, b.pct)}%` }} />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="soft-insight radar-card">
          <p className="eyebrow">توازن الأسبوع</p>
          <h2>أين يقف كل باب؟</h2>
          <Radar values={balance} />
        </article>
      </div>
      <div className="badge-row">
        <p>آخر ٣٠ يومًا</p>
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
