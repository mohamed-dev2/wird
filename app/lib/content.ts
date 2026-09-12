// Verified-content matching (§2.7–2.10): Quran refs + Hadith ids only.
// NO religious text lives here — Arabic/translation resolve at runtime from
// the bundled datasets (public/data) and curated library (lib/data/hadith).
// Anything unresolvable renders NOTHING (authenticity-first fallback).

import { HADITH_BOOKS, NAWAWI, type HadithEntry } from "./data/hadith";
import { SURAH_NAMES } from "./data/surahs";
import { loadEnglish, loadQuran } from "./quran";
import type { Theme } from "./companion";

export type VerseRef = { surah: number; ayah: number; themes: Theme[] };

export const VERSE_INDEX: VerseRef[] = [
  { surah: 39, ayah: 53, themes: ["return", "mercy", "hope", "new"] },
  { surah: 42, ayah: 25, themes: ["return", "mercy", "hope"] },
  { surah: 4, ayah: 110, themes: ["return", "mercy"] },
  { surah: 25, ayah: 70, themes: ["return", "mercy", "new"] },
  { surah: 9, ayah: 104, themes: ["return", "mercy"] },
  { surah: 94, ayah: 5, themes: ["hope", "patience", "difficult", "new"] },
  { surah: 94, ayah: 6, themes: ["hope", "patience", "difficult"] },
  { surah: 93, ayah: 5, themes: ["hope", "new"] },
  { surah: 2, ayah: 152, themes: ["remembrance", "consistency", "gratitude"] },
  { surah: 13, ayah: 28, themes: ["remembrance", "consistency", "difficult"] },
  { surah: 14, ayah: 7, themes: ["gratitude"] },
  { surah: 99, ayah: 7, themes: ["intention", "consistency"] },
  { surah: 2, ayah: 286, themes: ["patience", "difficult", "intention"] },
  { surah: 3, ayah: 200, themes: ["patience", "consistency"] },
  { surah: 2, ayah: 185, themes: ["ramadan"] },
  { surah: 62, ayah: 9, themes: ["friday"] },
  { surah: 73, ayah: 6, themes: ["night"] },
  { surah: 17, ayah: 79, themes: ["night"] },
  { surah: 30, ayah: 17, themes: ["morning", "evening"] },
];

export function versesForTheme(theme: Theme): VerseRef[] {
  return VERSE_INDEX.filter((v) => v.themes.includes(theme));
}

export type ResolvedVerse = {
  surah: number;
  ayah: number;
  ar: string;
  en: string | null;
};

/** Resolve a ref against the bundled Quran; null when absent (show nothing). */
export async function resolveVerse(surah: number, ayah: number): Promise<ResolvedVerse | null> {
  try {
    const [list, en] = await Promise.all([
      loadQuran().catch(() => null),
      loadEnglish().catch(() => null),
    ]);
    if (!list) return null;
    const hit = list.find((a) => a.surah === surah && a.ayah === ayah);
    if (!hit) return null;
    return { surah, ayah, ar: hit.text, en: en?.get(`${surah}:${ayah}`) ?? null };
  } catch {
    return null;
  }
}

export function surahNameAr(surah: number): string {
  return SURAH_NAMES[surah - 1] ?? "";
}

// ---------- hadith (synchronous: curated in-memory dataset) ----------

export type HadithRef = { book: string; id: string; themes: Theme[] };

export const HADITH_INDEX: HadithRef[] = [
  { book: "bukhari", id: "b1", themes: ["intention", "new"] },
  { book: "nawawi", id: "naw1", themes: ["intention"] },
  { book: "musnad", id: "h1", themes: ["consistency", "patience", "new"] },
  { book: "nawawi", id: "naw7", themes: ["consistency", "mercy"] },
  { book: "tirmidhi", id: "t3", themes: ["mercy", "hope"] },
  { book: "qudsi", id: "q2", themes: ["mercy", "hope", "remembrance"] },
  { book: "tirmidhi", id: "t1", themes: ["return", "mercy", "patience"] },
  { book: "qudsi", id: "q3", themes: ["return", "hope", "new"] },
  { book: "nawawi", id: "naw8", themes: ["patience", "difficult"] },
  { book: "muslim", id: "m1", themes: ["remembrance", "gratitude", "morning", "evening"] },
  { book: "tirmidhi", id: "t2", themes: ["consistency", "gratitude", "ramadan"] },
  { book: "musnad", id: "h2", themes: ["consistency", "hope"] },
  { book: "bukhari", id: "b2", themes: ["consistency"] },
  { book: "nasai", id: "n2", themes: ["friday", "consistency"] },
  { book: "nasai", id: "n3", themes: ["night"] },
];

export type ResolvedHadith = {
  book: string;
  text: string;
  en: string;
  grade: string;
  ref: string;
};

/** Resolve against the curated library; null when absent (show nothing). */
export function resolveHadith(book: string, id: string): ResolvedHadith | null {
  try {
    const pool: HadithEntry[] =
      book === "nawawi" ? NAWAWI : (HADITH_BOOKS.find((b) => b.id === book)?.entries ?? []);
    const bookName =
      book === "nawawi"
        ? "الأربعون النووية"
        : (HADITH_BOOKS.find((b) => b.id === book)?.name ?? "");
    const hit = pool.find((e) => e.id === id);
    if (!hit || !bookName) return null;
    return { book: bookName, text: hit.text, en: hit.en, grade: hit.grade, ref: hit.ref };
  } catch {
    return null;
  }
}

export function hadithForTheme(theme: Theme): HadithRef[] {
  return HADITH_INDEX.filter((h) => h.themes.includes(theme));
}

// ---------- legacy Arabic-Indic refs ("الزمر · ٥٣") → {surah, ayah} ----------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function arIndicToNum(s: string): number | null {
  const latin = s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
  const n = parseInt(latin.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** Parse curated return-screen refs; null when unparseable (show nothing). */
export function parseVerseRef(ref: string): { surah: number; ayah: number } | null {
  try {
    const parts = ref.split("·").map((p) => p.trim());
    if (parts.length < 2) return null;
    const name = (parts[0] ?? "").replace(/^سورة\s+/, "");
    const idx = SURAH_NAMES.indexOf(name);
    if (idx < 0) return null;
    const first = (parts[1] ?? "").split("-")[0] ?? "";
    const ayah = arIndicToNum(first);
    if (!ayah || ayah < 1) return null;
    return { surah: idx + 1, ayah };
  } catch {
    return null;
  }
}
