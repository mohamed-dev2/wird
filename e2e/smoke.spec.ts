import { expect, test, type Page } from "@playwright/test";

async function ensureProfile(page: Page) {
  await page.goto("/");
  // Strict: every test gets a fresh context, so the gate MUST appear.
  // (A silent skip here used to convert slow first paints into confusing
  // downstream failures.)
  const start = page.getByRole("button", { name: /ابدأ رحلتك|إضافة حساب/ });
  await expect(start).toBeVisible({ timeout: 30000 });
  await page.getByPlaceholder("الاسم الكريم…").fill("اختبار");
  await start.click();
  await expect(page.locator("aside.sidebar")).toBeVisible({ timeout: 30000 });
}

test("today loads, toggles persist, no hydration errors", async ({ page }) => {
  const badLogs: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && /hydrat/i.test(msg.text())) badLogs.push(msg.text());
  });
  page.on("pageerror", (err) => badLogs.push(String(err)));

  await ensureProfile(page);
  await page.goto("/");
  // wait for client hydration (mount effect fills the Hijri date line)
  await page.waitForFunction(() => {
    const el = document.querySelector("header .eyebrow");
    return !!el && el.textContent !== "يوم جديد";
  });
  await expect(
    page.getByRole("heading", { name: /صباح النور|مساء النور|طاب يومك|ليلة هادئة/ }),
  ).toBeVisible();

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

test("routes render: calendar, deen review, insights, library", async ({ page }) => {
  await ensureProfile(page);
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: /تقويم رحلتك/ })).toBeVisible();
  await page.goto("/deen");
  await page.getByRole("tab", { name: /المراجعة|Review/ }).click();
  await expect(page.getByRole("heading", { name: /ماذا فعلت اليوم/ })).toBeVisible();
  await page.goto("/insights");
  await expect(page.getByRole("heading", { name: /خطواتك الهادئة/ })).toBeVisible();
  await page.goto("/library");
  await expect(page.getByRole("button", { name: "القرآن" })).toBeVisible();
});

test("theme and language persist", async ({ page }) => {
  await ensureProfile(page);
  await page.goto("/account");
  await page.getByRole("button", { name: "ليلي", exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  await page.getByRole("button", { name: "English" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dir)).toBe("ltr");
  await expect(page.locator("aside.sidebar").getByRole("link", { name: "Today" })).toBeVisible();
  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  await expect.poll(() => page.evaluate(() => document.documentElement.dir)).toBe("ltr");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await page.getByRole("button", { name: "العربية" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dir)).toBe("rtl");
});

test("card tilt sets 3d vars on hover", async ({ page }) => {
  await ensureProfile(page);
  await page.goto("/");
  const card = page.locator(".card[data-tilt]").first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await expect
    .poll(() => card.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--rx") !== ""))
    .toBe(true);
});

test("ayah hover opens a floating choice-list menu, memorize persists", async ({ page }) => {
  await ensureProfile(page);
  await page.goto("/library");
  await page.getByRole("button", { name: "القرآن" }).click();
  const trigger = page.locator(".ayah-trigger").first();
  await expect(trigger).toBeVisible({ timeout: 20000 });
  await trigger.click();
  const menu = page.locator(".ayah-menu").first();
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /استمع|Listen/ })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /تفسير|Tafsir/ })).toBeVisible();
  await menu.getByRole("menuitemcheckbox", { name: /حفظ|Memorized/ }).click();
  await expect(menu).toBeHidden();
  await page.reload();
  await page.goto("/library");
  await page.getByRole("button", { name: "القرآن" }).click();
  const trigger2 = page.locator(".ayah-trigger").first();
  await expect(trigger2).toBeVisible({ timeout: 20000 });
  await trigger2.click();
  await expect(
    page
      .locator(".ayah-menu")
      .first()
      .getByRole("menuitemcheckbox", { name: /حفظ|Memorized/ }),
  ).toHaveAttribute("aria-checked", "true");
});

test("prayer arc renders between configured times", async ({ page }) => {
  await ensureProfile(page);
  await page.evaluate(() => {
    try {
      localStorage.setItem(
        "wird-prayer-times-v1",
        JSON.stringify({
          fajr: "05:00",
          dhuhr: "12:00",
          asr: "15:30",
          maghrib: "18:00",
          isha: "19:30",
        }),
      );
    } catch {}
  });
  await page.reload();
  await page.goto("/");
  const arc = page.locator(".prayer-arc").first();
  await expect(arc).toBeVisible({ timeout: 20000 });
  await expect(arc.locator(".arc-sun")).toBeVisible();
});
