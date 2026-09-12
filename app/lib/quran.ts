// Bundled Quran access: Uthmani text + Clear-Quran English, lazy-fetched
// once and cached in-module. Includes Arabic search normalization helpers.
export type Ayah = { surah: number; ayah: number; text: string };

let cache: Promise<Ayah[]> | null = null;
let enCache: Promise<Map<string, string>> | null = null;

function loadBundle(file: string): Promise<Ayah[]> {
  return fetch(`/${file}`)
    .then((r) => {
      if (!r.ok) throw new Error("bundle missing");
      return r.json() as Promise<{ v: number; ayahs: [number, number, string][] }>;
    })
    .then((d) => d.ayahs.map(([surah, ayah, text]) => ({ surah, ayah, text })));
}

export function loadQuran(): Promise<Ayah[]> {
  if (!cache) {
    cache = loadBundle("data/quran-uthmani.min.json").catch((e) => {
      cache = null;
      throw e;
    });
  }
  return cache;
}

/** English translation map "surah:ayah" -> text (Clear Quran). */
export function loadEnglish(): Promise<Map<string, string>> {
  if (!enCache) {
    enCache = loadBundle("data/en-clear.min.json")
      .then((list) => new Map(list.map((a) => [`${a.surah}:${a.ayah}`, a.text])))
      .catch((e) => {
        enCache = null;
        throw e;
      });
  }
  return enCache;
}

export function ayahCounts(ayahs: Ayah[]): number[] {
  const counts = new Array<number>(115).fill(0);
  for (const a of ayahs) counts[a.surah] = (counts[a.surah] ?? 0) + 1;
  return counts;
}

/** Arabic search normalization: strip tashkeel, unify alef/hamza forms. */
export function normalizeAr(s: string): string {
  return s
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchAyahs(ayahs: Ayah[], query: string, limit = 40): Ayah[] {
  const q = normalizeAr(query);
  if (q.length < 2) return [];
  const out: Ayah[] = [];
  for (const a of ayahs) {
    if (normalizeAr(a.text).includes(q)) {
      out.push(a);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function ayahKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}
