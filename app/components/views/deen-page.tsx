// Deen page shell (STEP 10): Today/Library/Review tabs over the three deen
// views. Tab selection is in-memory only (never in the URL), so no tracking
// state can leak into history, titles, or shared links. Review is the folded
// /review (الحصاد) checklist, reachable now only through /deen.
"use client";

import { useState } from "react";
import { useT } from "../../lib/i18n";
import { DeenTodayView } from "./deen-today";
import { DeenLibraryView } from "./deen-library";
import { ReviewTab } from "./review-tab";

export function DeenPage() {
  const t = useT();
  const [tab, setTab] = useState<"today" | "library" | "review">("today");
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
        <button
          type="button"
          role="tab"
          aria-selected={tab === "review"}
          onClick={() => setTab("review")}
          className={tab === "review" ? "selected" : ""}
        >
          {t("dn.review")}
        </button>
      </div>
      {tab === "today" ? (
        <DeenTodayView />
      ) : tab === "library" ? (
        <DeenLibraryView />
      ) : (
        <ReviewTab />
      )}
    </>
  );
}
