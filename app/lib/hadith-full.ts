// Full 12-book hadith library: static catalog + lazy per-book JSON fetch.
// IDs are stable (book + number) so favorites/reads survive updates.
//
// Two verified upstreams (both lazy, both SW-cached, both opt-in):
// - fawazahmed0/hadith-api: ara-* + eng-* editions (10 books).
// - AhmedBaset/hadith-json @ v1.2.0 (pinned, immutable): bilingual
//   community mirror of Sunnah.com data for Musnad Ahmed (PARTIAL —
//   chapters 8–30 absent upstream) and Sunan al-Darimi (Arabic full,
//   English absent upstream). Documented honestly in
//   docs/features/hadith.md; revisit only with a reviewed source.
import { fetchWithTimeout } from "./net";
import { normalizeAr } from "./quran";
export type FullHadith = {
  num: number;
  text: string;
  /** Normalized once at load so keystroke search never re-normalizes. */
  ntext: string;
  book: number;
  ref: string;
};

export type FullBook = {
  id: FullBookId;
  ar: string;
  en: string;
  count: number;
  sections: Record<string, string>;
  hadiths: FullHadith[];
};

export const FULL_BOOKS = [
  { id: "bukhari", ar: "صحيح البخاري", en: "Sahih al-Bukhari" },
  { id: "muslim", ar: "صحيح مسلم", en: "Sahih Muslim" },
  { id: "abudawud", ar: "سنن أبي داود", en: "Sunan Abi Dawud" },
  { id: "tirmidhi", ar: "سنن الترمذي", en: "Jami' at-Tirmidhi" },
  { id: "nasai", ar: "سنن النسائي", en: "Sunan an-Nasa'i" },
  { id: "ibnmajah", ar: "سنن ابن ماجه", en: "Sunan Ibn Majah" },
  { id: "malik", ar: "موطأ مالك", en: "Muwatta Malik" },
  { id: "nawawi", ar: "الأربعون النووية", en: "Forty Nawawi" },
  { id: "qudsi", ar: "الأحاديث القدسية", en: "Qudsi Hadiths" },
  { id: "dehlawi", ar: "جوامع الكلم", en: "Concise Wisdoms" },
  { id: "ahmed", ar: "مسند أحمد", en: "Musnad Ahmad" },
  { id: "darimi", ar: "سنن الدارمي", en: "Sunan al-Darimi" },
] as const;

export type FullBookId = (typeof FULL_BOOKS)[number]["id"];

type RawHadith = {
  hadithnumber: number;
  text?: string;
  reference?: { book?: number; hadith?: number | string };
};

const cache = new Map<FullBookId, Promise<FullBook>>();
const enCache = new Map<FullBookId, Promise<Map<number, string>>>();

// Pinned immutable mirror files (bilingual AR+EN in one payload).
const MIRROR_BASE =
  "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@v1.2.0/db/by_book/the_9_books";
const MIRROR_FILES: Partial<Record<FullBookId, string>> = {
  ahmed: "ahmed.json",
  darimi: "darimi.json",
};

type MirrorPayload = { hadiths?: unknown; chapters?: unknown };

const mirrorCache = new Map<FullBookId, Promise<FullBook>>();
// One fetch + one parse per mirror book: both the Arabic book and the EN
// map derive from this shared payload instead of downloading twice.
const mirrorRaw = new Map<FullBookId, Promise<MirrorPayload>>();

