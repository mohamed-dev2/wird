// SPDX-License-Identifier: Apache-2.0
// Account route metadata (STEP 11): server layout because the page is
// a client component. Describes local profile/backup management only —
// nothing here implies a server account.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "حسابي",
  description: "إدارة حسابك المحلي: الملفات والنسخ الاحتياطي والنقل والتذكيرات.",
  alternates: { canonical: "/account" },
  openGraph: {
    title: "حسابي",
    description: "إدارة حسابك المحلي: الملفات والنسخ الاحتياطي والنقل والتذكيرات.",
    url: "/account",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Wird — Daily Companion" }],
  },
};

export default function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
