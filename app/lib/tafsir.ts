// Tafsir sources: Jalalayn bundled offline; others fetched on demand from
// CSP-allowlisted endpoints and cached by the service worker afterwards.
export type TafsirSource = { id: string; ar: string; en: string; offline?: boolean };

export const TAFSIRS: TafsirSource[] = [
  { id: "ar-tafsir-muyassar", ar: "الميسر", en: "Muyassar" },
  { id: "ar-tafseer-al-saddi", ar: "السعدي", en: "Saadi" },
  { id: "ar-tafsir-ibn-kathir", ar: "ابن كثير", en: "Ibn Kathir" },
  { id: "ar-tafsir-al-tabari", ar: "الطبري", en: "Tabari" },
  { id: "ar-tafseer-al-qurtubi", ar: "القرطبي", en: "Qurtubi" },
  { id: "ar-tafsir-al-baghawi", ar: "البغوي", en: "Baghawi" },
  { id: "ar-tafsir-al-wasit", ar: "الوسيط (طنطاوي)", en: "Wasit" },
  { id: "jalalayn", ar: "الجلالين · دون إنترنت", en: "Jalalayn · offline", offline: true },
  { id: "en-tafisr-ibn-kathir", ar: "ابن كثير (EN)", en: "Ibn Kathir (EN)" },
  { id: "en-tafsir-maarif-ul-quran", ar: "معارف القرآن (EN)", en: "Ma'arif (EN)" },
];

const apiCache = new Map<string, Promise<string>>();
let jalalaynCache: Promise<Map<string, string>> | null = null;

function loadJalalayn(): Promise<Map<string, string>> {
  if (!jalalaynCache) {
    jalalaynCache = fetch("/data/ar-jalalayn.min.json")
      .then((r) => {
        if (!r.ok) throw new Error("jalalayn missing");
        return r.json() as Promise<{ ayahs: [number, number, string][] }>;
      })
      .then((d) => new Map(d.ayahs.map(([s, v, t]) => [`${s}:${v}`, t])))
      .catch((e) => {
        jalalaynCache = null;
        throw e;
      });
  }
  return jalalaynCache;
}

export function stripHtml(html: string): string {
  // Security: detached node, only textContent is read — never inserted into the DOM.
  try {
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || "").replace(/\s+/g, " ").trim();
  } catch {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

export function fetchTafsir(sourceId: string, surah: number, ayah: number): Promise<string> {
  if (sourceId === "jalalayn") {
    return loadJalalayn().then((m) => {
      const t = m.get(`${surah}:${ayah}`);
      if (!t) throw new Error("missing");
      return t;
    });
  }
  const key = `${sourceId}/${surah}:${ayah}`;
  const hit = apiCache.get(key);
  if (hit) return hit;
  const p = fetch(`https://api.quran.com/api/v4/tafsirs/${sourceId}/by_ayah/${surah}:${ayah}`)
    .then((r) => {
      if (!r.ok) throw new Error("tafsir missing");
      return r.json() as Promise<{ tafsir?: { text?: string } }>;
    })
    .then((d) => {
      const text = d.tafsir?.text?.trim();
      if (!text) throw new Error("empty");
      return stripHtml(text);
    })
    .catch((e) => {
      apiCache.delete(key);
      throw e;
    });
  apiCache.set(key, p);
  return p;
}
