// NowView: "what fits right now" quick list driven by the current moment
// (prayer countdown context). Read-only suggestions — toggling still goes
// through the store so history stays the single source of truth.
"use client";

import { useT } from "../../lib/i18n";

export function NowView({
  done,
  toggle,
  partial,
  snoozed,
  onPartial,
  onSnooze,
  onAdd,
}: {
  done: string[];
  toggle: (id: string) => void;
  partial: string[];
  snoozed: string[];
  onPartial: (id: string) => void;
  onSnooze: (id: string) => void;
  onAdd: () => void;
}) {
  const t = useT();
  const items = [
    { id: "fajr-jamaa", title: t("nw.i1t"), detail: t("nw.i1d") },
    { id: "after-fajr", title: t("nw.i2t"), detail: t("nw.i2d") },
    { id: "morning", title: t("nw.i3t"), detail: t("nw.i3d") },
    { id: "quran", title: t("nw.i4t"), detail: t("nw.i4d") },
  ].filter((item) => !snoozed.includes(item.id));
  return (
    <section className="now-view">
      <div className="now-header">
        <div>
          <p className="eyebrow">{t("now.eyebrow")}</p>
          <h2>{t("now.title")}</h2>
          <p>{t("now.sub")}</p>
        </div>
        <span>☀</span>
      </div>
      <div className="now-list">
        {items.map((item) => (
          <article key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-pressed={done.includes(item.id)}
              className={
                done.includes(item.id)
                  ? "now-check ready"
                  : partial.includes(item.id)
                    ? "now-check partial"
                    : "now-check"
              }
            >
              {done.includes(item.id) ? "✓" : partial.includes(item.id) ? "◐" : ""}
            </button>
            <div>
              <b>{item.title}</b>
              <small>{item.detail}</small>
            </div>
            <div className="quick-status">
              <button type="button" onClick={() => toggle(item.id)}>
                {t("now.done")}
              </button>
              <button type="button" onClick={() => onPartial(item.id)}>
                {t("now.partial")}
              </button>
              <button type="button" onClick={() => onSnooze(item.id)}>
                {t("now.later")}
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="now-footer">
        <span>{t("now.foot")}</span>
        <button type="button" onClick={onAdd}>
          {t("now.add")}
        </button>
      </div>
    </section>
  );
}
