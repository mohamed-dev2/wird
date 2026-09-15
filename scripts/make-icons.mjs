// Icon rasterizer (one-off contributor tool): renders public/icon.svg
// to exact-size PNGs for Apple touch + Android installability.
// Provenance: pixels derive 1:1 from the reviewed vector source.
// Regenerate with: node scripts/make-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(ROOT, "public", "icon.svg"), "utf8");
const { chromium } = await import("@playwright/test");
const browser = await chromium.launch();
for (const [name, size] of [
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<html><body style="margin:0"><div style="width:${size}px;height:${size}px">${svg.replace(
      "<svg ",
      `<svg width="${size}" height="${size}" `,
    )}</div></body></html>`,
  );
  const shot = await page.locator("div").screenshot({ omitBackground: false });
  writeFileSync(join(ROOT, "public", name), shot);
  console.log("icon:", name, shot.length + "B");
  await page.close();
}
await browser.close();
