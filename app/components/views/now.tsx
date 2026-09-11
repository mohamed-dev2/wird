"use client";

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
  const items = [
    { id: "fajr-jamaa", title: "صلاة الفجر", detail: "في وقتها · جماعة" },
    { id: "after-fajr", title: "أذكار بعد الصلاة", detail: "دقيقتان بهدوء" },
    { id: "morning", title: "أذكار الصباح", detail: "٦ من ١٠" },
    { id: "quran", title: "ورد القرآن", detail: "صفحتان من ٤" },
  ].filter((item) => !snoozed.includes(item.id));
  return (
    <section className="now-view">
      <div className="now-header">
        <div>
          <p className="eyebrow">ما يناسب وقتك الآن</p>
          <h2>بعد الفجر، بداية مباركة</h2>
          <p>أربع خطوات فقط. خذ منها ما تيسر لك.</p>
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
                ✅ تم
              </button>
              <button type="button" onClick={() => onPartial(item.id)}>
                ◐ جزئيًا
              </button>
              <button type="button" onClick={() => onSnooze(item.id)}>
                ↷ لاحقًا
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="now-footer">
        <span>ما زال في اليوم خير كثير.</span>
        <button type="button" onClick={onAdd}>
          + أضف عبادة
        </button>
      </div>
    </section>
  );
}
