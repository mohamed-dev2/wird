// Offline-first e2e (STEP 5): with external traffic blocked — and with the
// browser fully offline — core flows must keep working on local state while
// optional-online features fail calmly (retry UI, no crash, no hang, data kept).
import { expect, test, type Page } from "@playwright/test";

async function ensureProfile(page: Page) {
  await page.goto("/");
  const start = page.getByRole("button", { name: /ابدأ رحلتك|إضافة حساب/ });
  await expect(start).toBeVisible({ timeout: 30000 });
  await page.getByPlaceholder("الاسم الكريم…").fill("اختبار");
  await start.click();
  await expect(page.locator("aside.sidebar")).toBeVisible({ timeout: 30000 });
}

function hydrateGuard(page: Page): string[] {
  const badLogs: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && /hydrat/i.test(msg.text())) badLogs.push(msg.text());
  });
  page.on("pageerror", (err) => badLogs.push(String(err)));
  return badLogs;
}

/** Block everything outside loopback: the app must treat this as offline. */
async function blockExternal(page: Page) {
  await page.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host === "127.0.0.1" || host === "localhost") return route.continue();
    return route.abort();
  });
}

test("core flows work with external network blocked", async ({ page }) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);
  await blockExternal(page);

  // Habit toggle persists through a reload — pure local write path.
  const firstHabit = page.locator(".habit").first();
  await expect(firstHabit).toBeVisible();
  const wasDone = await firstHabit.evaluate((el) => el.classList.contains("completed"));
  await firstHabit.click();
  await expect
    .poll(() => firstHabit.evaluate((el) => el.classList.contains("completed")))
    .toBe(!wasDone);
  await page.reload();
  await expect
    .poll(() =>
      page
        .locator(".habit")
        .first()
        .evaluate((el) => el.classList.contains("completed")),
    )
    .toBe(!wasDone);

  // Every route loads without crashing while external is unreachable.
  for (const route of [
    "/",
    "/calendar",
    "/insights",
    "/deen",
    "/library",
    "/account",
    "/recovery",
    "/private-plans",
  ]) {
    await page.goto(route);
    await expect(page.locator("aside.sidebar")).toBeVisible({ timeout: 15000 });
  }
  expect(badLogs).toEqual([]);
});

test("bundled Quran search works offline", async ({ page }) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);
  await blockExternal(page);
  await page.goto("/library");
  await page.getByRole("button", { name: /القرآن|Quran/ }).click();
  await page.getByPlaceholder(/ابحث في الآيات أو السور|Search verses or surahs/).fill("الله");
  await expect.poll(() => page.locator(".ayah").count(), { timeout: 20000 }).toBeGreaterThan(5);
  expect(badLogs).toEqual([]);
});

test("private plans work fully offline", async ({ page }) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);
  await blockExternal(page);
  await page.goto("/private-plans");
  await page.getByRole("button", { name: /خطة خاصة جديدة|New private plan/ }).click();
  await page.getByPlaceholder(/خطة خاصة أ|Private Plan A/).fill("Private Plan A");
  await page.getByRole("button", { name: /^احفظ الخطة$|^Save plan$/ }).click();
  await expect(page.getByRole("button", { name: /كل الخطط|All plans/ })).toBeVisible();
  await page.getByRole("button", { name: /تسجيل اليوم|Check in today/ }).click();
  await expect(page.getByText(/تم تسجيل اليوم\.|Checked in for today\./)).toBeVisible();
  await page.getByRole("button", { name: /^تسجيل انتكاسة$|^Record a setback$/ }).click();
  await page.getByRole("button", { name: /احفظ الانتكاسة|Save setback/ }).click();
  await expect(page.getByText(/بدأ مداك الحالي من جديد|Your current run restarted/)).toBeVisible();
  // Restart while offline: history survives.
  await page.reload();
  await page
    .getByRole("button", { name: /خطة خاصة A|Private Plan A/ })
    .first()
    .click();
  await expect(
    page.getByText(/انتكاسة · \d{4}-\d{2}-\d{2}|setback · \d{4}-\d{2}-\d{2}/),
  ).toBeVisible();
  expect(badLogs).toEqual([]);
});

test("online tafsir fails calmly when unreachable", async ({ page, context }) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);
  await page.goto("/library");
  await page.getByRole("button", { name: /القرآن|Quran/ }).click();
  await expect(page.locator(".ayah").first()).toBeVisible({ timeout: 20000 });
  // Full browser offline from here: the bounded fetch rejects fast whether
  // or not the service worker serves the request (both contexts are offline).
  await context.setOffline(true);
  await page.locator(".ayah-trigger").first().click();
  await page.getByRole("menuitem", { name: /التفسير|Tafsir/ }).click();
  // Default source is online-only: bounded fetch rejects → calm error, retryable, no crash.
  await expect(
    page.getByText(/تعذر التحميل — تحقق من الاتصال|Load failed — check connection/),
  ).toBeVisible({
    timeout: 25000,
  });
  await context.setOffline(false);
  expect(badLogs).toEqual([]);
});

