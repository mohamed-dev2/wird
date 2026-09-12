import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  HADITH_INDEX,
  hadithForTheme,
  parseVerseRef,
  resolveHadith,
  VERSE_INDEX,
  versesForTheme,
} from "../content";
import { VERSES } from "../data/verses";
import type { Theme } from "../companion";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const bundle = JSON.parse(
  readFileSync(join(ROOT, "public", "data", "quran-uthmani.min.json"), "utf8"),
) as { ayahs: [number, number, string][] };
const available = new Set(bundle.ayahs.map(([s, a]) => `${s}:${a}`));

const ALL_THEMES: Theme[] = [
  "return",
  "mercy",
  "hope",
  "patience",
  "consistency",
  "remembrance",
  "gratitude",
  "intention",
  "difficult",
  "new",
  "ramadan",
  "friday",
  "night",
  "morning",
  "evening",
];

describe("verified content index (authenticity-first)", () => {
  it("every indexed verse exists in the bundled Quran", () => {
    expect(VERSE_INDEX.length).toBeGreaterThan(10);
    for (const v of VERSE_INDEX) {
      expect(available.has(`${v.surah}:${v.ayah}`), `${v.surah}:${v.ayah}`).toBe(true);
      expect(v.themes.length).toBeGreaterThan(0);
    }
  });

  it("every legacy return-screen ref parses and exists in the bundle", () => {
    expect(VERSES.length).toBeGreaterThan(10);
    for (const v of VERSES) {
      const p = parseVerseRef(v.ref);
      expect(p, v.ref).not.toBeNull();
      expect(available.has(`${p?.surah}:${p?.ayah}`), v.ref).toBe(true);
    }
    expect(parseVerseRef("nonsense")).toBeNull();
    expect(parseVerseRef("")).toBeNull();
  });

  it("every theme has verse coverage (fallback = nothing, never invention)", () => {
    for (const t of ALL_THEMES) {
      expect(versesForTheme(t).length, t).toBeGreaterThan(0);
    }
  });

  it("every indexed hadith resolves with grade + reference", () => {
    for (const h of HADITH_INDEX) {
      const r = resolveHadith(h.book, h.id);
      expect(r, `${h.book}:${h.id}`).not.toBeNull();
      expect(r?.text.length).toBeGreaterThan(0);
      expect(r?.en.length).toBeGreaterThan(0);
      expect(r?.grade.length).toBeGreaterThan(0);
      expect(r?.ref.length).toBeGreaterThan(0);
      expect(r?.book.length).toBeGreaterThan(0);
    }
    expect(resolveHadith("bukhari", "nope")).toBeNull();
    expect(resolveHadith("nope", "b1")).toBeNull();
  });

  it("every theme has hadith coverage", () => {
    for (const t of ALL_THEMES) {
      expect(hadithForTheme(t).length, t).toBeGreaterThan(0);
    }
  });
});
