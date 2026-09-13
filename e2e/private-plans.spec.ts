// Private plans e2e (STEP 4): neutral synthetic fixtures only ("Private
// Plan A") — never sensitive example data. Verifies the lifecycle, the
// history-preserving reset, quick exit, and URL/title discretion.
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

test("private plan lifecycle: create, check in, setback preserves history", async ({ page }) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);

  await page.goto("/account");
  // The link lives inside the privacy accordion — expand it first.
  await page.getByRole("button", { name: /خصوصيتي وبياناتي|Privacy & data/ }).click();
  await page.getByRole("link", { name: /خطط خاصة|Private plans/ }).click();
  await expect(page).toHaveURL(/private-plans/);

  // Create with an explicit neutral name.
  await page.getByRole("button", { name: /خطة خاصة جديدة|New private plan/ }).click();
  await page.getByPlaceholder(/خطة خاصة أ|Private Plan A/).fill("Private Plan A");
  await page.getByRole("button", { name: /^احفظ الخطة$|^Save plan$/ }).click();
  await expect(page.getByRole("button", { name: /كل الخطط|All plans/ })).toBeVisible();

  // Daily check-in.
  await page.getByRole("button", { name: /تسجيل اليوم|Check in today/ }).click();
  await expect(page.getByText(/تم تسجيل اليوم\.|Checked in for today\./)).toBeVisible();

  // Setback: current run restarts, affirmation shows, history stays.
  await page.getByRole("button", { name: /^تسجيل انتكاسة$|^Record a setback$/ }).click();
  await page.getByRole("button", { name: /احفظ الانتكاسة|Save setback/ }).click();
  await expect(page.getByText(/بدأ مداك الحالي من جديد|Your current run restarted/)).toBeVisible();
  await expect(page.getByText(/انتكاسة|setback/, { exact: false }).first()).toBeVisible();

  // Persistence across reload: plan + journey survive (selection is
  // in-memory by design — no IDs in URLs — so reopen from the list,
  // which shows the discreet generic name).
  await page.reload();
  await page
    .getByRole("button", { name: /خطة خاصة A|Private Plan A/ })
    .first()
    .click();
  await expect(page.getByRole("button", { name: /كل الخطط|All plans/ })).toBeVisible();
  // The setback survived the reload: timeline entry + restarted run persist.
  await expect(
    page.getByText(/انتكاسة · \d{4}-\d{2}-\d{2}|setback · \d{4}-\d{2}-\d{2}/),
  ).toBeVisible();
  await expect(page.getByText(/المدى الحالي|Current run/)).toBeVisible();

  expect(badLogs).toEqual([]);
});

test("quick exit returns to a neutral screen", async ({ page }) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);
  await page.goto("/private-plans");
  await page
    .getByRole("button", { name: /^خروج$|^Exit$/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("aside.sidebar")).toBeVisible();
  expect(badLogs).toEqual([]);
});

test("no sensitive data leaks into URL or document title", async ({ page }) => {
  const badLogs = hydrateGuard(page);
  await ensureProfile(page);
  await page.goto("/private-plans");
  const url = page.url();
  expect(url).not.toContain("?");
  expect(url).not.toMatch(/addict|relapse|porn|drug|alcohol|smok|pornography/i);
  // Wait for client hydration (title is set in a mount effect).
  await expect(page.getByRole("heading", { name: /خطط خاصة|Private plans/ })).toBeVisible();
  const title = await page.title();
  expect(title).toMatch(/خطط خاصة|Private plans/);
  expect(title).not.toMatch(/addict|relapse|porn|drug/i);
  expect(badLogs).toEqual([]);
});
