import { expect, test, type Page } from "@playwright/test";

async function ensureProfile(page: Page, name = "اختبار") {
  await page.goto("/");
  // Strict: every test gets a fresh context, so the gate MUST appear.
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

test("recovery route renders health with no hydration errors", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await page.goto("/recovery");
  // headless Chromium reports navigator.language=en → page auto-flips to EN
  await expect(page.getByRole("heading", { name: /وضع الاسترداد|Recovery mode/ })).toBeVisible();
  await expect(page.getByText(/صحة التخزين|Storage health/)).toBeVisible();
  await expect(page.getByRole("button", { name: /تصدير طوارئ|Emergency export/ })).toBeVisible();
  expect(badLogs).toEqual([]);
});

test("corrupted dataset cannot take down the app and is quarantined", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);

  // corrupt the ACTIVE profile's daymode + tasbeeh values in place
  // (daymode: unparseable; tasbeeh: structurally invalid envelope shape —
  // a bare 42 would be a *legitimate* legacy value that migrates cleanly)
  await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && /(^|_)wird-daymode-v1$/.test(k)) localStorage.setItem(k, "{oops");
      if (k && /(^|_)wird-tasbeeh-v2$/.test(k))
        localStorage.setItem(k, '{"day":"2026-09-12","value":"lots"}');
    }
  });
  await page.reload();
  // app still renders (safe fallbacks), no blank page, no crash
  await expect(page.locator("aside.sidebar")).toBeVisible({ timeout: 20000 });

  await page.goto("/recovery");
  // mount self-heals forward (fresh envelopes), but the evidence stays in
  // quarantine with reasons — nothing is silently emptied
  await expect(page.getByText(/wird-daymode-v1.*(parse|validate)/).first()).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText(/wird-tasbeeh-v2.*validate/).first()).toBeVisible();

  // emergency export distinguishes healthy from corrupt
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /تصدير طوارئ|Emergency export/ }).click();
  const file = await download;
  const path = await file.path();
  expect(path).toBeTruthy();
  expect(badLogs).toEqual([]);
});

test("profile A/B isolation survives switches and reloads", async ({ page }) => {
  await ensureProfile(page, "ألف");

  const habit = page.locator(".habit").first();
  await expect(habit).toBeVisible({ timeout: 15000 });
  const aState = await habit.evaluate((el) => el.classList.contains("completed"));
  if (!aState) await habit.click();
  await expect.poll(() => habit.evaluate((el) => el.classList.contains("completed"))).toBe(true);

  // create profile B via logout → add account
  await page.goto("/account");
  await page.getByRole("button", { name: "تبديل الحساب" }).first().click();
  await expect(page.getByRole("heading", { name: "من يستخدم ورد اليوم؟" })).toBeVisible({
    timeout: 15000,
  });
  await page.getByPlaceholder("الاسم الكريم…").fill("باء");
  await page.getByRole("button", { name: "إضافة حساب" }).click();
  await expect(page.locator("aside.sidebar")).toBeVisible({ timeout: 20000 });

  // B starts fresh: same first habit must NOT be completed
  await page.goto("/");
  const habitB = page.locator(".habit").first();
  await expect(habitB).toBeVisible({ timeout: 15000 });
  await expect.poll(() => habitB.evaluate((el) => el.classList.contains("completed"))).toBe(false);

  // switch back to A (logout → pick A) → A's toggle survived
  await page.goto("/account");
  await page.getByRole("button", { name: "تبديل الحساب" }).first().click();
  await page.getByRole("button", { name: /ألف/ }).click();
  await expect(page.locator("aside.sidebar")).toBeVisible({ timeout: 20000 });
  await page.goto("/");
  await expect
    .poll(() =>
      page
        .locator(".habit")
        .first()
        .evaluate((el) => el.classList.contains("completed")),
    )
    .toBe(true);

  await page.reload();
  await expect
    .poll(() =>
      page
        .locator(".habit")
        .first()
        .evaluate((el) => el.classList.contains("completed")),
    )
    .toBe(true);
});
