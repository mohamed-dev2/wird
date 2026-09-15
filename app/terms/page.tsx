// SPDX-License-Identifier: Apache-2.0
// /terms route: Terms of Use, bilingual, versioned. Content lives in
// app/lib/legal.ts (single source); TERMS_OF_USE.md is the versioned
// record. Static page: precached for offline reading.
import type { Metadata } from "next";
import { LegalDoc } from "../components/legal-doc";
import {
  PRIVACY_TITLE,
  TERMS_EFFECTIVE,
  TERMS_SECTIONS,
  TERMS_TITLE,
  TERMS_VERSION,
} from "../lib/legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of Use for Wird, the local-first Islamic habits companion. Plain language, versioned.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Use",
    description:
      "Terms of Use for Wird, the local-first Islamic habits companion. Plain language, versioned.",
    url: "/terms",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Wird — Daily Companion" }],
  },
};

export default function TermsPage() {
  return (
    <LegalDoc
      title={TERMS_TITLE}
      version={TERMS_VERSION}
      effective={TERMS_EFFECTIVE}
      sections={TERMS_SECTIONS}
      otherHref="/privacy"
      otherLabel={PRIVACY_TITLE}
    />
  );
}
