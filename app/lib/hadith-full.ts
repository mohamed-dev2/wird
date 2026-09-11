export type FullHadith = {
  num: number;
  text: string;
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
] as const;

export type FullBookId = (typeof FULL_BOOKS)[number]["id"];

type RawHadith = {
  hadithnumber: number;
  text?: string;
  reference?: { book?: number; hadith?: number | string };
};

const cache = new Map<FullBookId, Promise<FullBook>>();

export function loadFullBook(id: FullBookId): Promise<FullBook> {
  const hit = cache.get(id);
  if (hit) return hit;
  const meta = FULL_BOOKS.find((b) => b.id === id);
  const p = fetch(
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
