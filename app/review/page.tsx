// Review page (/review): tri-state nightly checklist + score/mood/gratitude.
// Submits write BOTH the per-day review record (enveloped) and the history
// merge. Includes one honest night-context line for strong/low/return days.

"use client";

import { useEffect, useMemo, useState } from "react";
import { dayId, hijriParts, loadFromStorage, QURAN_GOAL_PAGES, saveToStorage } from "../lib/wird";
import { assessUser, selectGuidance } from "../lib/companion";
import { useT } from "../lib/i18n";
import { useWird } from "../components/wird-store";

type Status = "done" | "partial" | "missed";
type Mood = "good" | "ok" | "low" | null;

type SavedReview = {
  items: Record<string, Status>;
  score: number;
  mood: Mood;
  gratitude: string;
};

const REVIEW_ONLY = [
  { id: "rev-anger", key: "rv.r1", weight: 2 },
  { id: "rev-backbite", key: "rv.r2", weight: 2 },
  { id: "rev-parents", key: "rv.r3", weight: 2 },
  { id: "rev-honesty", key: "rv.r4", weight: 2 },
  { id: "rev-kindness", key: "rv.r5", weight: 2 },
  { id: "rev-sleep", key: "rv.r6", weight: 2 },
];

const MOODS = [
  { id: "good", icon: "😊", key: "rv.mGood" },
  { id: "ok", icon: "😐", key: "rv.mOk" },
  { id: "low", icon: "😞", key: "rv.mLow" },
] as const;

const NEXT_STATUS: Record<Status, Status> = { missed: "done", done: "partial", partial: "missed" };

function statusLabel(t: (k: string) => string, s: Status): string {
  return s === "done" ? t("rv.stDone") : s === "partial" ? t("rv.stPart") : t("rv.stMiss");
}

function loadReviews(): Record<string, SavedReview> {
  // Enveloped + validated like every other dataset (bare legacy maps still
  // read; malformed entries are salvaged with quarantine, never trusted).
  return loadFromStorage<Record<string, SavedReview>>("wird-reviews-v1", {});
}

