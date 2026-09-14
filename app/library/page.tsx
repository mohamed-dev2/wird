// Library route (/library): tab shell (Adhkar · Quran · Hadith · Paths ·
// Dreams). Each tab owns its data fetching; nothing prefetches siblings.
"use client";

import { useState } from "react";
import { useT } from "../lib/i18n";
import { useStoredState } from "../lib/use-stored-state";
import { AdhkarView } from "../components/views/adhkar";
import { DreamsBoard, type Dream } from "../components/library/dreams-board";
import { HadithLibrary } from "../components/library/hadith-library";
import { PathsList } from "../components/library/paths-list";
import { QuranReader } from "../components/library/quran-reader";
import { SectionGuard } from "../components/section-error";

const TABS = [
  { id: "adhkar", labelKey: "lb.adhkar" },
  { id: "quran", labelKey: "lb.quran" },
  { id: "hadith", labelKey: "lb.hadith" },
  { id: "paths", labelKey: "lb.paths" },
  { id: "dreams", labelKey: "lb.dreams" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function LibraryPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("adhkar");
  const [dreams, setDreams] = useStoredState<Dream[]>("wird-dreams-v1", []);

  return (
    <section className="destination-view">
      <div className="book-chips lib-tabs">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            aria-pressed={tab === tb.id}
            className={tab === tb.id ? "selected" : ""}
          >
            {t(tb.labelKey)}
          </button>
        ))}
      </div>
      {tab === "adhkar" && <AdhkarView />}
      {tab === "quran" && (
        <SectionGuard>
          <QuranReader />
        </SectionGuard>
      )}
      {tab === "hadith" && (
        <SectionGuard>
          <HadithLibrary />
        </SectionGuard>
      )}
      {tab === "paths" && <PathsList />}
      {tab === "dreams" && <DreamsBoard dreams={dreams} setDreams={setDreams} />}
      <div className="lib-card">
        <p className="eyebrow">{t("lb.sourcesT")}</p>
        <p className="backup-msg">{t("lb.sourcesB")}</p>
      </div>
    </section>
  );
}
