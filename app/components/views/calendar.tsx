// CalendarView: 30-day grid with intensity classes + optional return /
// milestone markers (passed in, computed from analytics in the route).
// Presentational only — date math lives in the caller.
"use client";

import { useState } from "react";
import { useT } from "../../lib/i18n";
import { useWird } from "../wird-store";

export function CalendarView({
  fridayAdded,
  onFridayAdd,
  markers,
}: {
  fridayAdded: boolean;
  onFridayAdd: () => void;
  markers?: Record<string, ("return" | "milestone")[]>;
}) {
  const t = useT();
  const { lang } = useWird();
  const [calDay, setCalDay] = useState<number | null>(null);
  const [monthOff, setMonthOff] = useState(0);
  const dates = Array.from({ length: 30 }, (_, i) => i + 1);
  const now = new Date();
  const refMonth = new Date(now.getFullYear(), now.getMonth() + monthOff, 1);
  const shift = ((monthOff % 7) + 7) % 7;
  const hijriHead = (() => {
    try {
      return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-ca-islamic" : "en-u-ca-islamic", {
        month: "long",
        year: "numeric",
      }).format(refMonth);
    } catch {
      return "";
    }
  })();
  const gregHead = (() => {
    try {
      return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en", {
        month: "long",
        year: "numeric",
      }).format(refMonth);
    } catch {
      return "";
    }
  })();
  return (
    <section className="destination-view">
      <div className="calendar-heading">
        <div>
          <p className="eyebrow" suppressHydrationWarning>
            {hijriHead}
          </p>
          <h2>{t("cal.title")}</h2>
          <p>{t("cal.sub")}</p>
        </div>
        <div className="calendar-nav">
          <button type="button" onClick={() => setMonthOff((m) => m - 1)} aria-label="‹">
            ›
          </button>
          <button type="button" suppressHydrationWarning>
            {gregHead}
          </button>
          <button type="button" onClick={() => setMonthOff((m) => m + 1)} aria-label="›">
            ‹
          </button>
        </div>
      </div>
      <div className="calendar-legend">
        <span>
          <i className="excellent" /> {t("cal.excellent")}
        </span>
        <span>
          <i className="good" /> {t("cal.good")}
        </span>
        <span>
          <i className="partial" /> {t("cal.partial")}
        </span>
        <span>
          <i className="season" /> {t("cal.season")}
        </span>
        <span>
          <i className="mark-return" /> {t("cal.return")}
        </span>
        <span>
          <i className="mark-milestone" /> {t("cal.milestone")}
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
                : (day + shift) % 7 === 0
                  ? "excellent"
                  : (day + shift) % 5 === 0
                    ? "good"
                    : (day + shift) % 4 === 0
                      ? "partial"
                      : "",
              calDay === day ? "selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <strong>{day}</strong>
            {day === 15 && <small>{t("cal.white")}</small>}
            {day === 5 && <small>{t("cal.friday")}</small>}
            {(() => {
              const key = `${refMonth.getFullYear()}-${String(refMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const marks = markers?.[key] ?? [];
              if (marks.length === 0) return null;
              return (
                <small>
                  {marks.includes("return") ? `· ${t("cal.return")}` : ""}
                  {marks.includes("milestone") ? ` ★ ${t("cal.milestone")}` : ""}
                </small>
              );
            })()}
          </button>
        ))}
      </div>
      {calDay != null && <p className="chart-caption">{t("cal.dayNote", { d: calDay })}</p>}
      <article className="calendar-note">
        <span>☾</span>
        <div>
          <b>{t("cal.fridayNote")}</b>
          <p>{t("cal.fridaySub")}</p>
        </div>
        <button type="button" onClick={onFridayAdd} aria-pressed={fridayAdded}>
          {fridayAdded ? t("cal.added") : t("cal.add")}
        </button>
      </article>
    </section>
  );
}
