// SEO regression guard (STEP 11): static filesystem truth for titles,
// descriptions, canonicals, robots, sitemap, verification file,
// manifest, JSON-LD honesty, and banned SEO claims. Behavior (status
// codes, head tags, XML validity) is covered by e2e/seo.spec.ts.
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

// First `title: "..."` inside a metadata export (page title, not OG copy).
function metaTitle(src: string): string | null {
  const m = src.match(/export const metadata[^=]*=\s*\{[^}]*?\btitle:\s*"([^"]+)"/s);
  if (m) return m[1] as string;
  const l = src.match(/^  title:\s*"([^"]+)",?$/m);
  return l ? (l[1] as string) : null;
}

describe("titles, descriptions, canonicals", () => {
  it("every public route has a unique title", () => {
    const seen = new Map<string, string>();
    const files = walk(APP).filter((f) => /(page|layout)\.tsx$/.test(f.replace(/\\/g, "/")));
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      if (!src.includes("export const metadata")) continue;
      const t = metaTitle(src);
      if (!t) continue;
      const rel = f.replace(/\\/g, "/").split("/app/")[1] ?? f;
      expect(seen.has(t), `duplicate title "${t}" in ${rel} (first: ${seen.get(t)})`).toBe(false);
      seen.set(t, rel);
    }
    for (const r of [
      "calendar",
      "insights",
      "review",
      "library",
      "account",
      "terms",
      "privacy",
      "deen",
    ]) {
      expect(
        [...seen.values()].some((v) => v.startsWith(`${r}/`)),
        `route ${r} titled`,
      ).toBe(true);
    }
  });
  it("listed routes describe themselves; unlisted routes stay title-only", () => {
    const srcOf = (r: string): string => {
      try {
        return read(`app/${r}/layout.tsx`);
      } catch {
        return read(`app/${r}/page.tsx`);
      }
    };
    for (const r of [
      "calendar",
      "insights",
      "review",
      "library",
      "account",
      "terms",
      "privacy",
      "deen",
    ]) {
      expect(srcOf(r), `${r} description`).toMatch(/description:\s*"/);
    }
    // Recovery is fully discreet: no metadata export at all, so the
    // shared default title applies and crawlers learn nothing specific.
    expect(read("app/recovery/page.tsx"), "recovery stays metadata-free").not.toContain(
      "export const metadata",
    );
    const src = read("app/private-plans/page.tsx");
    expect(src, "private-plans has a title").toMatch(/title:\s*"/);
    expect(src, "private-plans stays description-free").not.toMatch(/description:\s*"/);
  });
  it("canonicals are same-route relative paths (absolute via metadataBase)", () => {
    const files = walk(APP).filter((f) => /(page|layout)\.tsx$/.test(f.replace(/\\/g, "/")));
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      const m = src.match(/canonical:\s*"([^"]+)"/);
      if (!m) continue;
      const rel = f.replace(/\\/g, "/").split("/app/")[1] ?? f;
      const route = rel.replace(/\/(page|layout)\.tsx$/, "");
      expect(m[1], `${rel} canonical`).toBe(`/${route}`);
    }
    expect(read("app/layout.tsx")).toContain("metadataBase");
  });
});

describe("long-tail content, internal links, duplicate content", () => {
  it("home carries a visible FAQ block with matching FAQPage JSON-LD", () => {
    const src = read("app/page.tsx");
    expect(src, "visible faq section").toContain('className="seo-faq"');
    expect(src, "JsonLD FAQ type").toContain('"@type": "FAQPage"');
    expect(src, "JsonLD answer shape").toContain("acceptedAnswer");
    // Same strings render both the on-page <details> list and the schema,
    // so the two can never drift apart.
    expect(
      src.match(/\["q\d", "a\d"\]/g) ?? [],
      "faq pairs in visible block + schema",
    ).toHaveLength(10);
    expect(src).toContain("seo.faq.${q}");
    expect(src).toContain("seo.faq.${a}");
    const strings = read("app/lib/strings.ts");
    expect(strings.match(/seo\.faq\.q[1-5]/g) ?? [], "ar+en q keys").toHaveLength(10);
    expect(strings.match(/seo\.faq\.a[1-5]/g) ?? [], "ar+en a keys").toHaveLength(10);
  });
  it("home links descriptively to every core route", () => {
    const src = read("app/page.tsx");
    for (const route of ["/library", "/deen", "/review", "/insights"]) {
      expect(src, `internal link ${route}`).toContain(`Link href="${route}"`);
    }
    expect(src, "descriptive anchor text (nav.* labels)").toContain('t("nav.library")');
    expect(src).not.toContain('href="/library">click here');
  });
  it("listed routes never share a description (no cannibalized queries)", () => {
    const srcOf = (r: string): string => {
      try {
        return read(`app/${r}/layout.tsx`);
      } catch {
        return read(`app/${r}/page.tsx`);
      }
    };
    const seen = new Map<string, string>();
    for (const r of [
      "calendar",
      "insights",
      "review",
      "library",
      "account",
      "terms",
      "privacy",
      "deen",
    ]) {
      const d = srcOf(r).match(/description:\s*"([^"]+)"/);
      if (!d) continue;
      expect(
        seen.has(d[1] ?? ""),
        `duplicate description on ${r} (first: ${seen.get(d[1] ?? "")})`,
      ).toBe(false);
      seen.set(d[1] ?? "", r);
    }
  });
});

