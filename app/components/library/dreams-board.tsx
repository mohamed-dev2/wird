"use client";

import type { Dispatch, SetStateAction } from "react";

export type Dream = {
  id: string;
  title: string;
  target: string;
  steps: { text: string; done: boolean }[];
};

function ask(msg: string): string | null {
  try {
    const v = window.prompt(msg)?.trim();
    return v ? v : null;
  } catch {
    return null;
  }
}

export function DreamsBoard({
  dreams,
  setDreams,
}: {
  dreams: Dream[];
  setDreams: Dispatch<SetStateAction<Dream[]>>;
}) {
  const addDream = () => {
    const title = ask("حلمك الكبير؟ (مثال: حج ٢٠٢٨، حفظ البقرة)");
    if (!title) return;
    const target = ask("الموعد المستهدف؟ (مثال: رمضان ١٤٤٨)") ?? "";
    const step = ask("أول خطوة صغيرة اليوم؟ (مثال: صفحتان يوميًا)");
    setDreams((cur) => [
      ...cur,
      {
        id: `dream-${Date.now()}`,
        title,
        target,
        steps: step ? [{ text: step, done: false }] : [],
      },
    ]);
  };
  const addStep = (id: string) => {
    const text = ask("الخطوة التالية؟");
    if (!text) return;
    setDreams((cur) =>
      cur.map((d) => (d.id === id ? { ...d, steps: [...d.steps, { text, done: false }] } : d)),
    );
  };
  const toggleStep = (id: string, i: number) =>
    setDreams((cur) =>
      cur.map((d) =>
        d.id === id
          ? { ...d, steps: d.steps.map((s, j) => (j === i ? { ...s, done: !s.done } : s)) }
          : d,
      ),
    );
  const removeDream = (id: string) => {
    try {
      if (!window.confirm("حذف هذا الحلم؟")) return;
    } catch {}
    setDreams((cur) => cur.filter((d) => d.id !== id));
  };

  if (dreams.length === 0)
    return (
      <div className="lib-empty">
        <p>لا أحلام مسجلة بعد. الحلم الكبير يبدأ بخطوة صغيرة اليوم.</p>
        <button type="button" onClick={addDream}>
          + سجّل حلمك
        </button>
      </div>
    );

  return (
    <div className="dreams-board">
      {dreams.map((d) => {
        const pct =
          d.steps.length === 0
            ? 0
            : Math.round((d.steps.filter((s) => s.done).length / d.steps.length) * 100);
        return (
          <article key={d.id} className="dream-card">
            <div className="path-head">
              <b>🌟 {d.title}</b>
              <button
                type="button"
                className="linklike"
                onClick={() => removeDream(d.id)}
                aria-label="حذف الحلم"
              >
                ✕
              </button>
            </div>
            {d.target && <small className="dream-target">🎯 {d.target}</small>}
            <div className="tiny-progress">
              <i style={{ width: `${pct}%` }} />
            </div>
            {d.steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleStep(d.id, i)}
                aria-pressed={s.done}
                className={`path-book${s.done ? " done" : ""}`}
              >
                <span className="review-check">{s.done ? "✓" : ""}</span>
                <span className="review-text">
                  <b>{s.text}</b>
                </span>
              </button>
            ))}
            <button type="button" className="linklike" onClick={() => addStep(d.id)}>
              + خطوة جديدة
            </button>
          </article>
        );
      })}
      <button type="button" className="goal-add" onClick={addDream}>
        + حلم جديد
      </button>
    </div>
  );
}