test("full hadith book fails calmly with retry when unreachable", async ({ page, context }) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);
  await page.goto("/library");
  await page.getByRole("button", { name: /الحديث|Hadith/ }).click();
  await context.setOffline(true);
  // Full-books mode mounts the lazy CDN browser; unreachable CDN rejects →
  // calm failed UI with retry (never a crash or a hang).
  await page.getByRole("button", { name: /الكتب الكاملة|Full books/ }).click();
  await expect(page.getByText(/تعذر التحميل|Load failed/)).toBeVisible({ timeout: 25000 });
  // Retry stays calm (still offline, still no crash).
  await page.getByRole("button", { name: /إعادة المحاولة|Retry/ }).click();
  await expect(page.getByText(/تعذر التحميل|Load failed/)).toBeVisible({ timeout: 25000 });
  await context.setOffline(false);
  expect(badLogs).toEqual([]);
});

test("true offline restart: launch, data, and writes survive airplane mode", async ({
  page,
  context,
}) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);

  // Warm up: state + route shells + chunks cached by the service worker.
  const habit = page.locator(".habit").first();
  await habit.click();
  await page.goto("/library");
  await expect(page.locator("aside.sidebar")).toBeVisible();
  await page.goto("/");
  await page.waitForFunction(
    async () => {
      try {
        if (!("caches" in window)) return false;
        const keys = await caches.keys();
        if (!keys.length) return false;
        const c = await caches.open(keys[0] as string);
        return !!(await c.match("/"));
      } catch {
        return false;
      }
    },
    { timeout: 30000 },
  );

  // Airplane mode: every request fails, including loopback.
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("aside.sidebar")).toBeVisible({ timeout: 30000 });

  // Local state intact and writable with zero connectivity.
  const offlineHabit = page.locator(".habit").first();
  await expect(offlineHabit).toBeVisible();
  const wasDone = await offlineHabit.evaluate((el) => el.classList.contains("completed"));
  await offlineHabit.click();
  await expect
    .poll(() => offlineHabit.evaluate((el) => el.classList.contains("completed")))
    .toBe(!wasDone);

  await context.setOffline(false);
  expect(badLogs).toEqual([]);
});

test("nawawi view has no duplicate browse button (regression)", async ({ page }) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);
  await page.goto("/library");
  await page.getByRole("button", { name: /الحديث|Hadith/ }).click();
  // Curated Nawawi renders inline; the raw-key duplicate button is gone.
  await expect(page.locator(".hadith-lib")).toBeVisible();
  await expect(page.getByRole("button", { name: /browseAll40|عرض الأربعين كاملة/ })).toHaveCount(0);
  expect(badLogs).toEqual([]);
});

test("ahmed and darimi books are browsable (calm offline)", async ({ page, context }) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);
  await page.goto("/library");
  await page.getByRole("button", { name: /الحديث|Hadith/ }).click();
  await page.getByRole("button", { name: /الكتب الكاملة|Full books/ }).click();
  await expect(
    page.locator(".hadith-full").getByRole("button", { name: /مسند أحمد|Musnad Ahmad/ }),
  ).toBeVisible();
  await expect(
    page.locator(".hadith-full").getByRole("button", { name: /سنن الدارمي|Sunan al-Darimi/ }),
  ).toBeVisible();
  // Routing is wired: opening Ahmed offline fails calmly, never crashes.
  await context.setOffline(true);
  await page
    .locator(".hadith-full")
    .getByRole("button", { name: /مسند أحمد|Musnad Ahmad/ })
    .click();
  await expect(page.getByText(/تعذر التحميل|Load failed/)).toBeVisible({ timeout: 25000 });
  await context.setOffline(false);
  expect(badLogs).toEqual([]);
});

test("tafsir sheet lists the tazkirul source", async ({ page }) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);
  await page.goto("/library");
  await page.getByRole("button", { name: /القرآن|Quran/ }).click();
  await expect(page.locator(".ayah").first()).toBeVisible({ timeout: 20000 });
  await page.locator(".ayah-trigger").first().click();
  await page.getByRole("menuitem", { name: /التفسير|Tafsir/ }).click();
  await expect(page.getByRole("button", { name: /تذكير القرآن|Tazkirul Quran/ })).toBeVisible();
  expect(badLogs).toEqual([]);
});

test("favorites filter label follows the ui language", async ({ page }) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);
  await page.goto("/account");
  await page.getByRole("button", { name: /^English$/ }).click();
  await page.goto("/library");
  await page.getByRole("button", { name: /Hadith/ }).click();
  await expect(page.getByRole("button", { name: /★ Favorites/ })).toBeVisible();
  expect(badLogs).toEqual([]);
});