function loadMirrorRaw(id: FullBookId): Promise<MirrorPayload> {
  const hit = mirrorRaw.get(id);
  if (hit) return hit;
  const file = MIRROR_FILES[id];
  const p = (
    file
      ? fetchWithTimeout(`${MIRROR_BASE}/${file}`).then((r) => {
          if (!r.ok) throw new Error("mirror missing");
          return r.json() as Promise<MirrorPayload>;
        })
      : Promise.reject(new Error("no mirror"))
  ).catch((e) => {
    mirrorRaw.delete(id);
    throw e;
  });
  mirrorRaw.set(id, p);
  return p;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/** Map one mirror payload to the shared FullBook shape (num = in-book number). */
function mirrorToBook(
  id: FullBookId,
  meta: { ar: string; en: string },
  d: MirrorPayload,
): FullBook {
  if (!Array.isArray(d.hadiths)) throw new Error("mirror shape");
  const hadiths = (d.hadiths as unknown[])
    .map((h) => {
      const r = asRecord(h);
      const num = typeof r?.idInBook === "number" ? r.idInBook : -1;
      const text = typeof r?.arabic === "string" ? r.arabic.trim() : "";
      const chap = typeof r?.chapterId === "number" ? r.chapterId : 0;
      return num > 0 && text
        ? { num, text, ntext: normalizeAr(text), book: chap, ref: `#${num}` }
        : null;
    })
    .filter((h): h is FullHadith => h !== null);
  if (hadiths.length === 0) throw new Error("mirror empty");
  const sections: Record<string, string> = {};
  if (Array.isArray(d.chapters)) {
    for (const c of d.chapters as unknown[]) {
      const r = asRecord(c);
      if (typeof r?.id === "number" && typeof r?.arabic === "string" && r.arabic) {
        sections[String(r.id)] = r.arabic;
      }
    }
  }
  return { id, ar: meta.ar, en: meta.en, count: hadiths.length, sections, hadiths };
}

function loadMirrorBook(id: FullBookId): Promise<FullBook> {
  const hit = mirrorCache.get(id);
  if (hit) return hit;
  const meta = FULL_BOOKS.find((b) => b.id === id);
  const p = (
    meta
      ? loadMirrorRaw(id).then((d) => mirrorToBook(id, meta, d))
      : Promise.reject(new Error("no mirror"))
  ).catch((e) => {
    mirrorCache.delete(id);
    throw e;
  });
  mirrorCache.set(id, p);
  return p;
}

export function loadFullBook(id: FullBookId): Promise<FullBook> {
  if (MIRROR_FILES[id]) return loadMirrorBook(id);
  const hit = cache.get(id);
  if (hit) return hit;
  const meta = FULL_BOOKS.find((b) => b.id === id);
  const p = fetchWithTimeout(
    `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${id}.min.json`,
  )
    .then((r) => {
      if (!r.ok) throw new Error("book missing");
      return r.json() as Promise<{
        metadata?: { sections?: Record<string, string> };
        hadiths?: RawHadith[];
      }>;
    })
    .then((d) => {
      const list = d.hadiths ?? [];
      return {
        id,
        ar: meta?.ar ?? id,
        en: meta?.en ?? id,
        count: list.length,
        sections: d.metadata?.sections ?? {},
        hadiths: list.map((h) => ({
          num: h.hadithnumber,
          text: h.text ?? "",
          ntext: normalizeAr(h.text ?? ""),
          book: h.reference?.book ?? 0,
          ref: `#${h.hadithnumber}`,
        })),
      } satisfies FullBook;
    })
    .catch((e) => {
      cache.delete(id);
      throw e;
    });
  cache.set(id, p);
  return p;
}

export function fullHadithId(book: FullBookId, num: number): string {
  return `full-${book}-${num}`;
}

type RawEnHadith = { hadithnumber: number; text?: string };

// English translation map (hadithnumber → text) from the verified `eng-*`
// edition of the same upstream API. Loaded lazily — Arabic readers never
// pay for it. Missing/blocked EN resolves to an empty map (Arabic stays).
// Mirror books (Ahmed/Darimi) carry both languages in one payload, so EN
// is derived from the already-cached book instead of a second fetch.
export function loadFullBookEn(id: FullBookId): Promise<Map<number, string>> {
  const hit = enCache.get(id);
  if (hit) return hit;
  const p = MIRROR_FILES[id]
    ? // Mirror payload is bilingual: EN derives from the same pinned
      // file (browser/SW-cached after the Arabic load — no new origin).
      mirrorEn(id)
    : fetchWithTimeout(
        `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${id}.min.json`,
      )
        .then((r) => {
          if (!r.ok) throw new Error("english edition missing");
          return r.json() as Promise<{ hadiths?: RawEnHadith[] }>;
        })
        .then((d) => {
          const m = new Map<number, string>();
          for (const h of d.hadiths ?? []) {
            const t = (h.text ?? "").trim();
            if (Number.isFinite(h.hadithnumber) && t) m.set(h.hadithnumber, t);
          }
          return m;
        })
        .catch(() => new Map<number, string>());
  enCache.set(id, p);
  return p;
}

/** EN map derived from the shared mirror payload (no extra download). */
function mirrorEn(id: FullBookId): Promise<Map<number, string>> {
  return loadMirrorRaw(id)
    .then((d) => {
      const m = new Map<number, string>();
      if (Array.isArray(d.hadiths)) {
        for (const h of d.hadiths as unknown[]) {
          const r = asRecord(h);
          const num = typeof r?.idInBook === "number" ? r.idInBook : -1;
          const en = asRecord(r?.english);
          const t = typeof en?.text === "string" ? en.text.trim() : "";
          if (num > 0 && t) m.set(num, t);
        }
      }
      return m;
    })
    .catch(() => new Map<number, string>());
}
