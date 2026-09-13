// Private-plan in-the-moment tools (STEP 4): offline urge timer and
// emergency exits. Split from private-plan-tracker.tsx so files stay
// focused — the timer card already isolates its 1-second ticks by being
// its own component with its own state.
"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import type { TFn } from "./private-plan-detail";

const TIMER_PRESETS = [5, 10, 20];

export function TimerSection({
  t,
  setPendingStrategy,
  setThanks,
  scrollRef,
}: {
  t: TFn;
  scrollRef: RefObject<HTMLDivElement | null>;
  setPendingStrategy: (s: string | null) => void;
  setThanks: (v: boolean) => void;
}) {
  const [timerMin, setTimerMin] = useState(5);
  const [customMin, setCustomMin] = useState("");
  const [left, setLeft] = useState<number | null>(null);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  const startTimer = (mins: number) => {
    if (!Number.isFinite(mins) || mins <= 0 || mins > 180) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerDone(false);
    setThanks(false);
    setLeft(Math.round(mins * 60));
    intervalRef.current = setInterval(() => {
      setLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fmtClock = (s: number): string =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div ref={scrollRef}>
      <h3 className="pp-sec">{t("pp.timer")}</h3>
      <div className="pp-card pp-timer-card">
        <p className="backup-msg">{t("pp.timerDesc")}</p>
        <div className="backup-actions" role="group" aria-label={t("pp.timer")}>
          {TIMER_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={timerMin === m}
              className={timerMin === m ? "selected" : ""}
              onClick={() => setTimerMin(m)}
            >
              {t("pp.minutesFmt", { n: m })}
            </button>
          ))}
        </div>
        <label>
          {t("pp.logMinutes")}
          <input
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            inputMode="numeric"
            placeholder={t("pp.minutesPh")}
          />
        </label>
        <div className="backup-actions">
          <button
            type="button"
            onClick={() => {
              const m = customMin.trim() ? parseInt(customMin, 10) : timerMin;
              setCustomMin("");
              startTimer(m);
            }}
          >
            {t("pp.startTimer")}
          </button>
        </div>
        {left !== null && !timerDone && (
          <p className="pp-timer-hero" aria-live="polite" aria-label={t("pp.timerLeft")}>
            {fmtClock(left)}
          </p>
        )}
        {timerDone && (
          <p aria-live="polite">
            {t("pp.timerDone")}{" "}
            <button
              type="button"
              className="linklike"
              onClick={() => {
                setTimerDone(false);
                setLeft(null);
                setThanks(false);
                setPendingStrategy(t("pp.timer"));
              }}
            >
              {t("pp.didHelp")}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export function EmergencySection({
  t,
  onBack,
  onOpenTimer,
}: {
  t: TFn;
  onBack: () => void;
  onOpenTimer: () => void;
}) {
  const router = useRouter();
  return (
    <>
      <h3 className="pp-sec">{t("pp.emergency")}</h3>
      <div className="pp-card pp-emergency-card">
        <p className="backup-msg">{t("pp.emergencyDesc")}</p>
        <div className="backup-actions">
          <button type="button" onClick={() => router.push("/")}>
            {t("pp.leaveNow")}
          </button>
          <button type="button" onClick={onOpenTimer}>
            {t("pp.openTimer")}
          </button>
          <button type="button" className="linklike" onClick={onBack}>
            {t("pp.openPlan")}
          </button>
        </div>
      </div>
    </>
  );
}
