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
import "./deen.css";
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
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Wird - Daily Companion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "وِرد | رفيقك اليومي للعبادات",
    description: "تابع صلواتك وأذكارك وقرآنك — بخصوصية كاملة ودون إنترنت.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

// Machine-readable site identity (STEP 11): WebSite only: the one
// schema this site genuinely qualifies for. No ratings, reviews,
// prices, organizations, or counts are claimed anywhere.
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Wird",
  alternateName: "وِرد",
  url: siteUrl,
  inLanguage: ["ar", "en"],
  description:
    "Local-first Islamic habits companion: prayers, adhkar, Quran, goals, and private self-management - all on your device.",
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
        <script
          type="application/ld+json"
          // Static identity block only: no user data can reach this string.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <WirdProvider>
          <SwRegister />
          <Shell>{children}</Shell>
        </WirdProvider>
      </body>
    </html>
  );
}
