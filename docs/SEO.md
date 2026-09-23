# SEO report (STEP 11)

Production-grade discoverability without touching privacy, and without
a single invented claim. Method: static source guarantees
(`app/lib/__tests__/seo.test.ts`) + live HTTP behavior
(`e2e/seo.spec.ts`). Status rule (§36): technical readiness is never
reported as Google indexing.

## Scope decision (why app screens stay listed)

Wird is local-first: crawlers see shells with zero user data
(localStorage is empty for a bot), so listing app routes leaks
nothing. `/terms` + `/privacy` are the substantive indexed content;
the rest are indexable-but-thin by design. `/recovery` carries no
metadata at all and `/private-plans` is title-only — both unlisted
from nav/sitemap as before. Nothing about this changed in STEP 11
except titles/descriptions/canonicals where they were missing.

## Title strategy

`%s | ورد` template (root `lang="ar"`): التقويم، التقدم، المكتبة،
حسابي، دين (discreet single word — Today is root; Review lives inside
/deen as a tab, no separate title), Terms of Use, Privacy
Policy (EN pages keep EN titles). One title per route, enforced
unique by test.

## Report (evidence from the 2026-09-15 run)

| Area                     | Status                                       | Evidence                                                                                                                                                                                                  |
| ------------------------ | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google verification file | READY FOR GOOGLE VERIFICATION (not VERIFIED) | `public/google373507699530d312.html` byte-exact (unit); local prod `GET → 200` + exact body (e2e). Production-domain confirmation needs the deploy + Search Console click — not claimable from here.      |
| robots.txt               | PASS                                         | `GET /robots.txt → 200`, `Allow: /`, full sitemap URL, no blanket disallow (e2e); source rule audited (unit).                                                                                             |
| XML sitemap              | PASS                                         | `GET /sitemap.xml → 200`, valid `<urlset>`, 8+ https URLs, no dupes, no verification file, no error pages (e2e).                                                                                          |
| Page titles              | PASS                                         | 8/8 routes render `Topic \| ورد`; uniqueness enforced on source (unit+e2e).                                                                                                                               |
| Meta descriptions        | PASS                                         | Faithful one-liners on all listed routes; unlisted routes provably description-free (unit+e2e).                                                                                                           |
| Canonicals               | PASS                                         | Same-route absolute canonicals via `metadataBase` (unit+e2e). www/non-www + http→https are host-level (Vercel) — owner checklist, not code.                                                               |
| Open Graph               | PASS                                         | `og:title/description/image` per route → `/opengraph-image` (1200×630 static, zero user data); `ar_SA` + `en_US`, `summary_large_image` (unit+e2e). Real platform preview rendering untested — tags only. |
| Structured data          | PASS                                         | Single WebSite JSON-LD (name, url, inLanguage ar/en, honest description); parses valid (e2e). No ratings/reviews/prices/counts anywhere (unit denylist).                                                  |
| Public indexability      | PASS                                         | All listed routes 200 with index/follow; no `noindex` in source (unit). Indexing itself is Google's decision, never claimed.                                                                              |
| Private-data protection  | PASS                                         | Prayer/deen/recovery data in none of: sitemap, metadata, OG, JSON-LD, URLs, titles (firewall + leak-scan suites + e2e URL/title scan).                                                                    |
| Mobile SEO               | PASS                                         | 375px render with bottom nav + headings (e2e); viewport + theme-color set; responsive by token/layout (existing).                                                                                         |
| Performance              | PARTIAL                                      | Budgets enforced in-suite (analytics-perf, capped lists); no new blocking resources added (this step adds ~2 KB metadata + one JSON-LD block). No lab LCP/CLS/INP run in CI — honest gap, not a failure.  |
| Accessibility            | PASS                                         | Skip link, landmarks, labeled controls, keyboard-operable tabs/buttons, motion-gated effects (existing + e2e roles used throughout).                                                                      |
| Internal linking         | PASS                                         | Sidebar + bottom nav link every public route with text labels; every static href resolves (audit suite).                                                                                                  |
| 404/redirect handling    | PASS                                         | Unknown URLs return real HTTP 404 + calm page (e2e status + UI); `/deen/` resolves with no chain (e2e).                                                                                                   |

## What was built in STEP 11

- Per-route server layouts (`calendar`, `insights`, `review`,
  `library`, `account`) with title + description + canonical + OG.
- `terms`/`privacy`/`deen` metadata completed (EN descriptions for
  legal pages; short generic Arabic for deen).
- Root OG/Twitter images → `/opengraph-image`; WebSite JSON-LD.
- `app/lib/__tests__/seo.test.ts` (9 static guards) +
  `e2e/seo.spec.ts` (4 behavior proofs).

## Owner checklist (needs production access)

1. Deploy, then Search Console → verify property via the file.
2. Confirm `https://wird-gamma.vercel.app/google373507699530d312.html`
   returns the exact token (re-run the e2e against prod base URL).
3. Submit `/sitemap.xml` in Search Console; watch coverage (indexing
   is Google's call).
4. Confirm www→apex + http→https at the host (code sets canonicals;
   the server owns redirects).
