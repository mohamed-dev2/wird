// SPDX-License-Identifier: Apache-2.0
// Review route metadata (STEP 11): server layout because the page is
// a client component. Describes the actual checklist flow, nothing more.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الحصاد",
  description: "مراجعة المساء من بياناتك الحقيقية: قائمة ومزاج وامتنان ودرجة.",
  alternates: { canonical: "/review" },
  openGraph: {
    title: "الحصاد",
    description: "مراجعة المساء من بياناتك الحقيقية: قائمة ومزاج وامتنان ودرجة.",
    url: "/review",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Wird — Daily Companion" }],
  },
};

export default function ReviewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
