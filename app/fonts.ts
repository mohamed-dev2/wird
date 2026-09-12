// Self-hosted fonts (Alexandria + DM Sans via next/font). Self-hosting
// keeps the CSP font-src tight and avoids third-party font requests.
import { Alexandria, DM_Sans } from "next/font/google";

export const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-alexandria",
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-dm",
});
