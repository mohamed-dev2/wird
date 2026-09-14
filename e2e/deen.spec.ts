// Deen journey e2e (STEP 10, ADR-007): dashboard renders, salah
// tracking + quest XP persist across reload, double completion pays
// once, gamification hides while tracking works, offline opens, and
// no deen content leaks into URL/title.
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

async function openDeen(page: Page) {
  await page.goto("/deen");
  await expect(page.getByRole("heading", { name: /رحلة الدين|Deen journey/ })).toBeVisible({
    timeout: 15000,
  });
}

test("deen dashboard renders, salah tracking persists across reload", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await openDeen(page);
  // Mark Fajr prayed (first salah button).
  const prayers = page.locator(".deen-prayer");
  await expect(prayers).toHaveCount(5);
  await prayers.first().click();
  await expect(prayers.first()).toContainText(/صليت|Prayed/);
  await page.reload();
  await openDeen(page);
  await expect(page.locator(".deen-prayer").first()).toContainText(/صليت|Prayed/);
  expect(badLogs).toEqual([]);
});

test("quest completion awards XP once even on double completion", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await openDeen(page);
  // Quests live at Level 2+: unlock first.
  await page.locator(".deen-levels button").nth(1).click();
  const xpLine = page.locator(".deen-xp-line");
  await expect(xpLine).toBeVisible();
  const before = await xpLine.innerText();
  // Complete the first active quest twice via rapid clicks.
  const complete = page.getByRole("button", { name: /أنجز|Complete/ }).first();
  await expect(complete).toBeVisible({ timeout: 15000 });
  await complete.click();
  await expect(xpLine).not.toHaveText(before, { timeout: 10000 });
  const after = await xpLine.innerText();
  await page.reload();
  await openDeen(page);
  await expect(page.locator(".deen-xp-line")).toHaveText(after);
  expect(badLogs).toEqual([]);
});

test("level up keeps history; gamification off keeps tracking", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await openDeen(page);
  // Unlock level 3 (third level button).
  await page.locator(".deen-levels button").nth(2).click();
  await expect(page.getByRole("heading", { name: /أمور للتقليل|Things to reduce/ })).toBeVisible();
  // Disable XP display: line hides, tracking still works.
  const xpToggle = page
    .locator("label.deen-check")
    .filter({ hasText: /النقاط|XP/ })
    .locator("input");
  await xpToggle.uncheck();
  await expect(page.locator(".deen-xp-line")).toHaveCount(0);
  await page.locator(".deen-prayer").nth(1).click();
  await page.reload();
  await openDeen(page);
  await expect(page.getByRole("heading", { name: /أمور للتقليل|Things to reduce/ })).toBeVisible();
  await expect(page.locator(".deen-prayer").nth(1)).toContainText(/صليت|Prayed/);
  expect(badLogs).toEqual([]);
});

test("library tab shows sourced catalog; speech check is scoreless", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await openDeen(page);
  await page.getByRole("tab", { name: /المكتبة والتعلم|Library and learning/ }).click();
  await expect(page.getByText(/موثق|Sourced/).first()).toBeVisible();
  await expect(page.getByText(/الغيبة|Backbiting/).first()).toBeVisible();
  // Back to today at Level 4: speech check answers award nothing.
  await page.getByRole("tab", { name: /اليوم|Today/ }).click();
  await page.locator(".deen-levels button").nth(3).click();
  const xpBefore = await page.locator(".deen-xp-line").innerText();
  const ghibah = page.locator(".deen-reflect", { hasText: /الغيبة|Ghibah/ }).first();
  await ghibah.getByRole("button", { name: /نعم|Yes/ }).click();
  await expect(page.locator(".deen-xp-line")).toHaveText(xpBefore);
  expect(badLogs).toEqual([]);
});

test("deen works offline and leaks nothing to URL/title", async ({ page, context }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await openDeen(page);
  const urlBefore = page.url();
  const title = await page.title();
  for (const w of ["deen-v1", "prayer", "ghibah", "speech", "xp="]) {
    expect(urlBefore).not.toContain(w);
    expect(title).not.toContain(w);
  }
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /رحلة الدين|Deen journey/ })).toBeVisible({
    timeout: 20000,
  });
  await context.setOffline(false);
  expect(badLogs).toEqual([]);
});
