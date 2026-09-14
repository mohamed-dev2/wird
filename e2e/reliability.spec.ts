// Reliability e2e (STEP 7): safe mode degrades gracefully — optional
// systems park, core tracking stays usable, and exiting restores all.
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

/** Enable device-global safe mode, like the error screen / ?safe=1 path. */
async function enableSafeMode(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem(
      "wird-safe-mode-v1",
      JSON.stringify({ __wird: { v: 1, updatedAt: Date.now() }, d: true }),
    );
  });
}

test("safe mode parks optional systems, keeps core usable", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await enableSafeMode(page);
  await page.reload();
  // Banner always says so (never a hidden degraded state).
  await expect(page.getByText(/الوضع الآمن مفعّل|Safe mode is on/)).toBeVisible({ timeout: 15000 });
  // Companion card parked on Today, but habits still toggle (core works).
  await expect(page.locator(".companion-card")).toHaveCount(0);
  const habit = page.locator(".habit").first();
  await expect(habit).toBeVisible();
  const wasDone = await habit.evaluate((el) => el.classList.contains("completed"));
  await habit.click();
  await expect
    .poll(() => habit.evaluate((el) => el.classList.contains("completed")))
    .toBe(!wasDone);
  // Analytics deep layers parked on insights, route itself fine.
  await page.goto("/insights");
  await expect(page.locator(".analytics-layers")).toHaveCount(0);
  await expect(page.locator("aside.sidebar")).toBeVisible();
  expect(badLogs).toEqual([]);
});

test("exiting safe mode restores everything", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await enableSafeMode(page);
  await page.reload();
  await expect(page.getByText(/الوضع الآمن مفعّل|Safe mode is on/)).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: /إنهاء الوضع الآمن|Exit safe mode/ }).click();
  await expect(page.getByText(/الوضع الآمن مفعّل|Safe mode is on/)).toHaveCount(0);
  expect(badLogs).toEqual([]);
});
