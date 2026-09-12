"use client";

// Living prayer-day visual: a sun arc from the previous prayer to the next
// one, with a sun dot gliding as time passes. Pure SVG + theme vars, no
// animation loop needed (parent re-renders on its own tick). Static under
// prefers-reduced-motion by construction (position only, no keyframes).
// Screen readers get the same facts as text via aria-label.

import { useMemo } from "react";
import { dayArc, type PrayerTimes } from "../lib/prayer";
import { prayerName } from "../lib/i18n";
import { useWird, type Lang } from "./wird-store";

export function PrayerArc({ times, now }: { times: PrayerTimes; now: Date }) {
  const { lang }: { lang: Lang } = useWird();
  const arc = useMemo(() => dayArc(times, now), [times, now]);
  if (!arc) return null;
  // Semicircle: frac 0 = left horizon (previous prayer), 1 = right (next).
  const theta = Math.PI * (1 - arc.frac);
  const cx = 50 + 42 * Math.cos(theta);
  const cy = 48 - 42 * Math.sin(theta);
  const label = `${prayerName(lang, arc.prevId)} → ${prayerName(lang, arc.nextId)} · ${Math.round(arc.frac * 100)}%`;
  return (
    <svg className="prayer-arc" viewBox="0 0 100 54" role="img" aria-label={label}>
      <path
        d="M8,48 A42,42 0 0 1 92,48"
        fill="none"
        stroke="var(--line)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M8,48 A42,42 0 0 1 92,48"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="132"
        strokeDashoffset={132 * (1 - arc.frac)}
      />
      <circle cx={cx} cy={cy} r="5" className="arc-sun" />
      <text x="8" y="53" textAnchor="start" className="arc-label">
        {prayerName(lang, arc.prevId)}
      </text>
      <text x="92" y="53" textAnchor="end" className="arc-label">
        {prayerName(lang, arc.nextId)}
      </text>
    </svg>
  );
}
