// Generates a Software Bill of Materials (SBOM) from the installed
// dependency tree.
//
// Output: sbom.wird.json (repo root) — consumed at release time and
// attached to GitHub Releases. JSON shape (CycloneDX-lite, version
// 1.4 "specVersion" field omitted to stay minimal):
//   { bomFormat, specVersion, version, name, metadata, components, dependencies }
//
// This script reads from the INSTALLED node_modules (source of truth for
// what actually ships), so it never drifts from the lockfile.
//
// Run: npm run sbom
import { readFileSync, writeFileSync } from "node:fs";
import { cwd } from "node:process";
import { createRequire } from "node:module";

const require = createRequire(cwd() + "/");
const pkg = JSON.parse(readFileSync(cwd() + "/package.json", "utf8"));

function loadPkg(name) {
  try {
    const p = require.resolve(name + "/package.json", { paths: [cwd()] });
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

const components = [];
const deps = {};
const seen = new Set();
const stack = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];

while (stack.length > 0) {
  const name = stack.pop();
  if (seen.has(name)) continue;
  seen.add(name);
  const meta = loadPkg(name);
  if (!meta) continue;
  const purl = `pkg:npm/${name}@${meta.version}`;
  components.push({
    type: "library",
    name,
    version: meta.version,
    purl,
    licenses: meta.license ? [{ expression: String(meta.license) }] : [],
    scope: (pkg.dependencies ?? {})[name] ? "required" : "optional",
  });
  deps[name] = [...Object.keys(meta.dependencies ?? {})];
  for (const sub of Object.keys(meta.dependencies ?? {})) stack.push(sub);
}

const sbom = {
  bomFormat: "CycloneDX",
  specVersion: "1.4",
  version: 1,
  name: pkg.name,
  metadata: {
    timestamp: new Date().toISOString(),
    component: {
      name: pkg.name,
      version: pkg.version,
      type: "application",
    },
  },
  components,
  dependencies: [
    { ref: pkg.name, dependsOn: Object.keys(deps) },
    ...Object.entries(deps).map(([name, sub]) => ({
      ref: name,
      dependsOn: sub,
    })),
  ],
};

writeFileSync(cwd() + "/sbom.wird.json", JSON.stringify(sbom, null, 2));
console.log(
  `sbom — wrote sbom.wird.json (${components.length} components, ${sbom.dependencies.length} roots with dependency edges)`,
);
