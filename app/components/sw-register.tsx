// Service-worker registration + update banner (SKIP_WAITING flow).
// The worker caches library bundles for offline use; it never touches
// user data. Registration is client-only and failure-silent.
"use client";

import { useEffect, useState } from "react";
import { useT } from "../lib/i18n";

export function SwRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const t = useT();
  useEffect(() => {
    try {
      if (!("serviceWorker" in navigator)) return;
      let reg: ServiceWorkerRegistration | null = null;
      void navigator.serviceWorker.register("/sw.js").then((r) => {
        reg = r;
        const waiting = r.waiting;
        if (waiting) setUpdateReady(true);
        r.addEventListener("updatefound", () => {
          const sw = r.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      });
      const id = window.setInterval(() => {
        try {
          void reg?.update().catch(() => undefined);
        } catch {}
      }, 3600000);
      // If this client runs an older bundle than the active SW served, force-update once.
      try {
        void navigator.serviceWorker.ready.then((r) => r.update().catch(() => undefined));
      } catch {}
      return () => window.clearInterval(id);
    } catch {
      return;
    }
  }, []);
  if (!updateReady) return null;
  return (
    <button
      type="button"
      className="update-banner"
      onClick={() => {
        try {
          void navigator.serviceWorker
            .getRegistration()
            .then((r) => r?.waiting?.postMessage({ type: "SKIP_WAITING" }));
        } catch {}
        window.location.reload();
      }}
    >
      {t("pwa.update")}
    </button>
  );
}
