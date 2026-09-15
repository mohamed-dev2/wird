// SPDX-License-Identifier: Apache-2.0
// Insights route metadata (STEP 11): server layout because the page is
// a client component. Honest description — local stats over the user's
// own history, never fabricated benchmarks.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "التقدم",
  description: "إحصاءات محلية تشرح نفسها: اتجاهات وقرآن وأذكار واستمرارية وعودة.",
  alternates: { canonical: "/insights" },
  openGraph: {
    title: "التقدم",
    description: "إحصاءات محلية تشرح نفسها: اتجاهات وقرآن وأذكار واستمرارية وعودة.",
    url: "/insights",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Wird — Daily Companion" }],
  },
};

export default function InsightsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
