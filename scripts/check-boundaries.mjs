// Architectural boundary enforcement.
//
// Rules (each is a documented invariant — see docs/ARCHITECTURE.md):
//   R1  lib/* must never value-import components/* (UI layer below logic
//       layer). `import type` is allowed (erased at build). A file can
//       opt out with `/* boundary-allow: R1 */` + a docs/TECH_DEBT.md row.
//   R2  lib/schema.ts is the foundation: it must not import project files.
//   R3  Pure/offline modules (all of lib/ except the online-only modules
//       tafsir/audio/hadith-full) must not reach those modules.
//       Same-origin bundles (lib/quran.ts) are offline-safe (service
//       worker) and intentionally reachable.
//   R4  lib/privacy.ts NETWORK_ACCESS hostnames must match next.config.ts
//       CSP (same-origin + WebRTC entries are descriptive, not hostnames).
//
// This is a linter, not a bundler — unresolved relative imports are
// reported rather than ignored so the graph stays honest.
//
// Run: npm run boundaries:check  (also part of npm run diagnose)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "app");
const LIB = join(APP, "lib");
const COMP = join(APP, "components");

// Online-only modules (network beyond same-origin). Same-origin quran.ts
// is intentionally NOT here (SW-cached, works offline).
const NET_MODULES = new Set(["tafsir.ts", "audio.ts", "hadith-full.ts"].map((n) => join(LIB, n)));

function walkTs(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walkTs(p));
    else if (/\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

const files = [];
for (const d of [LIB, COMP]) files.push(...walkTs(d));
const fileSet = new Set(files);
const scanTargets = files.filter((f) => !f.includes("__tests__"));

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

// Type-only imports are erased at build; strip them before value scanning.
const valueImportsOf = (src) => {
  const withoutTypes = src.replace(/import\s+type\s+[\s\S]*?from\s+["'][^"']*["']/g, "");
  return withoutTypes;
};

function importsOf(file) {
  const src = valueImportsOf(readFileSync(file, "utf8"));
  const out = new Set();
  for (const m of src.matchAll(
    /(?:from\s+|import\s*\(\s*|import\s+|require\(\s*)["'](\.[^"']*)["']/g,
  )) {
    const r = resolveImport(file, m[1]);
    if (r) out.add(r);
  }
  return out;
}

function reachable(start) {
  const seen = new Set();
  const stack = [start];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const n of importsOf(f)) stack.push(n);
  }
  return seen;
}

const problems = [];
const report = (rule, file, detail) =>
  problems.push(`${rule}  ${file.replace(APP + "\\", "").replace(APP + "/", "")}  →  ${detail}`);

// R1 (value imports only, type imports allowed, tests excluded)
for (const file of scanTargets.filter((f) => f.startsWith(LIB))) {
  const src = readFileSync(file, "utf8");
  if (src.includes("/* boundary-allow: R1 */")) continue;
  for (const imp of importsOf(file)) {
    if (imp.startsWith(COMP))
      report(
        "R1",
        file,
        "lib/ value-imports components/: " + imp.replace(APP + "\\", "").replace(APP + "/", ""),
      );
  }
}

// R2
const schema = join(LIB, "schema.ts");
for (const imp of [...importsOf(schema)].filter((i) => i.startsWith(APP))) {
  report(
    "R2",
    schema,
    "schema.ts imports project file: " + imp.replace(APP + "\\", "").replace(APP + "/", ""),
  );
}

// R3
for (const file of scanTargets.filter((f) => f.startsWith(LIB))) {
  if (NET_MODULES.has(file)) continue;
  for (const n of reachable(file)) {
    if (NET_MODULES.has(n))
      report(
        "R3",
        file,
        "reaches online-only module: " + n.replace(APP + "\\", "").replace(APP + "/", ""),
      );
  }
}

// R4 (compare only hostname-looking entries)
const hostnameRe = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
const privacySrc = readFileSync(join(LIB, "privacy.ts"), "utf8");
const cspSrc = readFileSync(join(ROOT, "next.config.ts"), "utf8");
const privacyDomains = new Set(
  [...privacySrc.matchAll(/domain:\s*"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((d) => hostnameRe.test(d)),
);
const cspDomains = new Set([...cspSrc.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map((m) => m[1]));
for (const d of privacyDomains)
  if (!cspDomains.has(d))
    report("R4", "privacy.ts", `domain "${d}" missing from next.config.ts CSP`);
for (const d of cspDomains)
  if (!privacyDomains.has(d))
    report("R4", "next.config.ts", `CSP domain "${d}" not listed in privacy.ts NETWORK_ACCESS`);

if (problems.length) {
  console.error("boundaries:check — violation(s):");
  for (const p of problems) console.error("  -", p);
  process.exit(1);
}
console.log(`boundaries:check — R1..R4 compliant ✓ (${scanTargets.length} files scanned)`);
