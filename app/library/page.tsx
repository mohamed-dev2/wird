"use client";

import { useState } from "react";
import { useStoredState } from "../lib/use-stored-state";
import { AdhkarView } from "../components/views/adhkar";
import { DreamsBoard, type Dream } from "../components/library/dreams-board";
import { HadithLibrary } from "../components/library/hadith-library";
import { PathsList } from "../components/library/paths-list";
import { QuranReader } from "../components/library/quran-reader";

const TABS = [
  { id: "adhkar", label: "الأذكار" },
  { id: "quran", label: "القرآن" },
  { id: "hadith", label: "الحديث" },
  { id: "paths", label: "مسارات العلم" },
  { id: "dreams", label: "الأحلام" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("adhkar");
  const [dreams, setDreams] = useStoredState<Dream[]>("wird-dreams-v1", []);

  return (
    <section className="destination-view">
      <div className="book-chips lib-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={tab === t.id ? "selected" : ""}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "adhkar" && <AdhkarView />}
      {tab === "quran" && <QuranReader />}
      {tab === "hadith" && <HadithLibrary />}
      {tab === "paths" && <PathsList />}
      {tab === "dreams" && <DreamsBoard dreams={dreams} setDreams={setDreams} />}
    </section>
  );
}
