// SEO behavior e2e (STEP 11): real HTTP responses — head metadata,
// robots/sitemap/verification reachability, 404 status honesty,
// trailing-slash behavior, mobile render. Static source guarantees
// live in app/lib/__tests__/seo.test.ts.
import { expect, test, type Page } from "@playwright/test";

async function ensureProfile(page: Page, name = "اختبار") {
  await page.goto("/");
  const start = page.getByRole("button", { name: /ابدأ رحلتك|إضافة حساب/ });
  await expect(start).toBeVisible({ timeout: 30000 });
  await page.getByPlaceholder("الاسم الكريم…").fill(name);
  await start.click();
  await expect(page.locator("aside.sidebar")).toBeVisible({ timeout: 30000 });
}

test("head carries title, description, canonical, OG, JSON-LD", async ({ page }) => {
  await ensureProfile(page);
  for (const [route, titlePart] of [
    ["/calendar", "التقويم"],
    ["/insights", "التقدم"],
    ["/review", "الحصاد"],
    ["/library", "المكتبة"],
    ["/account", "حسابي"],
    ["/deen", "دين"],
    ["/terms", "Terms of Use"],
    ["/privacy", "Privacy Policy"],
  ] as const) {
    await page.goto(route);
    await expect(page).toHaveTitle(new RegExp(`${titlePart} \\| `));
    const desc = page.locator('head meta[name="description"]');
    await expect(desc, `${route} description`).toHaveAttribute("content", /.+/);
    const canon = page.locator('head link[rel="canonical"]');
    await expect(canon, `${route} canonical`).toHaveAttribute(
      "href",
      new RegExp(`https://[^/]+${route}$`),
    );
    await expect(
      page.locator('head meta[property="og:title"]'),
      `${route} og:title`,
    ).toHaveAttribute("content", /.+/);
    await expect(
      page.locator('head meta[property="og:image"]'),
      `${route} og:image`,
    ).toHaveAttribute("content", /opengraph-image/);
  }
  const ld = await page.locator('script[type="application/ld+json"]').first().innerText();
  const data = JSON.parse(ld) as { "@type"?: string; name?: string };
  expect(data["@type"]).toBe("WebSite");
  expect(data.name).toBe("Wird");
});

test("robots, sitemap, verification file serve correctly", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Allow: /");
  expect(robotsText).toContain("https://wird-gamma.vercel.app/sitemap.xml");
  expect(robotsText).not.toMatch(/disallow:\s*\//i);

  const sm = await request.get("/sitemap.xml");
  expect(sm.status()).toBe(200);
  const xml = await sm.text();
  expect(xml).toContain("<urlset");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(urls.length).toBeGreaterThanOrEqual(8);
  expect(new Set(urls).size, "no duplicate sitemap urls").toBe(urls.length);
  for (const u of urls) expect(u, u).toMatch(/^https:\/\/[^/]+\//);
  expect(xml).not.toContain("google");
  expect(xml).not.toContain("not-found");

  const v = await request.get("/google373507699530d312.html");
  expect(v.status()).toBe(200);
  expect((await v.text()).trim()).toBe("google-site-verification: google373507699530d312.html");
});

test("unknown URLs return a real 404, trailing slash resolves cleanly", async ({
  page,
  request,
}) => {
  await ensureProfile(page);
  const res = await request.get("/nope-does-not-exist-xyz");
  expect(res.status()).toBe(404);
  await page.goto("/nope-does-not-exist-xyz");
  await expect(
    page.getByRole("heading", { name: /الصفحة غير موجودة|Page not found/ }),
  ).toBeVisible();
  const slash = await request.get("/deen/");
  expect([200, 308].includes(slash.status()), `trailing slash → ${slash.status()}`).toBe(true);
});

test("mobile viewport renders home with navigation", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto("/");
  const start = page.getByRole("button", { name: /ابدأ رحلتك|إضافة حساب/ });
  await expect(start).toBeVisible({ timeout: 30000 });
  await page.getByPlaceholder("الاسم الكريم…").fill("اختبار");
  await start.click();
  // Narrow screens hide the sidebar and show the bottom nav instead.
  await expect(page.locator("nav.bottom-nav")).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByRole("heading", { name: /رحلة الدين|Deen journey|اليوم|Today/ }).first(),
  ).toBeVisible({
    timeout: 15000,
  });
  await ctx.close();
});
