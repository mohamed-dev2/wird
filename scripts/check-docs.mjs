// Verifies DOCUMENTATION.md stays in sync with the code:
// 1. every `wird-*` storage key literal in app/ is named in §4
// 2. every route directory under app/ is named in §2
// 3. AR/EN dictionary key parity
// 4. every internal markdown link resolves to a real file/header
// 5. every file under docs/ is indexed in docs/README.md
// 6. placeholder/TODO text, `npm run X` commands that don't exist, and
//    stale Node-version mentions in released docs
// Run: npm run docs:check (also runs in CI)
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
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

// 4. internal markdown links resolve (no broken relative links)
const mdFiles = [];
for (const d of [
  join(ROOT, "docs"),
  join(ROOT, "README.md"),
  join(ROOT, "DOCUMENTATION.md"),
  join(ROOT, "CONTRIBUTING.md"),
  join(ROOT, "SECURITY.md"),
  join(ROOT, "CHANGELOG.md"),
  join(ROOT, "GOOD_FIRST_ISSUES.md"),
]) {
  if (statSync(d, { throwIfNoEntry: false })?.isDirectory()) {
    for (const f of walkMd(d)) mdFiles.push(f);
  } else if (statSync(d, { throwIfNoEntry: false })?.isFile()) {
    mdFiles.push(d);
  }
}
function walkMd(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e === "node_modules") continue;
      out.push(...walkMd(p));
    } else if (/\.md$/.test(e)) {
      out.push(p);
    }
  }
  return out;
}
const brokenLinks = [];
for (const f of mdFiles) {
  const base = dirname(f);
  for (const m of readFileSync(f, "utf8").matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = m[1].trim();
    if (/^(https?:|mailto:|#)/.test(target) || !target) continue;
    const [pathPart, anchor] = target.split("#");
    if (!pathPart) continue;
    let resolved = resolve(base, pathPart);
    if (!existsSync(resolved)) {
      brokenLinks.push(`${relative(ROOT, f)} → ${target}`);
      continue;
    }
    if (anchor) {
      const line = (readFileSync(resolved, "utf8").split("\n") || []).find((l) => {
        const s = l.replace(/^#{1,6}\s*/, "").trim();
        return s.toLowerCase().replace(/[^a-z0-9]+/g, "-") === anchor.toLowerCase();
      });
      if (!line) brokenLinks.push(`${relative(ROOT, f)} → ${target} (bad anchor #${anchor})`);
    }
  }
}
if (brokenLinks.length > 0) {
  console.error("docs:check — broken markdown links:");
  for (const b of brokenLinks) console.error("  -", b);
  failed = true;
} else {
  console.log(`docs:check — markdown links ✓ (${mdFiles.length} files)`);
}

// 5. docs inventory: every file under docs/ is indexed in docs/README.md
//    (features/README.md is the accepted index for docs/features/*)
const docFiles = walkMd(join(ROOT, "docs")).filter(
  (f) => relative(join(ROOT, "docs"), f) !== "README.md",
);
const docIndex = readFileSync(join(ROOT, "docs", "README.md"), "utf8");
const featureIndex = readFileSync(join(ROOT, "docs", "features", "README.md"), "utf8");
const missingIndexed = docFiles.filter((f) => {
  const rel = relative(join(ROOT, "docs"), f).split("\\").join("/");
  const base = basename(f);
  return (
    !docIndex.includes(rel) &&
    !featureIndex.includes(rel) &&
    !docIndex.includes(base) &&
    !featureIndex.includes(base)
  );
});
if (missingIndexed.length > 0) {
  console.error("docs:check — files under docs/ not indexed in docs/README.md:");
  for (const f of missingIndexed) console.error("  -", relative(join(ROOT, "docs"), f));
  failed = true;
} else {
  console.log(`docs:check — docs inventory ✓ (${docFiles.length} files)`);
}

// 6. doc quality: placeholders, missing npm scripts, stale Node version
const placeholderRe = /\b(?:TODO|FIXME|TBD|CHANGEME|XXX|lorem ipsum)\b/i;
const placeholderHits = [];
for (const f of mdFiles) {
  readFileSync(f, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (placeholderRe.test(line))
        placeholderHits.push(`${relative(ROOT, f)}:${i + 1} → ${line.trim().slice(0, 90)}`);
    });
}
if (placeholderHits.length > 0) {
  console.error("docs:check — placeholder/TODO text in docs:");
  for (const h of placeholderHits) console.error("  -", h);
  failed = true;
} else {
  console.log("docs:check — no placeholder/TODO text ✓");
}

const pkgScripts = new Set(
  Object.keys(JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts),
);
const badCommands = [];
for (const f of mdFiles) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/`npm run (\S+)`/g)) {
      if (!pkgScripts.has(m[1]))
        badCommands.push(`${relative(ROOT, f)}:${i + 1} → npm run ${m[1]}`);
    }
  });
}
if (badCommands.length > 0) {
  console.error("docs:check — docs reference npm scripts that do not exist:");
  for (const b of badCommands) console.error("  -", b);
  failed = true;
} else {
  console.log(`docs:check — npm run references valid ✓`);
}

const nvmNode = readFileSync(join(ROOT, ".nvmrc"), "utf8").trim();
const badNodeMentions = [];
for (const f of mdFiles) {
  readFileSync(f, "utf8")
    .split("\n")
    .forEach((line, i) => {
      for (const m of line.matchAll(/Node\s*(\d+(?:\.\d+)*)/g)) {
        const major = m[1].split(".")[0];
        if (major !== nvmNode) badNodeMentions.push(`${relative(ROOT, f)}:${i + 1} → Node ${m[1]}`);
      }
    });
}
if (badNodeMentions.length > 0) {
  console.error(`docs:check — docs mention a Node version that contradicts .nvmrc (${nvmNode}):`);
  for (const b of badNodeMentions) console.error("  -", b);
  failed = true;
} else {
  console.log(`docs:check — Node version consistent (${nvmNode}) ✓`);
}

if (failed) process.exit(1);
console.log("docs:check — all green ✓");
