import type { Metadata, Viewport } from "next";
import "./tokens.css";
import "./styles.css";
import "./additions.css";
import "./views.css";
import "./rescue.css";
import "./library.css";
import { Shell } from "./components/shell";
import { SwRegister } from "./components/sw-register";
import { WirdProvider } from "./components/wird-store";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://wird.vercel.app";

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
    <html lang="ar" dir="rtl">
      <body>
        <SwRegister />
        <WirdProvider>
          <Shell>{children}</Shell>
        </WirdProvider>
      </body>
    </html>
  );
}
