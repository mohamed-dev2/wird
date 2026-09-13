// Catalog locks (STEP 5 follow-up): the tafsir + full-book catalogs are
// user-visible contracts — every slug must exist upstream, every book must
// carry both languages, and the curated→full links must have no gaps.
// Deliberate catalog changes update these lists (verified slugs live in
// docs/features/quran.md + docs/features/hadith.md).
import { describe, expect, it } from "vitest";
import { TAFSIRS } from "../tafsir";
import { FULL_BOOKS } from "../hadith-full";

describe("tafsir catalog", () => {
  it("lists exactly the verified api.quran.com slugs", () => {
    expect(TAFSIRS.map((s) => s.id)).toEqual([
      "ar-tafsir-muyassar",
      "ar-tafseer-al-saddi",
      "ar-tafsir-ibn-kathir",
      "ar-tafsir-al-tabari",
      "ar-tafseer-al-qurtubi",
      "ar-tafsir-al-baghawi",
      "ar-tafsir-al-wasit",
      "jalalayn",
      "en-tafisr-ibn-kathir",
      "en-tafsir-maarif-ul-quran",
      "tazkirul-quran-en",
    ]);
  });
  it("only the bundled source claims offline, all carry both names", () => {
    expect(TAFSIRS.filter((s) => s.offline).map((s) => s.id)).toEqual(["jalalayn"]);
    for (const s of TAFSIRS) {
      expect(s.ar.length, `${s.id} ar`).toBeGreaterThan(0);
      expect(s.en.length, `${s.id} en`).toBeGreaterThan(0);
    }
  });
});

describe("full-book catalog", () => {
  it("lists exactly the 12 browsable books", () => {
    expect(FULL_BOOKS.map((b) => b.id)).toEqual([
      "bukhari",
      "muslim",
      "abudawud",
      "tirmidhi",
      "nasai",
      "ibnmajah",
      "malik",
      "nawawi",
      "qudsi",
      "dehlawi",
      "ahmed",
      "darimi",
    ]);
  });
  it("every book carries both languages", () => {
    for (const b of FULL_BOOKS) {
      expect(b.ar.length, `${b.id} ar`).toBeGreaterThan(0);
      expect(b.en.length, `${b.id} en`).toBeGreaterThan(0);
    }
  });
});
