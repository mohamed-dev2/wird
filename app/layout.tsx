import type { Metadata, Viewport } from "next";
import "./styles.css";
import "./additions.css";
import "./views.css";
import "./rescue.css";
import { Shell } from "./components/shell";
import { WirdProvider } from "./components/wird-store";

export const metadata: Metadata = {
  title: "وِرد | رفيقك اليومي",
  description: "متابعة العبادات والأوراد اليومية",
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
        <WirdProvider>
          <Shell>{children}</Shell>
        </WirdProvider>
      </body>
    </html>
  );
}
