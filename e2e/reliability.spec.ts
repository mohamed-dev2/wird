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

/** Seed 3 years of bare-legacy history (migrates on read, like real aging data). */
async function seedYears(page: Page, years: number) {
  await page.evaluate((yrs: number) => {
    const today = new Date();
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const hist: Record<string, { day: string; ids: string[]; pages: number }> = {};
    const total = yrs * 365;
    for (let o = 0; o < total; o++) {
      if (o % 7 === 6) continue; // weekly rest stays unknown
      const d = new Date(today);
      d.setDate(d.getDate() - o);
      const day = iso(d);
      hist[day] = { day, ids: ["fajr-jamaa", "morning", "witr"], pages: o % 3 };
    }
    const active = localStorage.getItem("wird-active-profile");
    const prefix = active ? `p_${active}_` : "";
    localStorage.setItem(`${prefix}wird-history-v1`, JSON.stringify(hist));
  }, years);
}

test("three years of history render insights without freezing", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await seedYears(page, 3);
  await page.reload();
  await page.goto("/insights");
  await expect(page.getByText(/الاتجاهات|Trends/)).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/خريطة النشاط|Activity heatmap/)).toBeVisible({ timeout: 30000 });
  expect(badLogs).toEqual([]);
});

test("wipe downloads a rescue snapshot before erasing", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await seedYears(page, 1);
  await page.goto("/account");
  page.on("dialog", (d) => void d.accept());
  const download = page.waitForEvent("download", { timeout: 30000 });
  await page.getByRole("button", { name: /مسح الكل|Erase all/ }).click();
  const dl = await download;
  expect(dl.suggestedFilename()).toMatch(/wird-emergency-.*\.json/);
  await expect(page.getByText(/مُسحت كل البيانات|All data erased/)).toBeVisible();
  // Gone: every user dataset. Kept: system logs only (quarantine/health
  // if any) — including the export log, which records the rescue itself.
  const leftover = await page.evaluate(() => {
    const out: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) as string;
      if (k) out.push(k);
    }
    return out;
  });
  const userKeys = leftover.filter(
    (k) => k !== "wird-quarantine-v1" && k !== "wird-health-v1" && k !== "wird-export-log-v1",
  );
  expect(userKeys).toEqual([]);
  expect(leftover).toContain("wird-export-log-v1");
  expect(badLogs).toEqual([]);
});
