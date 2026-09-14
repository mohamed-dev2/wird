// Privacy firewall (STEP 4 + STEP 6.32): recovery data must never leak
// into personalization, analytics, transfers, or any engine except the
// documented touch points. Static import + literal scan over app/ source
// (mirrors the boundary-checker philosophy, but for data flow).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const APP = join(__dirname, "..", "..", "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e) && !e.includes(".test.")) out.push(p);
  }
  return out;
}

const rel = (p: string): string => p.replace(/\\/g, "/").split("/app/")[1] ?? p;
const files = walk(join(APP, "app"));
const src = (f: string): string => readFileSync(f, "utf8");
// Value imports only: `import type` is erased at build (same rule as R1).
const valueSrc = (f: string): string => src(f).replace(/^[ \t]*import\s+type\s+[^;]+;/gm, "");

// Modules allowed to touch the recovery-plans module (UI surface +
// backup collectors + schema registry). Everything else must not import it.
const IMPORT_ALLOW = new Set([
  "private-plans/page.tsx",
  "components/views/private-plans.tsx",
  "components/views/private-plan-detail.tsx",
  "components/views/private-plan-tracker.tsx",
  "components/views/private-plan-timer.tsx",
  "components/views/private-plan-care.tsx",
  "components/views/account.tsx",
  "lib/crypto.ts",
  "lib/diagnostics.ts",
]);

// Modules allowed to touch the deen module (STEP 10, ADR-007): its own
// route views + the same collectors/registry as plans. The companion,
// analytics, coach, share, notify, and content engines must never see
// prayer history, deeds, reflections, or speech checks.
const DEEN_IMPORT_ALLOW = new Set([
  "deen/page.tsx",
  "components/views/deen-page.tsx",
  "components/views/deen-today.tsx",
  "components/views/deen-library.tsx",
  "components/views/account.tsx",
  "lib/crypto.ts",
  "lib/diagnostics.ts",
]);

// Files allowed to name the recovery datasets (registry, collectors,
// classifier, global flag). Tests are excluded from the scan by walk().
const KEY_ALLOW = new Set([
  "lib/private-plans.ts",
  "lib/schema.ts",
  "lib/crypto.ts",
  "lib/diagnostics.ts",
  "lib/privacy.ts",
  "lib/profiles.ts",
]);

// Files allowed to name the deen dataset (owner module, registry,
// collectors, classifier). Same exclusion rationale as plans.
const DEEN_KEY_ALLOW = new Set([
  "lib/deen.ts",
  "lib/schema.ts",
  "lib/crypto.ts",
  "lib/diagnostics.ts",
  "lib/privacy.ts",
]);

// Engines that must be provably free of recovery coupling (checked by
// content, not just imports — no string references either).
const CLEAN_ENGINES = [
  "lib/companion.ts",
  "lib/analytics.ts",
  "lib/coach.ts",
  "lib/content.ts",
  "lib/history.ts",
  "lib/vault.ts",
  "lib/transfer.ts",
  "lib/lan.ts",
  "lib/notify.ts",
  "lib/share.ts",
  "lib/quran.ts",
  "lib/tafsir.ts",
  "lib/audio.ts",
  "lib/hadith-full.ts",
  "lib/demo.ts",
  "lib/clipboard.ts",
  "lib/daymode.ts",
  "lib/prayer.ts",
  "lib/i18n.ts",
  "lib/use-stored-state.ts",
  "lib/strings.ts",
];

describe("recovery data firewall", () => {
  it("only documented modules import private-plans", () => {
    const bad: string[] = [];
    for (const f of files) {
      const r = rel(f);
      if (IMPORT_ALLOW.has(r)) continue;
      if (/(?:from|import\()\s*["'][^"']*private-plans["']/.test(valueSrc(f))) bad.push(r);
    }
    expect(bad).toEqual([]);
  });
  it("only documented files name the recovery datasets", () => {
    const bad: string[] = [];
    for (const f of files) {
      const r = rel(f);
      if (KEY_ALLOW.has(r)) continue;
      const s = src(f);
      if (s.includes("wird-recovery-plans-v1") || s.includes("wird-private-plans-excluded-v1"))
        bad.push(r);
    }
    expect(bad).toEqual([]);
  });
  it("engines carry zero recovery references", () => {
    for (const mod of CLEAN_ENGINES) {
      const f = files.find((x) => rel(x) === mod);
      expect(f, `${mod} exists`).toBeDefined();
      const s = src(f as string).toLowerCase();
      expect(s, `${mod} mentions private plans`).not.toContain("private-plan");
      expect(s, `${mod} mentions recovery plans`).not.toContain("recovery-plans");
    }
  });
});

describe("deen data firewall", () => {
  it("only documented modules import the deen state module", () => {
    const bad: string[] = [];
    for (const f of files) {
      const r = rel(f);
      if (DEEN_IMPORT_ALLOW.has(r)) continue;
      if (/(?:from|import\()\s*["'][^"']*\/deen["']/.test(valueSrc(f))) bad.push(r);
    }
    expect(bad).toEqual([]);
  });
  it("engines import neither deen state nor the deen catalog", () => {
    // The catalog is content, but engines have no business with it:
    // no deen-driven guidance, scores, or suggestions may exist.
    // (lib/deen.ts itself owns the catalog import — it is not an engine.)
    for (const mod of CLEAN_ENGINES) {
      const f = files.find((x) => rel(x) === mod);
      expect(f, `${mod} exists`).toBeDefined();
      const v = valueSrc(f as string);
      expect(v, `${mod} imports deen`).not.toMatch(/["']\.\/deen["']/);
      expect(v, `${mod} imports deen-catalog`).not.toMatch(/deen-catalog/);
    }
  });
  it("only documented files name the deen dataset", () => {
    const bad: string[] = [];
    for (const f of files) {
      const r = rel(f);
      if (DEEN_KEY_ALLOW.has(r)) continue;
      if (src(f).includes("wird-deen-v1")) bad.push(r);
    }
    expect(bad).toEqual([]);
  });
  it("engines carry zero deen references", () => {
    for (const mod of CLEAN_ENGINES) {
      const f = files.find((x) => rel(x) === mod);
      expect(f, `${mod} exists`).toBeDefined();
      const s = src(f as string).toLowerCase();
      expect(s, `${mod} mentions deen`).not.toContain("wird-deen");
      expect(s, `${mod} mentions deen module`).not.toContain('from "./deen"');
    }
  });
});
