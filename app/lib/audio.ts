// Reciter catalog + per-ayah MP3 URLs (everyayah.com, CSP-allowlisted).
// Audio streams on demand only; nothing is prefetched or uploaded.
export type Reciter = { id: string; ar: string; en: string };

export const RECITERS: Reciter[] = [
  { id: "Alafasy_128kbps", ar: "مشاري العفاسي", en: "Mishary Alafasy" },
  { id: "Abdurrahmaan_As-Sudais_192kbps", ar: "عبد الرحمن السديس", en: "As-Sudais" },
  { id: "Husary_128kbps", ar: "محمود الحصري", en: "Al-Husary" },
  { id: "Husary_Muallim_128kbps", ar: "الحصري (معلم)", en: "Husary (Teacher)" },
  { id: "Minshawy_Murattal_128kbps", ar: "المنشاوي (مرتل)", en: "Minshawy (Murattal)" },
  { id: "Minshawy_Mujawwad_192kbps", ar: "المنشاوي (مجود)", en: "Minshawy (Mujawwad)" },
  { id: "Maher_AlMuaiqly_64kbps", ar: "ماهر المعيقلي", en: "Maher Al-Muaiqly" },
  { id: "Abdul_Basit_Murattal_64kbps", ar: "عبد الباسط", en: "Abdul Basit" },
  { id: "Abu_Bakr_Ash-Shaatree_64kbps", ar: "أبو بكر الشاطري", en: "Ash-Shaatree" },
  { id: "Yasser_Ad-Dussary_128kbps", ar: "ياسر الدوسري", en: "Yasser Ad-Dussary" },
  { id: "Fares_Abbad_64kbps", ar: "فارس عباد", en: "Fares Abbad" },
  { id: "Nasser_Alqatami_128kbps", ar: "ناصر القطامي", en: "Nasser Al-Qatami" },
];

const pad = (n: number) => String(n).padStart(3, "0");

export function ayahAudioUrl(reciterId: string, surah: number, ayah: number): string {
  return `https://everyayah.com/data/${reciterId}/${pad(surah)}${pad(ayah)}.mp3`;
}
