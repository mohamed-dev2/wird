// Route-level crash screen (STEP 7.4): a route threw during render.
// Reads language WITHOUT the store (the store may be the crash source),
// never renders error.message (it can contain user data), shows Next's
// digest when present (content-free hash), and offers reset + safe mode +
// the independent /recovery environment.
"use client";

import Link from "next/link";
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

export default function RouteError({
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
    <section className="destination-view" role="alert">
      <h2>{tr(lang, "err.secT")}</h2>
      <p className="backup-msg">{tr(lang, "err.secB")}</p>
      {digest ? <p className="backup-msg">#{digest}</p> : null}
      <div className="backup-actions">
        <button type="button" className="pp-btn" onClick={() => reset()}>
          {tr(lang, "err.retry")}
        </button>
        <button
          type="button"
          className="pp-btn-ghost"
          onClick={() => {
            setSafeMode(true);
            reset();
          }}
        >
          {tr(lang, "safe.try")}
        </button>
        <Link href="/recovery">{tr(lang, "err.recovery")}</Link>
      </div>
    </section>
  );
}
