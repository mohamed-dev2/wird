import { expect, test, type Page } from "@playwright/test";

// NOTE: the main app defaults to Arabic (stored lang, default "ar"); the
// headless locale only affects the standalone /recovery page. All selectors
// below accept both languages.

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

/** Seed a bare legacy history + stale lastseen for the active profile. */
async function seedAbsence(page: Page, gapDays: number, activeBefore: number) {
  await page.evaluate(
    ([gap, before]: [number, number]) => {
      const today = new Date();
      const iso = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const shift = (n: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() - n);
        return iso(d);
      };
      const hist: Record<string, { day: string; ids: string[]; pages: number }> = {};
      for (let i = gap + 1; i <= gap + before; i++) {
        const day = shift(i);
        hist[day] = { day, ids: ["fajr-jamaa", "morning"], pages: 2 };
      }
      const targets = new Map<string, string>([
        ["wird-lastseen-v1", JSON.stringify(shift(gap))],
        ["wird-history-v1", JSON.stringify(hist)],
      ]);
      const active = localStorage.getItem("wird-active-profile");
      const prefix = active ? `p_${active}_` : "";
      for (const [dataset, value] of targets) {
        let done = false;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k === dataset || k === `${prefix}${dataset}`)) {
            localStorage.setItem(k, value);
            done = true;
          }
        }
        if (!done) localStorage.setItem(`${prefix}${dataset}`, value);
      }
    },
    [gapDays, activeBefore] as [number, number],
  );
}

const SHAME_RE =
  /abandoned your worship|iman is weak|Allah is angry|becoming lazy|you struggle every|تركت عبادتك|إيمانك ضعيف|الله غاضب/;

test("fresh user gets a beginning, not statistics", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  // NOTE: no second goto — profile creation already lands on Today, and the
  // guidance log is per-day (a revisit would fatigue-skip the welcome)
  await expect(
    page.getByRole("heading", { name: /خطوتك الأولى تمت|Your first step is done/ }),
  ).toBeVisible({ timeout: 15000 });
  expect(badLogs).toEqual([]);
});

test("10-day absence → gentle return journey, no shame, working action", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await seedAbsence(page, 10, 5);
  await page.reload();

  // evolved return screen (medium tier), never shaming
  await expect(
    page.getByRole("heading", { name: /لا بأس أن تبدأ من جديد|It's fine to start over/ }),
  ).toBeVisible({ timeout: 20000 });
  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText).not.toMatch(SHAME_RE);

  // verified verse renders with attribution (async bundle load)
  await expect(page.getByText(/^(قرآن|Quran)$/).first()).toBeVisible({ timeout: 20000 });

  // dismiss → companion card: today's starter habits already count as
  // activity, so the engine correctly reports RETURNING (not absence)
  await page.getByRole("button", { name: /ابدأ من جديد|Start anew/ }).click();
  await expect(page.getByRole("heading", { name: /يوم العودة|Return day/ })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: /اجعل اليوم صغيرًا|Make today small/ }).click();
  await expect(page.locator("button.minimum[aria-pressed='true']")).toBeVisible({
    timeout: 10000,
  });
  expect(badLogs).toEqual([]);
});

test("95-day absence → deep restart with tawbah path", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await seedAbsence(page, 95, 5);
  await page.reload();

  await expect(page.getByRole("heading", { name: /من جديد تمامًا|completely fresh/ })).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByRole("heading", { name: /بداية جديدة|A fresh start/ })).toBeVisible();
  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText).not.toMatch(SHAME_RE);

  await page.getByRole("button", { name: /أكمل مع ورد|Continue with Wird/ }).click();
  await expect(page.locator("section.hero")).toBeVisible({ timeout: 15000 });
  expect(badLogs).toEqual([]);
});
