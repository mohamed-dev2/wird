"use client";

import { useState } from "react";

export function CalendarView({
  fridayAdded,
  onFridayAdd,
}: {
  fridayAdded: boolean;
  onFridayAdd: () => void;
}) {
  const [calDay, setCalDay] = useState<number | null>(null);
  const dates = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <section className="destination-view">
      <div className="calendar-heading">
        <div>
          <p className="eyebrow">ربيع الأول ١٤٤٨ هـ</p>
          <h2>تقويم رحلتك الهادئة</h2>
          <p>اضغط على أي يوم لتتذكر ما أنجزته فيه.</p>
        </div>
        <button type="button">‹ سبتمبر ٢٠٢٦ ›</button>
      </div>
      <div className="calendar-legend">
        <span>
          <i className="excellent" /> إنجاز ممتاز
        </span>
        <span>
          <i className="good" /> إنجاز جيد
        </span>
        <span>
          <i className="partial" /> إنجاز جزئي
        </span>
        <span>
          <i className="season" /> مناسبة
        </span>
      </div>
      <div className="calendar">
        <b>س</b>
        <b>ح</b>
        <b>ن</b>
        <b>ث</b>
        <b>ر</b>
        <b>خ</b>
        <b>ج</b>
        {dates.map((day) => (
          <button
            type="button"
            key={day}
            onClick={() => setCalDay(day)}
            aria-pressed={calDay === day}
            className={[
              day === 15
                ? "season"
                : day % 7 === 0
                  ? "excellent"
                  : day % 5 === 0
                    ? "good"
                    : day % 4 === 0
                      ? "partial"
                      : "",
              calDay === day ? "selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <strong>{day}</strong>
            {day === 15 && <small>أيام بيض</small>}
            {day === 5 && <small>جمعة</small>}
          </button>
        ))}
      </div>
      {calDay != null && (
        <p className="chart-caption">يوم {calDay}: سجّل وردك من صفحة اليوم، وسيُحفظ تقدمك هنا.</p>
      )}
      <article className="calendar-note">
        <span>☾</span>
        <div>
          <b>الجمعة القادمة</b>
          <p>سورة الكهف • الصلاة على النبي ﷺ • التبكير للصلاة</p>
        </div>
        <button type="button" onClick={onFridayAdd} aria-pressed={fridayAdded}>
          {fridayAdded ? "✓ أُضيفت للخطة" : "أضف لخطة الجمعة"}
        </button>
      </article>
    </section>
  );
}
