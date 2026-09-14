// Master audit manifest generator (STEP 9): derives the machine-readable
// audit inventory from the repo itself — routes from app/, features from
// docs/features/, integrations from docs/NETWORK.md, tests by counting.
// Re-run on structural change: npm run audit:manifest. Human judgment
// (statuses, severities) lives in MASTER_AUDIT.md, never here.
import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT = join(ROOT, "audit");
mkdirSync(AUDIT, { recursive: true });

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(e)) continue;
      walk(p, out);
    } else out.push(p);
  }
  return out;
}

const commit = (() => {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
})();

// routes.json — every page.tsx becomes a route entry
const routes = walk(join(ROOT, "app"))
  .filter((f) => /(^|\/)page\.tsx$/.test(f.replace(/\\/g, "/")))
  .map((f) => {
    const rel = relative(join(ROOT, "app"), dirname(f)).replace(/\\/g, "/");
    return { route: rel === "." ? "/" : `/${rel}`, file: relative(ROOT, f).replace(/\\/g, "/") };
  })
  .sort((a, b) => a.route.localeCompare(b.route));

// features.json — every feature doc + its key modules (first code fence refs)
const featureDocs = walk(join(ROOT, "docs", "features")).filter((f) => f.endsWith(".md"));
const features = featureDocs
  .map((f) => {
    const s = readFileSync(f, "utf8");
    const title = (s.match(/^# (.+)$/m) ?? [])[1] ?? "";
    const modules = [...s.matchAll(/`(app\/[^`]+?\.(?:ts|tsx))`/g)].map((m) => m[1]);
    return {
      doc: relative(ROOT, f).replace(/\\/g, "/"),
      title,
      modules: [...new Set(modules)].slice(0, 8),
    };
  })
  .sort((a, b) => a.doc.localeCompare(b.doc));

// permissions.json — local protection mechanisms (no backend, no roles;
// gates live on-device). Derived from schema keys + privacy classifier.
const schema = readFileSync(join(ROOT, "app", "lib", "schema.ts"), "utf8");
const schemaKeys = [...schema.matchAll(/^\s*"(wird-[a-z0-9*-]+)":\s*S\(/gm)].map((m) => m[1]);
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const permissions = {
  model:
    "local-only: no accounts, roles, or server sessions; protection is device gates + per-profile namespacing",
  gates: [
    {
      gate: "profile PIN + lockout",
      code: ["app/lib/profiles.ts", "app/components/login-gate.tsx"],
    },
    { gate: "duress PIN decoy", code: ["app/lib/profiles.ts"] },
    { gate: "reflection vault passphrase", code: ["app/lib/vault.ts"] },
    { gate: "notification permission (OS)", code: ["app/lib/notify.ts"] },
    {
      gate: "PIN re-verify for destructive backup actions",
      code: ["app/components/views/account.tsx"],
    },
    { gate: "travel-mode hidden profiles", code: ["app/lib/profiles.ts"] },
    { gate: "discreet plan names + quick exit", code: ["app/components/views/private-plans.tsx"] },
    { gate: "safe mode flag", code: ["app/lib/safe-mode.ts"] },
    { gate: "personalization toggles", code: ["app/lib/personalize.ts"] },
  ],
  storageKeys: schemaKeys.length,
};

// integrations.json — external touchpoints parsed from the network matrix
const network = readFileSync(join(ROOT, "docs", "NETWORK.md"), "utf8");
const integrations = [...network.matchAll(/`https:\/\/([a-z0-9.-]+)[^`]*`/g)].map((m) => m[1]);
const integrationsDedup = [...new Set(integrations)].sort();

// test-matrix.json — suites counted, not claimed
function countIts(files, re) {
  let n = 0;
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    n += [...s.matchAll(re)].length;
  }
  return n;
}
const unitFiles = walk(join(ROOT, "app")).filter((f) => /\.test\.ts$/.test(f));
const e2eFiles = walk(join(ROOT, "e2e")).filter((f) => /\.spec\.ts$/.test(f));
const testMatrix = {
  unit: {
    files: unitFiles.map((f) => relative(ROOT, f).replace(/\\/g, "/")).sort(),
    tests: countIts(unitFiles, /^\s*(?:it|test)\(/gm),
  },
  e2e: {
    files: e2eFiles.map((f) => relative(ROOT, f).replace(/\\/g, "/")).sort(),
    tests: countIts(e2eFiles, /^\s*test\(/gm),
  },
  gates: [
    "typecheck",
    "lint",
    "format:check",
    "docs:check",
    "comments:check",
    "css:check",
    "boundaries:check",
    "audit",
  ],
};

const manifest = {
  generated: new Date().toISOString(),
  commit,
  version: pkg.version,
  node: "22",
  counts: {
    routes: routes.length,
    featureDocs: features.length,
    storageKeys: schemaKeys.length,
    unitTests: testMatrix.unit.tests,
    e2eTests: testMatrix.e2e.tests,
    integrations: integrationsDedup.length,
  },
};

const write = (name, data) => {
  writeFileSync(join(AUDIT, name), JSON.stringify(data, null, 2) + "\n");
  console.log(
    `audit/${name} — ${Array.isArray(data) ? data.length : Object.keys(data).length} entries`,
  );
};
write("audit-manifest.json", manifest);
write("routes.json", routes);
write("features.json", features);
write("permissions.json", permissions);
write("integrations.json", integrationsDedup);
write("test-matrix.json", testMatrix);
