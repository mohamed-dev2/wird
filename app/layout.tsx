// Root layout: metadata/OG/RTL shell, fonts, global CSS, WirdProvider +
// Shell around every route (including /recovery, which stays independent
// of provider STATE even though it renders inside the provider tree).
import type { Metadata, Viewport } from "next";
import "./tokens.css";
import "./styles.css";
import "./additions.css";
import "./views.css";
import "./rescue.css";
import "./library.css";
import "./private-plans.css";
import { Shell } from "./components/shell";
import { SwRegister } from "./components/sw-register";
import { WirdProvider } from "./components/wird-store";
import { alexandria, dmSans } from "./fonts";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://wird-gamma.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "وِرد | رفيقك اليومي للعبادات",
    template: "%s | وِرد",
  },
  description:
    "وِرد — رفيقك اليومي لمتابعة الصلوات والأذكار والقرآن: إحصاءات ذكية، حصاد يومي، مكتبة إسلامية دون إنترنت. خصوصية كاملة: بياناتك على جهازك فقط.",
  keywords: [
    "ورد",
    "أذكار",
    "صلوات",
    "قرآن",
    "عبادات",
    "متابعة",
    "wird",
    "adhkar",
    "muslim",
    "habits",
  ],
  authors: [{ name: "Wird" }],
  creator: "Wird",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: ["en_US"],
    url: siteUrl,
    siteName: "وِرد",
    title: "وِرد | رفيقك اليومي للعبادات",
    description: "تابع صلواتك وأذكارك وقرآنك — بخصوصية كاملة ودون إنترنت.",
  },
  twitter: {
    card: "summary_large_image",
    title: "وِرد | رفيقك اليومي للعبادات",
    description: "تابع صلواتك وأذكارك وقرآنك — بخصوصية كاملة ودون إنترنت.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e2a1f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${alexandria.variable} ${dmSans.variable}`}>
      <body>
        <WirdProvider>
          <SwRegister />
          <Shell>{children}</Shell>
        </WirdProvider>
      </body>
    </html>
  );
}
