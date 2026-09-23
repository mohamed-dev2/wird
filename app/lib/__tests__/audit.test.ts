// Master-audit static checks (STEP 9): routes, links, sitemap, SW shell,
// secrets. Filesystem truth, zero network — the machine-readable half of
// MASTER_AUDIT.md (the other half is the e2e journeys).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..");
const APP = join(ROOT, "app");
const read = (p: string): string => readFileSync(join(ROOT, p), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e) && !e.includes(".test.")) out.push(p);
  }
  return out;
}

function appRoutes(): string[] {
  const routes = new Set<string>(["/"]);
  for (const f of walk(APP)) {
    const rel = f.replace(/\\/g, "/");
    const m = rel.match(/\/app\/(.+)\/page\.tsx$/);
    if (m && m[1]) routes.add(`/${m[1]}`);
  }
  return [...routes];
}

describe("route inventory (audit 4-5)", () => {
  it("every route directory renders a page; calm 404 exists", () => {
    const routes = appRoutes();
    expect(routes.length).toBeGreaterThanOrEqual(9);
    for (const r of [
      "/",
      "/account",
      "/calendar",
      "/deen",
      "/insights",
      "/library",
      "/recovery",
      "/private-plans",
      "/terms",
      "/privacy",
    ]) {
      expect(routes, r).toContain(r);
    }
    expect(existsSync(join(APP, "not-found.tsx"))).toBe(true);
  });
  it("every static internal link + push target resolves to a route", () => {
    const routes = new Set(appRoutes());
    const src = walk(APP)
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    const hrefs = [...src.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]);
    const pushes = [...src.matchAll(/(?:router\.push|open)\(\s*"(\/[^"]*)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of new Set([...hrefs, ...pushes])) {
      expect(routes.has(h as string), `link → ${h}`).toBe(true);
    }
  });
  it("sitemap + SW shell cover exactly the public routes", () => {
    const sitemap = read("app/sitemap.ts");
    for (const r of [
      "/calendar",
      "/insights",
      "/deen",
      "/library",
      "/account",
      "/terms",
      "/privacy",
    ]) {
      expect(sitemap, `sitemap ← ${r}`).toContain(`"${r}"`);
    }
    const sw = read("public/sw.js");
    for (const r of [
      "/",
      "/calendar",
      "/insights",
      "/deen",
      "/library",
      "/account",
      "/recovery",
      "/private-plans",
      "/terms",
      "/privacy",
    ]) {
      expect(sw, `sw CORE ← ${r}`).toContain(`"${r}"`);
    }
  });
});

describe("secret scan (audit 43 + 78)", () => {
  it("no keys, tokens, or private-key material in app source", () => {
    const src = walk(APP)
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    const patterns = [
      /sk-[A-Za-z0-9]{10,}/,
      /AKIA[0-9A-Z]{16}/,
      /ghp_[A-Za-z0-9]{10,}/,
      /xox[bap]-[A-Za-z0-9-]+/,
      /BEGIN (?:RSA )?PRIVATE KEY/,
      /api[_-]?key\s*[:=]\s*["'][^"']{8,}["']/i,
    ];
    for (const re of patterns) expect(src).not.toMatch(re);
  });
});
