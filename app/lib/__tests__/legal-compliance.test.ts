// Policy↔code consistency (STEP 8.69): legal promises tested as code.
// Anything here failing means docs and implementation disagree — fix the
// side that is wrong, never silence the test. Mirrors the boundary-checker
// philosophy with plain filesystem reads.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..");
const APP = join(ROOT, "app");
const read = (p: string): string => readFileSync(join(ROOT, p), "utf8");

function walkTs(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walkTs(p, out);
    else if (/\.tsx?$/.test(e) && !e.includes(".test.")) out.push(p);
  }
  return out;
}

describe("license identity", () => {
  it("Apache-2.0 complete text, wird-gamma holder, no MIT project claims", () => {
    const lic = read("LICENSE");
    expect(lic).toContain("Apache License");
    expect(lic).toContain("Version 2.0, January 2004");
    expect(lic).toContain("END OF TERMS AND CONDITIONS");
    expect(lic).toContain("APPENDIX");
    expect(lic).not.toMatch(/^MIT License/m);
    expect(JSON.parse(read("package.json")).license).toBe("Apache-2.0");
    expect(read("README.md")).toContain("Apache_2.0");
    expect(read("README.md")).not.toContain("License-MIT");
    expect(read("NOTICE")).toContain("wird-gamma");
    expect(read("NOTICE")).toContain("Apache License, Version 2.0");
  });
  it("no false Apache Foundation affiliation anywhere", () => {
    const banned = [
      /apache foundation wird/i,
      /apache wird/i,
      /official apache/i,
      /apache-sponsored/i,
    ];
    const files = [
      ...walkTs(APP),
      ...[
        "README.md",
        "CONTRIBUTING.md",
        "GOVERNANCE.md",
        "NOTICE",
        "TERMS_OF_USE.md",
        "PRIVACY_POLICY.md",
      ].map((f) => join(ROOT, f)),
    ];
    for (const f of files) {
      const s = readFileSync(f, "utf8");
      for (const re of banned) {
        if (re.test(s)) throw new Error(`affiliation claim in ${f}`);
      }
    }
  });
  it("SPDX identifiers on new legal route files", () => {
    for (const f of ["app/terms/page.tsx", "app/privacy/page.tsx"]) {
      expect(read(f)).toContain("SPDX-License-Identifier: Apache-2.0");
    }
  });
});

describe("third-party audit matches the tree", () => {
  it("every runtime dep is listed with its exact pinned version", () => {
    const pkg = JSON.parse(read("package.json")) as { dependencies: Record<string, string> };
    const notices = read("THIRD_PARTY_NOTICES.md");
    for (const [name, version] of Object.entries(pkg.dependencies)) {
      expect(notices, name).toContain(name);
      expect(notices, `${name}@${version}`).toContain(version);
    }
  });
});

describe("no analytics, no cookies, no age collection", () => {
  const sources = walkTs(APP)
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
  it("no analytics/tracking SDK hosts or clients", () => {
    const banned = [
      "googletagmanager",
      "google-analytics",
      "analytics.js",
      "mixpanel",
      "segment.",
      "amplitude",
      "facebook.net",
      "hotjar",
      "fullstory",
      "posthog",
      "intercom",
      "bugsnag",
      "crashlytics",
      "appsflyer",
      "onesignal",
      "sentry",
    ];
    for (const b of banned) expect(sources.toLowerCase().includes(b), b).toBe(false);
  });
  it("no document.cookie reads or writes", () => {
    expect(sources.includes("document.cookie")).toBe(false);
  });
  it("schema collects no age/identity fields", () => {
    const schema = read("app/lib/schema.ts");
    for (const k of [
      "age",
      "birth",
      "dob",
      "school",
      "phone",
      "address",
      "contact-list",
      "ad-id",
    ]) {
      expect(schema.toLowerCase().includes(`"${k}`)).toBe(false);
    }
  });
  it("no non-local http endpoints except documented loopback/namespaces", () => {
    const urls = [...sources.matchAll(/https?:\/\/[a-z0-9.-]+/gi)].map((m) => m[0].toLowerCase());
    const allowed = [
      "https://cdn.jsdelivr.net",
      "https://api.quran.com",
      "https://everyayah.com",
      "http://localhost",
      "http://127.0.0.1",
      "https://w3.org",
      "http://www.w3.org",
      "https://schema.org",
      "http://www.apache.org",
      "https://www.apache.org",
      "https://github.com",
      "https://wird-gamma.vercel.app",
    ];
    for (const u of new Set(urls)) {
      expect(
        allowed.some((a) => u.startsWith(a)),
        u,
      ).toBe(true);
    }
  });
});

describe("legal routes and records exist", () => {
  it("/terms + /privacy routes, sitemap, SW precache, version parity", () => {
    expect(existsSync(join(APP, "terms", "page.tsx"))).toBe(true);
    expect(existsSync(join(APP, "privacy", "page.tsx"))).toBe(true);
    const sitemap = read("app/sitemap.ts");
    expect(sitemap).toContain('"/terms"');
    expect(sitemap).toContain('"/privacy"');
    const sw = read("public/sw.js");
    expect(sw).toContain('"/terms"');
    expect(sw).toContain('"/privacy"');
    const cases = [
      {
        md: "TERMS_OF_USE.md",
        from: "TERMS_SECTIONS",
        to: "PRIVACY_VERSION",
        ver: "TERMS_VERSION",
      },
      { md: "PRIVACY_POLICY.md", from: "PRIVACY_SECTIONS", to: null, ver: "PRIVACY_VERSION" },
    ] as const;
    for (const c of cases) {
      const doc = read(c.md);
      const src = read("app/lib/legal.ts");
      const v = (src.match(new RegExp(`${c.ver} = "([^"]+)"`)) ?? [])[1] ?? "";
      expect(v.length).toBeGreaterThan(0);
      expect(doc.includes(v), `${c.md} version`).toBe(true);
      // Section-count parity per document: every route section has EN+AR
      // headings in the record (the intro blockquote carries no heading by
      // design, hence -1). Byte-exact heading comparison is avoided
      // deliberately: Arabic glyphs must never be hand-retyped here.
      const region = src.slice(src.indexOf(c.from), c.to ? src.indexOf(c.to) : undefined);
      const sections = [...region.matchAll(/h: \{ ar: "([^"]+)", en: "([^"]+)" \}/g)];
      expect(sections.length).toBeGreaterThan(5);
      const mdHeads = doc.split("\n").filter((l) => l.startsWith("## ")).length;
      expect(mdHeads, `${c.md} section count`).toBe((sections.length - 1) * 2);
    }
    // Spot-checks on ASCII-safe content (typo-proof on both sides).
    expect(read("TERMS_OF_USE.md")).toContain("Accounts, suspension, deletion");
    expect(read("TERMS_OF_USE.md")).toContain("Your content stays yours");
    expect(read("PRIVACY_POLICY.md")).toContain("no server");
    expect(read("PRIVACY_POLICY.md")).toContain("DATA_INVENTORY.md");
  });
  it("inventory covers every schema dataset (policy source of truth)", () => {
    const schema = read("app/lib/schema.ts");
    const inv = read("DATA_INVENTORY.md");
    const keys = [...schema.matchAll(/^\s*"(wird-[a-z0-9*-]+)":\s*S\(/gm)].flatMap((m) =>
      m[1] ? [m[1]] : [],
    );
    expect(keys.length).toBeGreaterThan(40);
    for (const k of new Set(keys.map((x) => x.replace("*", "")))) {
      expect(inv.includes(k), `inventory ← ${k}`).toBe(true);
    }
  });
});
