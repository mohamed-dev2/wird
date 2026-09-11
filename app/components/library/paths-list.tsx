"use client";

import { useState } from "react";
import { PATHS } from "../../lib/data/paths";
import { useStoredState } from "../../lib/use-stored-state";
import { useT } from "../../lib/i18n";

export function PathsList() {
  const t = useT();
  const [science, setScience] = useState(PATHS[0]?.id ?? "aqeedah");
  const [done, setDone] = useStoredState<Record<string, boolean>>("wird-paths-v1", {});
  const [customTitles, setCustomTitles] = useStoredState<string[]>("wird-paths-custom-v1", []);

  const path = PATHS.find((p) => p.id === science) ?? PATHS[0];
  if (!path) return null;

  const toggle = (id: string) => setDone((cur) => ({ ...cur, [id]: !cur[id] }));
  const askTitle = () => {
    try {
      const v = window.prompt(t("pa.ask"))?.trim();
      if (v) setCustomTitles((cur) => (cur.includes(v) ? cur : [...cur, v]));
    } catch {}
  };

  return (
    <div className="paths-list">
      <div className="book-chips">
        {PATHS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setScience(p.id)}
            aria-pressed={science === p.id}
            className={science === p.id ? "selected" : ""}
          >
            {p.icon} {p.science}
          </button>
        ))}
      </div>
      {path.levels.map((lv, li) => {
        const ids = lv.books.map((b) => `${path.id}-${li}-${b.id}`);
        const doneCount = ids.filter((id) => done[id]).length;
        return (
          <article key={lv.level} className="path-level">
            <div className="path-head">
              <b>{lv.level}</b>
              <span>
                {doneCount}/{ids.length}
              </span>
            </div>
            <div className="tiny-progress">
              <i
                style={{
                  width: `${ids.length === 0 ? 0 : Math.round((doneCount / ids.length) * 100)}%`,
                }}
              />
            </div>
            {lv.books.map((b) => {
              const id = `${path.id}-${li}-${b.id}`;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  aria-pressed={!!done[id]}
                  className={`path-book${done[id] ? " done" : ""}`}
                >
                  <span className="review-check">{done[id] ? "✓" : ""}</span>
                  <span className="review-text">
                    <b>{b.title}</b>
                    <small>
                      {b.author} · {b.why} · ≈{b.weeks} أسابيع
                    </small>
                  </span>
                </button>
              );
            })}
            {li === 0 &&
              customTitles.map((title) => (
                <div key={title} className="path-book custom">
                  <span className="review-text">
                    <b>{title}</b>
                    <small>{t("pa.mine")}</small>
                  </span>
                </div>
              ))}
            {li === 0 && (
              <button type="button" className="linklike" onClick={askTitle}>
                {t("pa.add")}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
