"use client";

import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    try {
      if ("serviceWorker" in navigator) {
        void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      }
    } catch {}
  }, []);
  return null;
}
