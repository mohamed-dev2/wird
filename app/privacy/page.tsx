// SPDX-License-Identifier: Apache-2.0
// /privacy route: Privacy Policy, bilingual, versioned. Content lives in
// app/lib/legal.ts (single source); PRIVACY_POLICY.md is the versioned
// record. Static page: precached for offline reading.
import type { Metadata } from "next";
import { LegalDoc } from "../components/legal-doc";
import {
  PRIVACY_EFFECTIVE,
  PRIVACY_SECTIONS,
  PRIVACY_TITLE,
  PRIVACY_VERSION,
  TERMS_TITLE,
} from "../lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Wird: what stays on your device, what can leave, and your rights. Versioned.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy",
    description:
      "Privacy Policy for Wird: what stays on your device, what can leave, and your rights. Versioned.",
    url: "/privacy",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Wird — Daily Companion" }],
  },
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      title={PRIVACY_TITLE}
      version={PRIVACY_VERSION}
      effective={PRIVACY_EFFECTIVE}
      sections={PRIVACY_SECTIONS}
      otherHref="/terms"
      otherLabel={TERMS_TITLE}
    />
  );
}
