// Verifies every non-test source file under app/ opens with a purposeful
// file-header comment (readability standard). A header is 2+ consecutive
// `//` lines within the first 6 lines explaining WHAT the file owns and
// one key invariant — never restated code. Run: npm run comments:check.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "app");

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

const missing = [];
for (const f of walk(APP)) {
  const lines = readFileSync(f, "utf8").split("\n").slice(0, 6);
  const header = lines.filter((l) => {
    const t = l.trimStart();
    return t.startsWith("//") || t.startsWith("/*") || t.startsWith("*");
  });
  if (header.length < 2) missing.push(f.replace(`${ROOT}\\`, "").replace(`${ROOT}/`, ""));
}

if (missing.length > 0) {
  console.error("comments:check — files missing a 2+ line header comment:");
  for (const f of missing) console.error("  -", f);
  process.exit(1);
}
console.log("comments:check — all source files documented ✓");
