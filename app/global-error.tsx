// Root crash screen (STEP 7.4 last resort): the root layout itself threw.
// Own <html>/<body> (Next requirement), zero provider/store imports, static
// tr() + safe localStorage reads only. Never renders error content.
"use client";

import { useEffect, useState } from "react";
import { setSafeMode } from "./lib/safe-mode";
import { tr } from "./lib/strings";

function crashLang(): "ar" | "en" {
  try {
    const raw = window.localStorage.getItem("wird-lang-v1");
    if (!raw) return "ar";
    const parsed: unknown = JSON.parse(raw);
    const v =
      parsed && typeof parsed === "object" && !Array.isArray(parsed) && "__wird" in parsed
        ? (parsed as { d?: unknown }).d
        : parsed;
    return v === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once crash-screen language hydration (SSR-safe default first)
    setLang(crashLang());
  }, []);
  const digest = typeof error?.digest === "string" && error.digest ? error.digest : null;
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <body>
        <main style={{ padding: 24, maxInlineSize: 560, marginInline: "auto" }}>
          <h2>{tr(lang, "err.secT")}</h2>
          <p>{tr(lang, "err.secB")}</p>
          {digest ? <p>#{digest}</p> : null}
          <div>
            <button type="button" onClick={() => reset()}>
              {tr(lang, "err.retry")}
            </button>{" "}
            <button
              type="button"
              onClick={() => {
                setSafeMode(true);
                try {
                  window.location.reload();
                } catch {
                  reset();
                }
              }}
            >
              {tr(lang, "safe.try")}
            </button>{" "}
            <a href="/recovery">{tr(lang, "err.recovery")}</a>
          </div>
        </main>
      </body>
    </html>
  );
}