export default function ReviewPage() {
  const t = useT();
  const {
    done,
    quranPages,
    fastType,
    tasbeeh,
    allHabits,
    saveReview,
    history,
    challenges,
    isFriday,
    ramadan,
  } = useWird();
  const todayId = useMemo(() => dayId(), []);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [mood, setMood] = useState<Mood>(null);
  const [gratitude, setGratitude] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loadedScore, setLoadedScore] = useState(0);

  useEffect(() => {
    const saved = loadReviews()[todayId];
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once hydration of saved review
      setStatuses(saved.items);
      setMood(saved.mood);
      setGratitude(saved.gratitude);
      setLoadedScore(saved.score);
      setSubmitted(true);
    } else {
      setStatuses(Object.fromEntries(done.map((id) => [id, "done" as Status])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pagesStatus: Status =
    quranPages >= QURAN_GOAL_PAGES ? "done" : quranPages > 0 ? "partial" : "missed";
  const fastStatus: Status = fastType ? "done" : "missed";
  const tasbeehStatus: Status = tasbeeh >= 33 ? "done" : tasbeeh > 0 ? "partial" : "missed";

  const statusOf = (id: string, fallback: Status): Status => statuses[id] ?? fallback;
  const cycle = (id: string, fallback: Status) =>
    setStatuses((cur) => ({ ...cur, [id]: NEXT_STATUS[cur[id] ?? fallback] }));

  const { score, earned, total } = useMemo(() => {
    let e = 0;
    let t = 0;
    for (const h of allHabits) {
      t += h.points;
      const s = statusOf(h.id, done.includes(h.id) ? "done" : "missed");
      e += s === "done" ? h.points : s === "partial" ? h.points / 2 : 0;
    }
    const extra: [Status, number][] = [
      [statusOf("review-pages", pagesStatus), 4],
      [statusOf("review-fast", fastStatus), 3],
      [statusOf("review-tasbeeh", tasbeehStatus), 2],
      ...REVIEW_ONLY.map((r) => [statusOf(r.id, "missed"), r.weight] as [Status, number]),
    ];
    for (const [s, w] of extra) {
      t += w;
      e += s === "done" ? w : s === "partial" ? w / 2 : 0;
    }
    return { score: t === 0 ? 0 : Math.round((e / t) * 100), earned: e, total: t };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, done, quranPages, fastType, tasbeeh, allHabits]);

  const grade = score >= 85 ? t("rv.g85") : score >= 60 ? t("rv.g60") : t("rv.gLow");
  const gradeTitle =
    loadedScore >= 85 ? t("rv.g85") : loadedScore >= 60 ? t("rv.g60") : t("rv.gLow");

  // Night context (2.39): one honest line for the states that matter at
  // night — no card, no logging (Today owns the guidance log).
  const nightLine = useMemo(() => {
    try {
      const todayId = dayId();
      const inp = {
        today: todayId,
        hour: new Date().getHours(),
        isFriday,
        ramadan,
        hijriMonth: hijriParts(new Date())?.month ?? null,
        history,
        doneToday: done,
        totalToday: allHabits.length,
        lastSeen: loadFromStorage<string | null>("wird-lastseen-v1", null),
        createdDay: null,
        commitments: allHabits.length + challenges.length,
        deedIds: allHabits.map((h) => h.id),
        challengesDone: [],
        recentMoods: [],
        gratitudeRecent: false,
        hasKids: false,
      };
      const g = selectGuidance(assessUser(inp), inp, []);
      if (!g) return null;
      if (!["STRONG_DAY", "LOW_DAY", "RETURNING", "REBUILDING", "RECOVERY_DAY"].includes(g.state)) {
        return null;
      }
      return t(g.bodyKey, g.vars);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- night snapshot per mount/day
  }, []);

  const submit = () => {
    const rec = { items: { ...statuses }, score, mood, gratitude };
    try {
      const all = loadReviews();
      all[todayId] = rec;
      saveToStorage("wird-reviews-v1", all);
    } catch {}
    saveReview({ day: todayId, ids: done, pages: quranPages, score, mood: mood ?? undefined });
    setLoadedScore(score);
    setSubmitted(true);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  };

  if (submitted) {
    return (
      <section className="destination-view">
        <div className="view-hero review-done">
          <p className="eyebrow">{t("rv.heroE")}</p>
          <h2>{gradeTitle}</h2>
          <p>
            {t("rv.score")} {loadedScore}٪ — {earned} {t("rv.pts")}. {grade}
          </p>
          <div className="review-actions">
            <button type="button" onClick={() => setSubmitted(false)}>
              {t("rv.edit")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const autoRows = [
    ...allHabits.map((h) => ({
      id: h.id,
      title: h.title,
      detail: h.detail ?? `+${h.points}`,
      fallback: (done.includes(h.id) ? "done" : "missed") as Status,
    })),
    {
      id: "review-pages",
      title: t("rv.pagesT"),
      detail: t("rv.pagesD", { p: quranPages, g: QURAN_GOAL_PAGES }),
      fallback: pagesStatus,
    },
    {
      id: "review-fast",
      title: t("rv.fastT"),
      detail: fastType ? t("rv.fastOn", { f: fastType }) : t("rv.fastOff"),
      fallback: fastStatus,
    },
    {
      id: "review-tasbeeh",
      title: t("rv.tasT"),
      detail: `${tasbeeh} / ٣٣`,
      fallback: tasbeehStatus,
    },
  ];

  return (
    <section className="destination-view">
      <div className="view-hero">
        <p className="eyebrow">{t("rv.heroE")}</p>
        <h2>{t("rv.heroT")}</h2>
        <p>{t("rv.heroS")}</p>
        {nightLine && <p className="cm-why">{nightLine}</p>}
        <div className="review-progress">
          <b>{score}٪</b>
          <span>
            {earned} {t("quran.of")} {total} {t("rv.pts")} · {grade}
          </span>
        </div>
      </div>
      <div className="review-list">
        {autoRows.map((row) => {
          const s = statusOf(row.id, row.fallback);
          return (
            <button
              type="button"
              key={row.id}
              onClick={() => cycle(row.id, row.fallback)}
              aria-pressed={s === "done"}
              className={`review-row ${s}`}
            >
              <span className="review-check">
                {s === "done" ? "✓" : s === "partial" ? "◐" : ""}
              </span>
              <span className="review-text">
                <b>{row.title}</b>
                <small>{row.detail}</small>
              </span>
              <em>{statusLabel(t, s)}</em>
            </button>
          );
        })}
      </div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t("rv.heartE")}</p>
          <h2>{t("rv.heartT")}</h2>
        </div>
      </div>
      <div className="review-list">
        {REVIEW_ONLY.map((r) => {
          const s = statusOf(r.id, "missed");
          return (
            <button
              type="button"
              key={r.id}
              onClick={() => cycle(r.id, "missed")}
              aria-pressed={s === "done"}
              className={`review-row ${s}`}
            >
              <span className="review-check">
                {s === "done" ? "✓" : s === "partial" ? "◐" : ""}
              </span>
              <span className="review-text">
                <b>{t(r.key)}</b>
              </span>
              <em>{statusLabel(t, s)}</em>
            </button>
          );
        })}
      </div>
      <div className="review-foot">
        <div className="mood-row">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMood(mood === m.id ? null : m.id)}
              aria-pressed={mood === m.id}
              className={mood === m.id ? "selected" : ""}
            >
              {m.icon} {t(m.key)}
            </button>
          ))}
        </div>
        <textarea
          value={gratitude}
          onChange={(e) => setGratitude(e.target.value)}
          placeholder={t("rv.gratPh")}
          aria-label={t("rv.gratAria")}
        />
        <button type="button" className="review-submit" onClick={submit}>
          {t("rv.submit")}
        </button>
      </div>
    </section>
  );
}
