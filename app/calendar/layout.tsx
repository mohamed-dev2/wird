// SPDX-License-Identifier: Apache-2.0
// Calendar route metadata (STEP 11): server layout because the page is
// a client component. Title, faithful description, absolute canonical,
// and share tags; the month grid itself stays fully client-rendered.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "التقويم",
  description: "تقويم شهري لعباداتك وعاداتك اليومية مع خطة الجمعة.",
  alternates: { canonical: "/calendar" },
  openGraph: {
    title: "التقويم",
    description: "تقويم شهري لعباداتك وعاداتك اليومية مع خطة الجمعة.",
    url: "/calendar",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Wird — Daily Companion" }],
  },
};

export default function CalendarLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
