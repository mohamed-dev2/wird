"use client";

import { useState } from "react";
import { useT } from "../../lib/i18n";
import { EditModal } from "../edit-modal";

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
  const t = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const addDream = () => {
    const title = ask(t("dr.askT"));
    if (!title) return;
    const target = ask(t("dr.askTar")) ?? "";
    const step = ask(t("dr.askFirst"));
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
    const text = ask(t("dr.askStep"));
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
      if (!window.confirm(t("dr.del"))) return;
    } catch {}
    setDreams((cur) => cur.filter((d) => d.id !== id));
  };

  if (dreams.length === 0)
    return (
      <div className="lib-empty">
        <p>{t("dr.empty")}</p>
        <button type="button" onClick={addDream}>
          {t("dr.add")}
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
              <span>
                <button
                  type="button"
                  className="mini-edit"
                  aria-label={t("modal.edit")}
                  onClick={() => setEditingId(d.id)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="linklike"
                  onClick={() => removeDream(d.id)}
                  aria-label={t("dr.delAria")}
                >
                  ✕
                </button>
              </span>
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
              {t("dr.stepNew")}
            </button>
          </article>
        );
      })}
      <button type="button" className="goal-add" onClick={addDream}>
        {t("dr.new")}
      </button>
      {(() => {
        const d = dreams.find((x) => x.id === editingId);
        if (!d) return null;
        return (
          <EditModal
            title={t("modal.dreamT")}
            fields={[
              { key: "title", label: t("modal.customL"), value: d.title },
              { key: "target", label: t("modal.dreamTar"), value: d.target },
            ]}
            onClose={() => setEditingId(null)}
            onDelete={() => {
              removeDream(d.id);
              setEditingId(null);
            }}
            onSave={(vals) =>
              setDreams((cur) =>
                cur.map((x) =>
                  x.id === d.id
                    ? {
                        ...x,
                        title: vals.title?.trim() || x.title,
                        target: vals.target?.trim() ?? x.target,
                      }
                    : x,
                ),
              )
            }
          />
        );
      })()}
    </div>
  );
}
