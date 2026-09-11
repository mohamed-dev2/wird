import { expect, test, type Page } from "@playwright/test";

async function ensureProfile(page: Page) {
  await page.goto("/");
  const start = page.getByRole("button", { name: /ابدأ رحلتك|إضافة حساب/ });
  if (await start.isVisible({ timeout: 8000 }).catch(() => false)) {
    await page.getByPlaceholder("الاسم الكريم…").fill("اختبار");
    await start.click();
    await expect(page.locator("aside.sidebar")).toBeVisible({ timeout: 20000 });
  }
}

test("transfer card and recovery phrase", async ({ page }) => {
  await ensureProfile(page);
  await page.goto("/account");
  await expect(page.getByText("النقل لجهاز آخر")).toBeVisible();
  await page.getByRole("button", { name: "عبارة الاسترداد" }).click();
  await page.getByRole("button", { name: "إنشاء عبارة جديدة" }).click();
  await expect(page.locator(".words-grid span")).toHaveCount(12, { timeout: 15000 });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "حُفظت" }).click();
});

test("qr snapshot renders codes", async ({ page }) => {
  await ensureProfile(page);
  await page.goto("/account");
  await page.locator(".transfer-pane input").first().fill("123456");
  await page.getByRole("button", { name: "عرض الرموز" }).click();
  await expect(page.locator(".qr-stage canvas")).toBeVisible({ timeout: 20000 });
});
