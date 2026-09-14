// Shared legal-document renderer (STEP 8): version banner, sections,
// cross-link. Content comes from app/lib/legal.ts (single source); the
// root .md files are the versioned records (sync rule + compliance test).
"use client";

import Link from "next/link";
import { useWird } from "./wird-store";
import type { LegalLang, LegalSection } from "../lib/legal";

export function LegalDoc({
  title,
  version,
  effective,
  sections,
  otherHref,
  otherLabel,
}: {
  title: Record<LegalLang, string>;
  version: string;
  effective: string;
  sections: LegalSection[];
  otherHref: string;
  otherLabel: Record<LegalLang, string>;
}) {
  const { lang } = useWird();
  const l: LegalLang = lang === "en" ? "en" : "ar";
  return (
    <section className="destination-view" aria-label={title[l]}>
      <h1>{title[l]}</h1>
      <p className="backup-msg">
        v{version} · {effective}
      </p>
      {sections.map((s, i) => (
        <div key={i}>
          <h2>{s.h[l]}</h2>
          {s.ps.map((p, j) => (
            <p key={j}>{p[l]}</p>
          ))}
        </div>
      ))}
      <div className="backup-actions">
        <Link href={otherHref}>{otherLabel[l]}</Link>
      </div>
    </section>
  );
}
