"use client";

import { useEffect, useState } from "react";
import { dayId, loadDailyNumber, saveToStorage } from "../../lib/wird";
import { useT } from "../../lib/i18n";

const GROUPS = [
  { icon: "☀", titleKey: "ad.g1t", descKey: "ad.g1d" },
  { icon: "◐", titleKey: "ad.g2t", descKey: "ad.g2d" },
  { icon: "☾", titleKey: "ad.g3t", descKey: "ad.g3d" },
  { icon: "⌂", titleKey: "ad.g4t", descKey: "ad.g4d" },
] as const;

export function AdhkarView() {
  const t = useT();
  const [salawat, setSalawat] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once hydration of stored counter
    setSalawat(loadDailyNumber("wird-salawat-v2", 0, dayId()));
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted) saveToStorage("wird-salawat-v2", { day: dayId(), value: salawat });
  }, [mounted, salawat]);
  return (
    <section className="destination-view adhkar-view">
      <div className="view-hero">
        <p className="eyebrow">{t("ad.heroE")}</p>
        <h2>{t("ad.heroT")}</h2>
        <p>{t("ad.heroS")}</p>
      </div>
      <div className="adhkar-groups">
        {GROUPS.map(({ icon, titleKey, descKey }) => (
          <button type="button" key={titleKey}>
            <span>{icon}</span>
            <div>
              <b>{t(titleKey)}</b>
              <small>{t(descKey)}</small>
            </div>
            <i>‹</i>
          </button>
        ))}
      </div>
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
