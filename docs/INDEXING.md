# Indexing: getting Wird into search engines

Status: **code-ready, Google-side launch step pending** (2026-09-23).
Public domain today: `https://wird-gamma.vercel.app` (the code default;
set `NEXT_PUBLIC_SITE_URL` in Vercel when the domain changes).

## Verified live state (last checked 2026-09-23)

Every indexing signal the app can emit is already deployed and serving:

| Signal                                         | Live URL                       | Result                               |
| ---------------------------------------------- | ------------------------------ | ------------------------------------ |
| Google verification file                       | `/google373507699530d312.html` | `200`, exact Google body             |
| robots.txt                                     | `/robots.txt`                  | `200`, `Allow: /`, points to sitemap |
| sitemap.xml                                    | `/sitemap.xml`                 | `200`, 9 public routes, no dupes     |
| Home `<title>` + meta description              | `/`                            | present, Arabic                      |
| `<meta name="robots" content="index, follow">` | `/`                            | present                              |
| Canonical + OG tags + WebSite JSON-LD          | `/`                            | present, absolute URL                |

Sources: `app/robots.ts`, `app/sitemap.ts`, per-route metadata in
`app/*/layout.tsx` / route files, `e2e/seo.spec.ts` (robots/sitemap/
verification reachable + 404 honesty), `app/lib/__tests__/seo.test.ts`.

## Why the site is not in search results yet

A brand-new domain does not appear until Google knows it exists and has
crawled it. The verification file living in the repo is **not** the same
as being verified — Search Console has to register it once. The steps
below are the actual fix; they are Google-account actions and cannot be
done from code.

## Owner checklist (the real fix)

1. Open https://search.google.com/search-console → **Add property** →
   **Domain** → type `wird-gamma.vercel.app`.
2. Google offers DNS or HTML-file verification; **Upload** the existing
   `public/google373507699530d312.html` (do not regenerate/rename it)
   and click **Verify**.
3. Open the new property → **Sitemaps** → submit `sitemap.xml` → wait
   for "Success".
4. **URL Inspection** → paste the homepage → **Request indexing**. Repeat
   for `/library`, `/deen`, `/terms`, `/privacy`.
5. In **Page indexing → Pages**, watch for the homepage to flip from
   "Discovered/Crawled" to "Indexed". New domains typically take
   days-to-a-few-weeks; content is updated on every Vercel deploy.

Confirm later from the command line:

```bash
curl -I https://wird-gamma.vercel.app/
curl https://wird-gamma.vercel.app/robots.txt
curl https://wird-gamma.vercel.app/sitemap.xml
```

## Post-index playbook (shipped 2026-09-23)

Applied from the on-page/performance checklist so the site ranks once it
is indexed; owner side is listed where only Google Search Console (GSC)
data can decide.

- **Long-tail + intent**: homepage now carries a visible FAQ
  (`app/page.tsx` `.seo-faq`, 5 honest Q&A) matched 1:1 by `FAQPage`
  JSON-LD, targeting multi-word Arabic queries ("هل يحتاج وِرد إلى
  الإنترنت؟" etc.). Add/trim Q&A from real GSC queries after indexing.
- **On-page head**: `<title>` + meta description already carry the
  keywords; `robots: index, follow` enforced by test. CTR tuning is
  owner-side once GSC shows impressions-vs-clicks: rewrite the meta
  description, then `npm run build` auto-deploys.
- **Internal links**: homepage footer links to `/library`, `/deen`,
  `/calendar`, `/insights` with descriptive anchors (route labels), not
  "click here" — enforced by a unit test.
- **Duplicate content**: `seo.test.ts` now fails if any two listed
  routes share a title or description, and canonicals are same-route
  absolute. No route re-targets the same query.
- **Headings**: one `<h1>` (shell greeting) per route today; `terms`/
  `privacy` double-h1 (shell + document) is accepted — Google treats
  multiple h1s leniently — so it was left as-is rather than risking
  the shared heading structure.
- **Core Web Vitals**: measured owner-side at
  https://pagespeed.web.dev/?url=https://wird-gamma.vercel.app after
  indexing. Code side already helps: static-only routes (no CLS from
  async data), self-hosted `next/font` fonts (no FOUT shift), tiny
  raster icons, `content-visibility` on long Today cards
  (`app/additions.css`). No third-party scripts exist to remove.

## Change note (this pass, 2026-09-23)

No app code changed for indexing — it was already correct and live.
This doc records the launch state so the Google-side steps are one copy
later away. Future indexing changes go through `docs/SEO.md` (audit) and
this file (launch/ops), and hit the SEO suites before merge.

## Rules

- Never delete/rename/move `public/google373507699530d312.html`.
- Keep `robots.txt` `Allow: /` (no `Disallow`) — GSC warns otherwise.
- Keep the sitemap on public routes only (`app/sitemap.ts`).
- Update `NEXT_PUBLIC_SITE_URL` at the host when the domain changes, or
  canonicals/sitemap drift from the real origin.
