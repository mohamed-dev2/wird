// Verifies DOCUMENTATION.md stays in sync with the code:
// 1. every `wird-*` storage key literal in app/ is named in §4
// 2. every route directory under app/ is named in §2
// 3. AR/EN dictionary key parity
// Run: npm run docs:check (also runs in CI)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "app");
const DOC = readFileSync(join(ROOT, "DOCUMENTATION.md"), "utf8");

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e === "node_modules" || e === ".next") continue;
      out.push(...walk(p));
    } else if (/\.(ts|tsx)$/.test(e) && !e.includes(".test.")) {
      out.push(p);
    }
  }
  return out;
}

let failed = false;

// 1. storage keys
const keys = new Set();
for (const f of walk(APP)) {
  const s = readFileSync(f, "utf8");
  for (const m of s.matchAll(/"(wird-[a-z0-9-]+)"/g)) keys.add(m[1]);
  for (const m of s.matchAll(/`(wird-[a-z0-9-]+)\$\{/g)) keys.add(m[1] + "*");
}
const missingKeys = [...keys].filter((k) => !DOC.includes(k.replace("*", "")));
if (missingKeys.length > 0) {
  console.error("docs:check — storage keys missing from DOCUMENTATION.md §4:");
  for (const k of missingKeys) console.error("  -", k);
  failed = true;
} else {
  console.log(`docs:check — ${keys.size} storage keys documented ✓`);
}

// 2. routes
const routes = readdirSync(APP, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !["components", "lib"].includes(e.name))
  .map((e) => e.name);
const missingRoutes = routes.filter((r) => !DOC.includes(`\`${r}\``) && !DOC.includes(`/${r}`));
if (missingRoutes.length > 0) {
  console.error("docs:check — routes missing from DOCUMENTATION.md §2:");
  for (const r of missingRoutes) console.error("  -", r);
  failed = true;
} else {
  console.log(`docs:check — routes documented ✓ (${routes.join(", ")})`);
}

// 3. dictionary parity
const strings = readFileSync(join(APP, "lib", "strings.ts"), "utf8");
const ar = strings.split("const EN")[0];
const en = strings.split("const EN")[1] ?? "";
const keyRe = /^  "([^"]+)":/gm;
const arKeys = new Set([...ar.matchAll(keyRe)].map((m) => m[1]));
const enKeys = new Set([...en.matchAll(keyRe)].map((m) => m[1]));
const onlyAr = [...arKeys].filter((k) => !enKeys.has(k));
const onlyEn = [...enKeys].filter((k) => !arKeys.has(k));
if (onlyAr.length > 0 || onlyEn.length > 0) {
  console.error("docs:check — dictionary parity broken:", { onlyAr, onlyEn });
  failed = true;
} else {
  console.log(`docs:check — dictionary parity ✓ (${arKeys.size} keys)`);
}

if (failed) process.exit(1);
console.log("docs:check — all green ✓");
