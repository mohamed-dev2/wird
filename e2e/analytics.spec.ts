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

/** Seed 30 days of mixed bare-legacy history + a few reviews. */
async function seedMonth(page: Page) {
  await page.evaluate(() => {
    const today = new Date();
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const shift = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return iso(d);
    };
    const hist: Record<string, { day: string; ids: string[]; pages: number }> = {};
    for (let o = 0; o < 30; o++) {
      if (o % 5 === 4) continue; // rest days stay unrecorded (unknown)
      const day = shift(o);
      hist[day] = { day, ids: ["fajr-jamaa", "morning", "witr"], pages: o % 2 === 0 ? 2 : 0 };
    }
    const reviews: Record<
      string,
      { items: Record<string, string>; score: number; mood: string; gratitude: string }
    > = {};
    for (let o = 0; o < 10; o++) {
      const day = shift(o);
      if (!hist[day]) continue;
      reviews[day] = {
        items: { "fajr-jamaa": "done" },
        score: 75,
        mood: ["good", "ok", "low"][o % 3] as string,
        gratitude: o % 2 === 0 ? "family" : "",
      };
    }
    const active = localStorage.getItem("wird-active-profile");
    const prefix = active ? `p_${active}_` : "";
    const put = (dataset: string, value: string) => {
      let done = false;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k === dataset || k === `${prefix}${dataset}`)) {
          localStorage.setItem(k, value);
          done = true;
        }
      }
      if (!done) localStorage.setItem(`${prefix}${dataset}`, value);
    };
    put("wird-history-v1", JSON.stringify(hist));
    put("wird-reviews-v1", JSON.stringify(reviews));
  });
}

test("insights layers render real analytics, honestly labeled", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await seedMonth(page);
  await page.reload();
  await page.goto("/insights");

  // layered sections with evidence-backed content
  await expect(page.getByText(/الاتجاهات|Trends/)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/العبادات|Habits/)).toBeVisible();
  await expect(page.getByText(/خريطة النشاط|Activity heatmap/)).toBeVisible();
  // heatmap carries the faith disclaimer, not just colors
  await expect(page.getByText(/ليس مقياسًا للإيمان|not a measure of faith/)).toBeVisible();
  // mood section states its limits
  await expect(page.getByText(/ليست تشخيصًا|not a diagnosis/)).toBeVisible();

  // custom preset keeps the page coherent
  await page.getByRole("button", { name: "90", exact: true }).first().click();
  await expect(page.getByText(/الاتجاهات|Trends/)).toBeVisible();
  expect(badLogs).toEqual([]);
});

test("insights with no history says so instead of inventing", async ({ page }) => {
  const badLogs = watchHydration(page);
  await ensureProfile(page);
  await page.goto("/insights");
  await expect(page.getByText(/لا بيانات كافية بعد|Not enough data yet/).first()).toBeVisible({
    timeout: 20000,
  });
  expect(badLogs).toEqual([]);
});