describe("robots, sitemap, verification file", () => {
  it("robots allows crawling and references the sitemap", () => {
    const src = read("app/robots.ts");
    expect(src).toContain("allow");
    expect(src).toContain("sitemap");
    // Built via template literal in source; the resolved URL is asserted
    // against the live /robots.txt response in e2e/seo.spec.ts.
    expect(src).toContain("wird-gamma.vercel.app");
    expect(src).toContain("/sitemap.xml");
    expect(src).not.toMatch(/disallow:\s*["']\/["']/i);
  });
  it("sitemap lists valid production URLs only", () => {
    const src = read("app/sitemap.ts");
    const routes = [...src.matchAll(/"(\/[^"]*)"/g)].map((m) => m[1]);
    expect(new Set(routes).size, "no duplicate sitemap urls").toBe(routes.length);
    for (const r of routes as string[]) {
      expect(r, `sitemap entry ${r}`).toMatch(/^\/[a-z-]*$/);
    }
    expect(src).not.toContain("google");
    expect(src).not.toContain("not-found");
    expect(src).toContain("https://wird-gamma.vercel.app");
  });
  it("google verification file is present and byte-exact", () => {
    const p = join(ROOT, "public", "google373507699530d312.html");
    expect(existsSync(p)).toBe(true);
    expect(readFileSync(p, "utf8").trim()).toBe(
      "google-site-verification: google373507699530d312.html",
    );
  });
});

describe("identity, manifest, honesty", () => {
  it("site identity is WebSite-only with valid markers", () => {
    const src = read("app/layout.tsx");
    expect(src).toContain('"@type": "WebSite"');
    expect(src).toContain("application/ld+json");
    expect(src).toContain('lang="ar"');
    expect(src).toContain('dir="rtl"');
    expect(src).toContain("/opengraph-image");
    expect(existsSync(join(APP, "opengraph-image.tsx"))).toBe(true);
  });
  it("manifest is valid with identity fields and icons exist", () => {
    const m = JSON.parse(read("public/manifest.webmanifest")) as Record<string, unknown>;
    for (const k of ["name", "short_name", "start_url", "display", "icons", "theme_color"]) {
      expect(m, `manifest.${k}`).toHaveProperty(k);
    }
    expect(existsSync(join(ROOT, "public", "icon.svg"))).toBe(true);
    // Raster icons for Apple touch + Android installability (pixels
    // derive 1:1 from icon.svg via scripts/make-icons.mjs). Apple touch
    // icons live outside the manifest (referenced from metadata).
    for (const [file, size] of [
      ["apple-touch-icon.png", null],
      ["icon-192.png", "192x192"],
      ["icon-512.png", "512x512"],
    ] as Array<[string, string | null]>) {
      expect(existsSync(join(ROOT, "public", file)), file).toBe(true);
      if (size) expect(JSON.stringify(m.icons), `manifest lists ${size}`).toContain(size);
    }
    expect(read("app/layout.tsx")).toContain('apple: "/apple-touch-icon.png"');
  });
  it("no fake rich results, no rulings-as-SEO, no noindex accidents", () => {
    const src = walk(APP)
      .map((f) => readFileSync(f, "utf8"))
      .join("\n")
      .toLowerCase();
    for (const banned of [
      "ratingvalue",
      "reviewcount",
      "aggregaterating",
      "official islamic ruling",
      "guaranteed correct fatwa",
      "scholar-approved",
      "best website",
      "noindex",
    ]) {
      expect(src, `banned: ${banned}`).not.toContain(banned);
    }
  });
});
