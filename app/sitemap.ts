// Sitemap: public routes only. Per-user pages hold no server content, so
// listing them would leak nothing but also help nothing — hence excluded.
import type { MetadataRoute } from "next";

const routes = [
  "",
  "/calendar",
  "/insights",
  "/review",
  "/library",
  "/account",
  "/terms",
  "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://wird-gamma.vercel.app";
  const now = new Date();
  return routes.map((r) => ({ url: `${base}${r || "/"}`, lastModified: now }));
}
