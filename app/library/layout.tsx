// SPDX-License-Identifier: Apache-2.0
// Library route metadata (STEP 11): server layout because the page is
// a client component. Names the real tabs: adhkar, Quran, hadith,
// learning paths.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "المكتبة",
  description: "مكتبة ورد: أذكار وقرآن وحديث ومسارات تعلم، كلها على جهازك.",
  alternates: { canonical: "/library" },
  openGraph: {
    title: "المكتبة",
    description: "مكتبة ورد: أذكار وقرآن وحديث ومسارات تعلم، كلها على جهازك.",
    url: "/library",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Wird — Daily Companion" }],
  },
};

export default function LibraryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
