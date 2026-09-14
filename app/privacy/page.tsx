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

export const metadata: Metadata = { title: "Privacy Policy" };

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
