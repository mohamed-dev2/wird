// README screenshots (one-off contributor tool, not a gate): boots the
// production server, captures representative screens, writes
// docs/assets/shots/*.png. Provenance: generated from the app's own
// UI at the current commit — regenerate after visual changes with:
//   npm run build && node scripts/shot-readme.mjs
// Keep shots few and small; alt text lives in README.md.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs", "assets", "shots");
mkdirSync(OUT, { recursive: true });

const server = spawn("node", ["node_modules/next/dist/bin/next", "start", "--port", "3135"], {
  cwd: ROOT,
  stdio: "ignore",
  shell: false,
});
const kill = () => {
  try {
    server.kill();
  } catch {}
};
process.on("exit", kill);

async function ready() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch("http://127.0.0.1:3135/");
      if (r.ok) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error("server never came up");
}

try {
  await ready();
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const shot = async (name, route, setup, viewport) => {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:3135${route}`);
    const start = page.getByRole("button", { name: /ابدأ رحلتك|إضافة حساب/ });
    await start.waitFor({ timeout: 30000 });
    await page.getByPlaceholder("الاسم الكريم…").fill("زائر");
    await start.click();
    await page
      .locator("aside.sidebar:visible, nav.bottom-nav:visible")
      .first()
      .waitFor({ timeout: 30000 });
    if (setup) await setup(page);
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(OUT, name), fullPage: false });
    await ctx.close();
    console.log("shot:", name);
  };
  const desktop = { width: 1280, height: 800 };
  await shot("today.png", "/", null, desktop);
  await shot(
    "deen.png",
    "/deen",
    async (page) => {
      await page.locator(".deen-levels button").nth(1).click();
      await page.locator(".deen-prayer").first().click();
    },
    desktop,
  );
  await shot("library.png", "/library", null, desktop);
  await shot("mobile.png", "/", null, { width: 390, height: 844 });
  await browser.close();
  console.log("done");
} finally {
  kill();
}
