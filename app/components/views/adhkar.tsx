"use client";

import { useEffect, useState } from "react";
import { dayId, loadDailyNumber, loadFromStorage, saveToStorage } from "../../lib/wird";
import { useT } from "../../lib/i18n";

const GROUPS = [
  { icon: "☀", titleKey: "ad.g1t", descKey: "ad.g1d" },
  { icon: "◐", titleKey: "ad.g2t", descKey: "ad.g2d" },
  { icon: "☾", titleKey: "ad.g3t", descKey: "ad.g3d" },
  { icon: "⌂", titleKey: "ad.g4t", descKey: "ad.g4d" },
] as const;

const GROUP_ADHKAR: Record<string, { text: string; target: number }[]> = {
  "ad.g1t": [
    { text: "أصبحنا وأصبح الملك لله", target: 1 },
    { text: "اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت", target: 1 },
    { text: "رضيت بالله ربًا وبالإسلام دينًا", target: 3 },
  ],
  "ad.g2t": [
    { text: "أستغفر الله", target: 3 },
    { text: "اللهم أعني على ذكرك وشكرك وحسن عبادتك", target: 1 },
    { text: "آية الكرسي", target: 1 },
  ],
  "ad.g3t": [
    { text: "أمسينا وأمسى الملك لله", target: 1 },
    { text: "باسمك اللهم أموت وأحيا", target: 1 },
    { text: "المعوذات", target: 3 },
  ],
  "ad.g4t": [
    { text: "بسم الله", target: 1 },
    { text: "أعوذ بكلمات الله التامات من شر ما خلق", target: 3 },
    { text: "سبحان الذي سخر لنا هذا", target: 1 },
  ],
};

export function AdhkarView() {
  const t = useT();
  const [salawat, setSalawat] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once hydration of stored counter
    setSalawat(loadDailyNumber("wird-salawat-v2", 0, dayId()));
    try {
      // Enveloped read (legacy bare maps still load; malformed → fallback).
      const stored = loadFromStorage<{ day?: string; counts?: Record<string, number> }>(
        "wird-adhkar-groups-v1",
        { day: "", counts: {} },
      );
      if (stored.day === dayId() && stored.counts) setGroupCounts(stored.counts);
    } catch {}
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted) saveToStorage("wird-salawat-v2", { day: dayId(), value: salawat });
  }, [mounted, salawat]);
  useEffect(() => {
    if (!mounted) return;
    saveToStorage("wird-adhkar-groups-v1", { day: dayId(), counts: groupCounts });
    // Daily history log (capped): enables adhkar trends without touching
    // the live envelope. Written only when today's snapshot changed.
    try {
      const t = dayId();
      const log = loadFromStorage<Record<string, Record<string, number>>>("wird-adhkar-log-v1", {});
      if (JSON.stringify(log[t] ?? null) !== JSON.stringify(groupCounts)) {
        const next = { ...log, [t]: { ...groupCounts } };
        const keys = Object.keys(next).sort();
        while (keys.length > 180) {
          const oldest = keys.shift();
          if (oldest) delete next[oldest];
        }
        saveToStorage("wird-adhkar-log-v1", next);
      }
    } catch {}
  }, [mounted, groupCounts]);
  return (
    <section className="destination-view adhkar-view">
      <div className="view-hero">
        <p className="eyebrow">{t("ad.heroE")}</p>
        <h2>{t("ad.heroT")}</h2>
        <p>{t("ad.heroS")}</p>
      </div>
      <div className="adhkar-groups">
        {GROUPS.map(({ icon, titleKey, descKey }) => (
          <button
            type="button"
            key={titleKey}
            onClick={() => setGroup((g) => (g === titleKey ? null : titleKey))}
            aria-pressed={group === titleKey}
            className={group === titleKey ? "selected" : ""}
          >
            <span>{icon}</span>
            <div>
              <b>{t(titleKey)}</b>
              <small>{t(descKey)}</small>
            </div>
            <i>‹</i>
          </button>
        ))}
      </div>
      {group && (
        <div className="review-list">
          {(GROUP_ADHKAR[group] ?? []).map((a, i) => {
            const key = `${group}-${i}`;
            const c = groupCounts[key] ?? 0;
            const full = c >= a.target;
            return (
              <button
                type="button"
                key={key}
                onClick={() => setGroupCounts((cur) => ({ ...cur, [key]: (cur[key] ?? 0) + 1 }))}
                aria-pressed={full}
                className={`review-row ${full ? "done" : ""}`}
              >
                <span className="review-check">{full ? "✓" : c > 0 ? c : ""}</span>
                <span className="review-text">
                  <b>{a.text}</b>
                  <small>
                    {c}/{a.target}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      )}
      <article className="counter-feature">
        <div>
          <p className="eyebrow">{t("ad.cfE")}</p>
          <h2>{t("ad.cfT")}</h2>
          <p>{t("ad.cfS")}</p>
        </div>
        <b>{salawat >= 100 ? "✓" : salawat}</b>
        <button type="button" onClick={() => setSalawat((c) => (c >= 100 ? 0 : c + 1))}>
          {salawat >= 100 ? t("ad.cfDone") : t("ad.cfGo")}
        </button>
      </article>
    </section>
  );
}
