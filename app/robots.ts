// Crawlers: index the marketing surface, never app screens (all of them
// require local state anyway). Keeps private routes out of search indexes.
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://wird.vercel.app"}/sitemap.xml`,
  };
}
