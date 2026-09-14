// SPDX-License-Identifier: Apache-2.0
// Calm 404 (audit 5/57): unknown routes explain instead of dumping the
// framework default. Client component (uses the app language provider
// like every other route), one way home.
"use client";

import Link from "next/link";
import { useT } from "./lib/i18n";

export default function NotFound() {
  const t = useT();
  return (
    <section className="destination-view" aria-label={t("nf.title")}>
      <h1>{t("nf.title")}</h1>
      <div className="backup-actions">
        <Link href="/">{t("nf.home")}</Link>
        <Link href="/library">{t("lb.quran")}</Link>
      </div>
    </section>
  );
}
