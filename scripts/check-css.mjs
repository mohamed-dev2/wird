// Verifies CSS conventions (CONTRIBUTING.md):
// 1. No physical box properties outside explicit `[dir=]` mirror blocks —
//    logical properties (inset-inline-*, margin-inline-*) keep RTL correct.
//    Genuinely direction-locked lines carry trailing `/* rtl:keep: reason */`.
// 2. !important stays under budget (escape hatches, not architecture).
// Run: npm run css:check.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "app");
const IMPORTANT_BUDGET = 20;

const physical =
  /(^|[\s{;])(margin|padding)-(left|right)\s*:|(^|[\s{;])(left|right)\s*:|(^|[\s{;])text-align\s*:\s*(left|right)/;

let failed = false;
let important = 0;
let waived = 0;
for (const e of readdirSync(APP)) {
  if (!e.endsWith(".css")) continue;
  const lines = readFileSync(join(APP, e), "utf8").split("\n");
  // Lines inside an explicit `[dir="ltr"]` / `[dir="rtl"]` mirror block are
  // direction-locked by construction — the selector says so.
  let dirDepth = -1;
  let depth = 0;
  lines.forEach((line, i) => {
    // Escape hatch for genuinely direction-locked rules: trailing
    // `/* rtl:keep */` with a reason. Audited, not invisible.
    if (line.includes("rtl:keep")) {
      waived++;
    } else {
      const opens = (line.match(/{/g) ?? []).length;
      if (opens > 0 && /\[dir=/.test(line)) dirDepth = depth;
      const code = line.split("/*")[0] ?? "";
      if (dirDepth < 0 && physical.test(code)) {
        console.error(`css:check — physical property in ${e}:${i + 1}: ${line.trim()}`);
        failed = true;
      }
      depth += opens - (line.match(/}/g) ?? []).length;
      if (depth <= dirDepth) dirDepth = -1;
    }
    if ((line.split("/*")[0] ?? "").includes("!important")) important++;
  });
}
if (important > IMPORTANT_BUDGET) {
  console.error(`css:check — !important over budget: ${important} > ${IMPORTANT_BUDGET}`);
  failed = true;
}
if (failed) process.exit(1);
console.log(`css:check — logical properties ✓ (!important: ${important}, waived: ${waived})`);
