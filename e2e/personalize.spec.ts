// Personalization e2e (STEP 6): fatigue notice appears after real absence
// and pausing resolves it; preference toggles persist across reload.
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

/** Seed reminders-ON (device-global key!) + stale lastseen (per-profile). */
async function seedFatigue(page: Page, gapDays: number) {
  await page.evaluate((gap: number) => {
    const today = new Date();
    const d = new Date(today);
    d.setDate(d.getDate() - gap);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const active = localStorage.getItem("wird-active-profile");
    const prefix = active ? `p_${active}_` : "";
    const env = (v: unknown) => JSON.stringify({ __wird: { v: 1, updatedAt: Date.now() }, d: v });
    localStorage.setItem(
      "wird-reminders-v1",
      env({ enabled: true, bedtime: "22:00", ladder: true, tone: "balanced" }),
    );
    localStorage.setItem(`${prefix}wird-lastseen-v1`, env(iso));
  }, gapDays);
}

test("fatigue notice appears after absence, pause resolves it", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  // Seed on /account and stay there: mounting Today would refresh lastseen
  // (the app's normal write path) and erase the simulated absence.
  await page.goto("/account");
  await seedFatigue(page, 10);
  await page.reload();
  // Notice names the absence count honestly, offers pause (never more nudges).
  await expect(page.getByText(/تذكيرات بلا استجابة|Reminders going unanswered/)).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText(/منذ 10 أيام|in 10 days/)).toBeVisible();
  await page.getByRole("button", { name: /إيقاف مؤقت|Pause/ }).click();
  await expect(page.getByText(/تذكيرات بلا استجابة|Reminders going unanswered/)).toHaveCount(0);
  expect(badLogs).toEqual([]);
});

test("personalization toggles persist across reload", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await page.goto("/account");
  // Mood analysis toggle lives in the personalization card.
  const toggle = page.getByRole("button", { name: /تحليل المزاج|Analyze mood/ });
  await expect(toggle).toBeVisible({ timeout: 15000 });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await page.goto("/account");
  await expect(page.getByRole("button", { name: /تحليل المزاج|Analyze mood/ })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  // Restore default for isolation.
  await page.getByRole("button", { name: /تحليل المزاج|Analyze mood/ }).click();
  expect(badLogs).toEqual([]);
});
