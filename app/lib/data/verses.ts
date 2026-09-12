// Curated return-screen verses: hope → paradise → warning (mercy-first escalation).
// Texts are verified selections; the companion resolves refs against the
// bundled mushaf at runtime (see content.ts) rather than trusting strings.
export type VerseTone = "hope" | "jannah" | "warning";
export type Verse = { text: string; ref: string; tone: VerseTone };

export const VERSES: Verse[] = [
  {
    text: "قل يا عبادي الذين أسرفوا على أنفسهم لا تقنطوا من رحمة الله",
    ref: "الزمر · ٥٣",
    tone: "hope",
  },
  { text: "وهو الذي يقبل التوبة عن عباده ويعفو عن السيئات", ref: "الشورى · ٢٥", tone: "hope" },
  {
    text: "ومن يعمل سوءًا أو يظلم نفسه ثم يستغفر الله يجد الله غفورًا رحيمًا",
    ref: "النساء · ١١٠",
    tone: "hope",
  },
  {
    text: "إلا من تاب وآمن وعمل عملًا صالحًا فأولئك يبدل الله سيئاتهم حسنات",
    ref: "الفرقان · ٧٠",
    tone: "hope",
  },
  { text: "ألم يعلموا أن الله هو يقبل التوبة عن عباده", ref: "التوبة · ١٠٤", tone: "hope" },
  { text: "فاذكروني أذكركم واشكروا لي ولا تكفرون", ref: "البقرة · ١٥٢", tone: "hope" },
  { text: "ألا بذكر الله تطمئن القلوب", ref: "الرعد · ٢٨", tone: "hope" },
  { text: "إن مع العسر يسرًا", ref: "الشرح · ٥", tone: "hope" },
  { text: "ولسوف يعطيك ربك فترضى", ref: "الضحى · ٥", tone: "hope" },
  { text: "لا يكلف الله نفسًا إلا وسعها", ref: "البقرة · ٢٨٦", tone: "hope" },
  {
    text: "وبشر الذين آمنوا وعملوا الصالحات أن لهم جنات تجري من تحتها الأنهار",
    ref: "البقرة · ٢٥",
    tone: "jannah",
  },
  {
    text: "وسارعوا إلى مغفرة من ربكم وجنة عرضها السماوات والأرض",
    ref: "آل عمران · ١٣٣",
    tone: "jannah",
  },
  {
    text: "إن الذين آمنوا وعملوا الصالحات كانت لهم جنات الفردوس نزلًا",
    ref: "الكهف · ١٠٧",
    tone: "jannah",
  },
  {
    text: "تطاف عليهم بصحاف من ذهب وأكواب وفيها ما تشتهيه الأنفس وتلذ الأعين",
    ref: "الزخرف · ٧١",
    tone: "jannah",
  },
  { text: "ألا إن أولياء الله لا خوف عليهم ولا هم يحزنون", ref: "يونس · ٦٢", tone: "jannah" },
  {
    text: "فمن يعمل مثقال ذرة خيرًا يره · ومن يعمل مثقال ذرة شرًا يره",
    ref: "الزلزلة · ٧-٨",
    tone: "warning",
  },
  { text: "وأما من خفت موازينه فأمه هاوية", ref: "القارعة · ٨-٩", tone: "warning" },
  { text: "كلا لينبذن في الحطمة", ref: "الهمزة · ٤", tone: "warning" },
  { text: "ثم لتسألن يومئذ عن النعيم", ref: "التكاثر · ٨", tone: "warning" },
  {
    text: "بلى من كسب سيئة وأحاطت به خطيئته فأولئك أصحاب النار هم فيها خالدون",
    ref: "البقرة · ٨١",
    tone: "warning",
  },
];

export type ReturnStage = 0 | 1 | 2 | 3;

/** 0 = present, 1 = hope (3-6d), 2 = +jannah (7-13d), 3 = +warning (14d+). */
export function returnStage(absentDays: number): ReturnStage {
  if (absentDays >= 14) return 3;
  if (absentDays >= 7) return 2;
  if (absentDays >= 3) return 1;
  return 0;
}

export function versesForStage(stage: ReturnStage): Verse[] {
  const pick = (tone: VerseTone, n: number) => VERSES.filter((v) => v.tone === tone).slice(0, n);
  if (stage === 3) return [...pick("hope", 2), ...pick("jannah", 1), ...pick("warning", 2)];
  if (stage === 2) return [...pick("hope", 2), ...pick("jannah", 2)];
  return pick("hope", 3);
}
