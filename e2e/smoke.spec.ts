import { expect, test } from "@playwright/test";

test("today loads, toggles persist, no hydration errors", async ({ page }) => {
  const badLogs: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && /hydrat/i.test(msg.text())) badLogs.push(msg.text());
  });
  page.on("pageerror", (err) => badLogs.push(String(err)));

  await page.goto("/");
  // wait for client hydration (mount effect fills the Hijri date line)
  await page.waitForFunction(() => {
    const el = document.querySelector("header .eyebrow");
    return !!el && el.textContent !== "يوم جديد";
  });
  await expect(page.getByRole("heading", { name: /صباح النور/ })).toBeVisible();

  const firstHabit = page.locator(".habit").first();
  const wasDone = await firstHabit.evaluate((el) => el.classList.contains("completed"));
  await firstHabit.click();
  await expect
    .poll(() => firstHabit.evaluate((el) => el.classList.contains("completed")))
    .toBe(!wasDone);

  await page.reload();
  await expect
    .poll(() => firstHabit.evaluate((el) => el.classList.contains("completed")))
    .toBe(!wasDone);
  // restore original state
  await firstHabit.click();

  expect(badLogs).toEqual([]);
});

test("routes render: calendar, review, insights", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: /تقويم رحلتك/ })).toBeVisible();
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: /ماذا فعلت اليوم/ })).toBeVisible();
  await page.goto("/insights");
  await expect(page.getByRole("heading", { name: /خطواتك الهادئة/ })).toBeVisible();
});
