"use client";

import { useWird } from "../components/wird-store";
import { CalendarView } from "../components/views/calendar";

export default function CalendarPage() {
  const { fridayAdded, setFridayAdded } = useWird();
  return <CalendarView fridayAdded={fridayAdded} onFridayAdd={() => setFridayAdded((v) => !v)} />;
}
