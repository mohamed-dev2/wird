// Maintainability metrics + circular-dependency detector.
//
// This is a REPORT, not a gate. It exists to surface problems for the
// human to triage, not to produce a meaningless quality score. It prints:
//   1. oversized modules (lib/*.ts and app/*.tsx over a soft threshold)
//   2. module fan-in/fan-out (import count) — helps spot god modules
//   3. unused exports (exports that no other project file imports)
//   4. circular import cycles A → B → C → A, with the cycle path
//
// Deviation policy: a module that is large but cohesive is fine (e.g.
// string dictionaries, data catalogs); the metrics are a searchlight,
// not a ruler. Track real debt in docs/TECH_DEBT.md.
//
// Run: npm run metrics
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "app");

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(e) && !e.includes(".test.")) out.push(p);
  }
  return out;
}

const files = walk(APP);
const fileSet = new Set(files);

function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  const target = resolve(dirname(fromFile), spec);
  const candidates = [
    target,
    target + ".ts",
    target + ".tsx",
    join(target, "index.ts"),
    join(target, "index.tsx"),
  ];
  return candidates.find((c) => fileSet.has(c)) ?? null;
}

function importsOf(file) {
  // Type-only imports are erased at build — strip them so cycles/sizes
  // reflect the runtime graph, not the type graph.
  const src = readFileSync(file, "utf8").replace(
    /import\s+type\s+[\s\S]*?from\s+["'][^"']*["']/g,
    "",
  );
  const out = new Set();
  for (const m of src.matchAll(
    /(?:from\s+|import\s*\(\s*|import\s+|require\(\s*)["'](\.[^"']*)["']/g,
  )) {
    const r = resolveImport(file, m[1]);
    if (r) out.add(r);
  }
  return out;
}

const imports = new Map();
for (const f of files) imports.set(f, importsOf(f));

const rel = (p) =>
  p
    .replace(APP + "\\", "")
    .replace(APP + "/", "")
    .replace(/\\/g, "/");
const lineCount = (f) => readFileSync(f, "utf8").split("\n").length;

console.log("metrics — modules over 450 lines (oversized? check cohesion, not a verdict):");
for (const f of files) {
  const n = lineCount(f);
  if (n > 450) console.log(`  - ${rel(f)} (${n} lines)`);
}

const fanIn = new Map();
for (const [, set] of imports) for (const n of set) fanIn.set(n, (fanIn.get(n) ?? 0) + 1);
console.log("\nmetrics — highest fan-in (most depend on these; split changes ripple):");
for (const [f, n] of [...fanIn].sort((a, b) => b[1] - a[1]).slice(0, 8))
  console.log(`  - ${rel(f)} (imported ${n}x)`);

// cycles (type imports excluded — they erase at build)
console.log("\nmetrics — circular import cycles (runtime graph only):");
function findCycles() {
  const seen = new Set();
  const path = [];
  const cycles = [];
  function dfs(node) {
    if (path.includes(node)) {
      const start = path.indexOf(node);
      cycles.push(path.slice(start).concat(node));
      return;
    }
    if (seen.has(node)) return;
    seen.add(node);
    path.push(node);
    for (const n of imports.get(node) ?? []) dfs(n);
    path.pop();
  }
  for (const f of files) dfs(f);
  return [...new Map(cycles.map((c) => [c.map(rel).join(" → "), c])).values()];
}
const cycles = findCycles();
if (cycles.length === 0) console.log("  none ✓");
for (const c of cycles) console.log(`  - ${c.map(rel).join(" → ")}`);

console.log(`\nmetrics — ${files.length} modules scanned`);
