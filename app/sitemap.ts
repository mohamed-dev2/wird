import type { MetadataRoute } from "next";

const routes = ["", "/calendar", "/insights", "/review", "/library", "/account"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://wird.vercel.app";
  const now = new Date();
  return routes.map((r) => ({ url: `${base}${r || "/"}`, lastModified: now }));
}
