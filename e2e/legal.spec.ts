// Legal routes e2e (STEP 8): terms + privacy render versioned bilingual
// documents, link each other, survive small screens and offline reloads.
import { expect, test, type Page } from "@playwright/test";

async function ensureProfile(page: Page, name = "اختبار") {
  await page.goto("/");
  const start = page.getByRole("button", { name: /ابدأ رحلتك|إضافة حساب/ });
  await expect(start).toBeVisible({ timeout: 30000 });
  await page.getByPlaceholder("الاسم الكريم…").fill(name);
  await start.click();
  await expect(page.locator("aside.sidebar")).toBeVisible({ timeout: 30000 });
}

function watchHydration(page: Page) {
  const badLogs: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && /hydrat/i.test(msg.text())) badLogs.push(msg.text());
  });
  page.on("pageerror", (err) => badLogs.push(String(err)));
  return badLogs;
}

test("terms page renders versioned bilingual document", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: /شروط الاستخدام|Terms of Use/ })).toBeVisible();
  await expect(page.getByText(/1\.0\.0/)).toBeVisible();
  await expect(page.getByText(/2026-09-14/)).toBeVisible();
  // Cross-link to the privacy document works.
  await page.getByRole("link", { name: /سياسة الخصوصية|Privacy Policy/ }).click();
  await expect(page).toHaveURL(/privacy/);
  await expect(page.getByRole("heading", { name: /سياسة الخصوصية|Privacy Policy/ })).toBeVisible();
  expect(badLogs).toEqual([]);
});

test("privacy page answers the core questions", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: /سياسة الخصوصية|Privacy Policy/ })).toBeVisible();
  await expect(page.getByText(/لا حسابات|No accounts/).first()).toBeVisible();
  expect(badLogs).toEqual([]);
});

test("legal pages work on small screens and offline", async ({ page, context }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: /شروط الاستخدام|Terms of Use/ })).toBeVisible();
  // Precached shell documents survive airplane mode (SW CORE).
  await page.waitForFunction(
    async () => {
      try {
        const c = await caches.open((await caches.keys())[0] as string);
        return !!(await c.match("/terms"));
      } catch {
        return false;
      }
    },
    { timeout: 30000 },
  );
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /شروط الاستخدام|Terms of Use/ })).toBeVisible({
    timeout: 30000,
  });
  await context.setOffline(false);
  expect(badLogs).toEqual([]);
});
