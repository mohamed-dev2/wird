"use client";

import { useEffect, useMemo, useState } from "react";
import { dayId, QURAN_GOAL_PAGES } from "../lib/wird";
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
  { id: "rev-anger", title: "ملكت غضبي اليوم", weight: 2 },
  { id: "rev-backbite", title: "حفظت لساني من الغيبة", weight: 2 },
  { id: "rev-parents", title: "بررت والديّ (اتصال/زيارة/دعاء)", weight: 2 },
  { id: "rev-honesty", title: "صدقت في عملي وكلامي", weight: 2 },
  { id: "rev-kindness", title: "فعلت إحسانًا (صدقة/مساعدة)", weight: 2 },
  { id: "rev-sleep", title: "نمت مبكرًا بنية الفجر", weight: 2 },
];

const MOODS = [
  { id: "good", icon: "😊", label: "مشرق" },
  { id: "ok", icon: "😐", label: "عادي" },
  { id: "low", icon: "😞", label: "متعب" },
] as const;

const STATUS_LABEL: Record<Status, string> = { done: "✓ تم", partial: "◐ جزئي", missed: "○ فات" };
const NEXT_STATUS: Record<Status, Status> = { missed: "done", done: "partial", partial: "missed" };

function loadReviews(): Record<string, SavedReview> {
  try {
    const raw = localStorage.getItem("wird-reviews-v1");
    if (!raw) return {};
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" ? (v as Record<string, SavedReview>) : {};
  } catch {
    return {};
  }
}

export default function ReviewPage() {
  const { done, quranPages, fastType, tasbeeh, allHabits, saveReview } = useWird();
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

  const grade =
    score >= 85 ? "يوم مشرق 🌟" : score >= 60 ? "يوم ثابت 🤍" : "يوم متعثر — وغدًا صفحة جديدة 🌱";

  const submit = () => {
    const rec = { items: { ...statuses }, score, mood, gratitude };
    try {
      const all = loadReviews();
      all[todayId] = rec;
      localStorage.setItem("wird-reviews-v1", JSON.stringify(all));
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
          <p className="eyebrow">حصاد اليوم</p>
          <h2>
            {loadedScore >= 85 ? "يوم مشرق 🌟" : loadedScore >= 60 ? "يوم ثابت 🤍" : "تقبل الله 🤲"}
          </h2>
          <p>
            درجتك {loadedScore}٪ — {earned} نقطة. {grade}
          </p>
          <div className="review-actions">
            <button type="button" onClick={() => setSubmitted(false)}>
              مراجعة اليوم مرة أخرى
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
      title: "ورد القرآن",
      detail: `${quranPages} من ${QURAN_GOAL_PAGES} صفحة`,
      fallback: pagesStatus,
    },
    {
      id: "review-fast",
      title: "الصيام",
      detail: fastType ?? "لست صائمًا",
      fallback: fastStatus,
    },
    {
      id: "review-tasbeeh",
      title: "الذكر السريع",
      detail: `${tasbeeh} / ٣٣`,
      fallback: tasbeehStatus,
    },
  ];

  return (
    <section className="destination-view">
      <div className="view-hero">
        <p className="eyebrow">حصاد اليوم · دقيقة واحدة قبل النوم</p>
        <h2>ماذا فعلت اليوم؟</h2>
        <p>كل ما سجلته موجود مسبقًا — أكّد ما تم، وصحح ما فات.</p>
        <div className="review-progress">
          <b>{score}٪</b>
          <span>
            {earned} من {total} نقطة · {grade}
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
              <em>{STATUS_LABEL[s]}</em>
            </button>
          );
        })}
      </div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">مراجعة القلب</p>
          <h2>كيف عشت يومك؟</h2>
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
                <b>{r.title}</b>
              </span>
              <em>{STATUS_LABEL[s]}</em>
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
              {m.icon} {m.label}
            </button>
          ))}
        </div>
        <textarea
          value={gratitude}
          onChange={(e) => setGratitude(e.target.value)}
          placeholder="نعمة واحدة تشكر الله عليها اليوم…"
          aria-label="نعمة اليوم"
        />
        <button type="button" className="review-submit" onClick={submit}>
          اختم يومك 🌙
        </button>
      </div>
    </section>
  );
}
