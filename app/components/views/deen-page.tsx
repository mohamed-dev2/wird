// Deen page shell (STEP 10): Today/Library tabs over the two deen
// views. Tab selection is in-memory only (never in the URL), so no
// tracking state can leak into history, titles, or shared links.
"use client";

import { useState } from "react";
import { useT } from "../../lib/i18n";
import { DeenTodayView } from "./deen-today";
import { DeenLibraryView } from "./deen-library";

export function DeenPage() {
  const t = useT();
  const [tab, setTab] = useState<"today" | "library">("today");
  return (
    <>
      <div className="deen-tabs" role="tablist" aria-label={t("dn.title")}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "today"}
          onClick={() => setTab("today")}
          className={tab === "today" ? "selected" : ""}
        >
          {t("dn.today")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "library"}
          onClick={() => setTab("library")}
          className={tab === "library" ? "selected" : ""}
        >
          {t("dn.library")}
        </button>
      </div>
      {tab === "today" ? <DeenTodayView /> : <DeenLibraryView />}
    </>
  );
}
