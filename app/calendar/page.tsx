// Calendar route (/calendar): computes return/milestone markers from local
// analytics, then renders CalendarView. Markers are advisory dots, never
// judgments — see docs/ANALYTICS.md language rules.
"use client";

import { useMemo } from "react";
import { useWird } from "../components/wird-store";
import { CalendarView } from "../components/views/calendar";
import { dayId } from "../lib/wird";
import { detectMilestones, detectReturns } from "../lib/analytics";

export default function CalendarPage() {
  const { fridayAdded, setFridayAdded, history, challenges } = useWird();
  // Real-data markers (AD): return dates + milestone dates, keyed by full
  // dayId so month navigation stays correct.
  const markers = useMemo(() => {
    const today = dayId();
    const events = detectReturns(history, today);
    const sessions = Object.values(history).filter((r) => r.pages > 0).length;
    const ms = detectMilestones({
      history,
      challenges,
      quranSessions: sessions,
      endDay: today,
      events,
    });
    const out: Record<string, ("return" | "milestone")[]> = {};
    const add = (day: string | null, kind: "return" | "milestone") => {
      if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
      const list = out[day] ?? [];
      if (!list.includes(kind)) list.push(kind);
      out[day] = list;
    };
    for (const e of events) add(e.returnDay, "return");
    for (const m of ms) {
      if (m.reached) add(m.day, "milestone");
    }
    return out;
  }, [history, challenges]);
  return (
    <CalendarView
      fridayAdded={fridayAdded}
      onFridayAdd={() => setFridayAdded((v) => !v)}
      markers={markers}
    />
  );
}
