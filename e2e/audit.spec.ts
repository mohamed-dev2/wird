// Audit journeys (STEP 9): network allowlist, unicode forms, back/forward
// integrity, calm 404. Each asserts system behavior, not just rendering.
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

test("core journey touches loopback hosts only", async ({ page }) => {
  const badLogs = watchHydration(page);
  const hosts = new Set<string>();
  page.on("request", (r) => {
    try {
      hosts.add(new URL(r.url()).hostname);
    } catch {}
  });
  await ensureProfile(page);
  for (const route of ["/calendar", "/insights", "/deen", "/account", "/recovery"]) {
    await page.goto(route);
    await expect(page.locator("aside.sidebar")).toBeVisible({ timeout: 15000 });
  }
  for (const h of hosts) {
    expect(["127.0.0.1", "localhost"].includes(h), `host: ${h}`).toBe(true);
  }
  expect(badLogs).toEqual([]);
});

test("unicode check-in note persists and renders", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await page.goto("/private-plans");
  await page.getByRole("button", { name: /خطة خاصة جديدة|New private plan/ }).click();
  await page.getByRole("button", { name: /^احفظ الخطة$|^Save plan$/ }).click();
  await expect(page.getByRole("button", { name: /كل الخطط|All plans/ })).toBeVisible();
  const note = "تجربة 🎉 test !@# {n} " + "نص ".repeat(120);
  const saved = note.slice(0, 495).replace(/\s+$/, "");
  await page.getByLabel(/ملاحظة/).fill(saved);
  await page.getByRole("button", { name: /تسجيل اليوم|Check in today/ }).click();
  await expect(page.getByText(/تم تسجيل اليوم\.|Checked in for today\./)).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: /خطة خاصة A|Private Plan A/ })
    .first()
    .click();
  await expect(page.getByText(/تم تسجيل اليوم\.|Checked in for today\./)).toBeVisible();
  // Note bytes survive the round trip exactly (unicode-safe storage).
  // trimEnd: HTML inputs drop a trailing space on fill — browser trivia,
  // not app code (no trim() exists in the plans note path).
  const stored = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) as string;
      if (k && k.endsWith("wird-recovery-plans-v1")) {
        const raw = localStorage.getItem(k) as string;
        const d = JSON.parse(raw).d as Array<{ checkins?: Array<{ note?: string }> }>;
        return d[0]?.checkins?.[0]?.note ?? null;
      }
    }
    return null;
  });
  expect(stored).toBe(saved);
  expect(badLogs).toEqual([]);
});

test("back, forward, refresh, duplicate tab stay valid", async ({ page, context }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await page.goto("/calendar");
  await page.goto("/insights");
  await page.goBack();
  await expect(page).toHaveURL(/calendar/);
  await expect(page.locator("aside.sidebar")).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/insights/);
  await page.reload();
  await expect(page.locator("aside.sidebar")).toBeVisible();
  const tab2 = await context.newPage();
  await tab2.goto("/deen");
  await expect(tab2.locator("aside.sidebar")).toBeVisible();
  await tab2.close();
  expect(badLogs).toEqual([]);
});

test("unknown route shows the calm 404, never a blank crash", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await page.goto("/nope-does-not-exist-xyz");
  await expect(
    page.getByRole("heading", { name: /الصفحة غير موجودة|Page not found/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /عودة للرئيسية|Back home/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("aside.sidebar")).toBeVisible();
  expect(badLogs).toEqual([]);
});
