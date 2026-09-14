// Deen catalog (STEP 10, ADR-007): curated content for levels, quests,
// good deeds, awareness lists, speech/character items, and learning
// cards. CONTENT only — no user data here (state lives in deen.ts).
// Names/descriptions resolve through dn.* dictionary keys so AR/EN
// parity and the guidance-safety scan cover every word. `kind`
// separates verified Islamic classification from personal development:
// unverified items are labeled habit/advice/personal-goal, never
// upgraded to rulings. Verified rows await reviewer sign-off
// (CONTENT_RIGHTS.md) and carry honest, famous references only.

/** Content kind: verified ruling vs personal-development labeling. */
export type DeenKind = "verified" | "personal-goal" | "habit" | "advice";

/** Display shelf for the Level-2 library grouping. */
export type DeenShelf = "mustahabb" | "deeds";

export type DeenCategory =
  | "salah"
  | "quran"
  | "dhikr"
  | "dua"
  | "adhkar"
  | "charity"
  | "family"
  | "people"
  | "character"
  | "community"
  | "knowledge"
  | "worship";

export type CatalogItem = {
  id: string;
  /** dn.* key for the display name. */
  nameKey: string;
  /** dn.* key for the one-line explanation. */
  descKey: string;
  category: DeenCategory;
  shelf: DeenShelf;
  kind: DeenKind;
  /** Required when kind is "verified": the honest, checkable basis. */
  source?: string;
  reference?: string;
  /** Where schools are known to differ. */
  schoolsKey?: string;
};

export type AwarenessItem = {
  id: string;
  nameKey: string;
  descKey: string;
  kind: DeenKind;
  source?: string;
  reference?: string;
  schoolsKey?: string;
};

export type QuestTemplate = {
  id: string;
  nameKey: string;
  kind: "deed" | "character" | "learning" | "discipline" | "worship";
  difficulty: "easy" | "medium" | "advanced";
  xp: number;
};

export type LearnCard = { id: string; titleKey: string; bodyKey: string };

export const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerId = (typeof PRAYERS)[number];

/** Good-deeds + mustahabb-growth library (§7/§14). */
export const DEEDS: CatalogItem[] = [
  {
    id: "deed.quran-read",
    nameKey: "dn.deed.quranRead",
    descKey: "dn.deed.quranReadD",
    category: "quran",
    shelf: "mustahabb",
    kind: "habit",
  },
  {
    id: "deed.morning-adhkar",
    nameKey: "dn.deed.morningAdhkar",
    descKey: "dn.deed.morningAdhkarD",
    category: "adhkar",
    shelf: "mustahabb",
    kind: "verified",
    source: "Wird adhkar catalog (curated)",
    reference: "library/adhkar",
  },
  {
    id: "deed.evening-adhkar",
    nameKey: "dn.deed.eveningAdhkar",
    descKey: "dn.deed.eveningAdhkarD",
    category: "adhkar",
    shelf: "mustahabb",
    kind: "verified",
    source: "Wird adhkar catalog (curated)",
    reference: "library/adhkar",
  },
  {
    id: "deed.optional-prayer",
    nameKey: "dn.deed.optionalPrayer",
    descKey: "dn.deed.optionalPrayerD",
    category: "salah",
    shelf: "mustahabb",
    kind: "advice",
  },
  {
    id: "deed.dua",
    nameKey: "dn.deed.dua",
    descKey: "dn.deed.duaD",
    category: "dua",
    shelf: "mustahabb",
    kind: "verified",
    source: "Quran",
    reference: "40:60",
    schoolsKey: "dn.schools.forms",
  },
  {
    id: "deed.dhikr",
    nameKey: "dn.deed.dhikr",
    descKey: "dn.deed.dhikrD",
    category: "dhikr",
    shelf: "mustahabb",
    kind: "habit",
  },
  {
    id: "deed.charity",
    nameKey: "dn.deed.charity",
    descKey: "dn.deed.charityD",
    category: "charity",
    shelf: "mustahabb",
    kind: "verified",
    source: "Quran",
    reference: "2:261",
    schoolsKey: "dn.schools.forms",
  },
  {
    id: "deed.help-parents",
    nameKey: "dn.deed.helpParents",
    descKey: "dn.deed.helpParentsD",
    category: "family",
    shelf: "mustahabb",
    kind: "verified",
    source: "Quran",
    reference: "17:23",
  },
  {
    id: "deed.help-family",
    nameKey: "dn.deed.helpFamily",
    descKey: "dn.deed.helpFamilyD",
    category: "family",
    shelf: "deeds",
    kind: "habit",
  },
  {
    id: "deed.kind-words",
    nameKey: "dn.deed.kindWords",
    descKey: "dn.deed.kindWordsD",
    category: "family",
    shelf: "deeds",
    kind: "advice",
  },
  {
    id: "deed.household",
    nameKey: "dn.deed.household",
    descKey: "dn.deed.householdD",
    category: "family",
    shelf: "deeds",
    kind: "habit",
  },
  {
    id: "deed.relatives",
    nameKey: "dn.deed.relatives",
    descKey: "dn.deed.relativesD",
    category: "family",
    shelf: "deeds",
    kind: "habit",
  },
  {
    id: "deed.help-someone",
    nameKey: "dn.deed.helpSomeone",
    descKey: "dn.deed.helpSomeoneD",
    category: "people",
    shelf: "deeds",
    kind: "habit",
  },
  {
    id: "deed.listen",
    nameKey: "dn.deed.listen",
    descKey: "dn.deed.listenD",
    category: "people",
    shelf: "deeds",
    kind: "advice",
  },
  {
    id: "deed.comfort",
    nameKey: "dn.deed.comfort",
    descKey: "dn.deed.comfortD",
    category: "people",
    shelf: "deeds",
    kind: "advice",
  },
  {
    id: "deed.teach-someone",
    nameKey: "dn.deed.teachSomeone",
    descKey: "dn.deed.teachSomeoneD",
    category: "people",
    shelf: "deeds",
    kind: "habit",
  },
  {
    id: "deed.visit",
    nameKey: "dn.deed.visit",
    descKey: "dn.deed.visitD",
    category: "people",
    shelf: "deeds",
    kind: "habit",
  },
  {
    id: "deed.feed",
    nameKey: "dn.deed.feed",
    descKey: "dn.deed.feedD",
    category: "charity",
    shelf: "deeds",
    kind: "advice",
  },
  {
    id: "deed.useful-items",
    nameKey: "dn.deed.usefulItems",
    descKey: "dn.deed.usefulItemsD",
    category: "charity",
    shelf: "deeds",
    kind: "habit",
  },
  {
    id: "deed.causes",
    nameKey: "dn.deed.causes",
    descKey: "dn.deed.causesD",
    category: "charity",
    shelf: "deeds",
    kind: "habit",
  },
  {
    id: "deed.forgive",
    nameKey: "dn.deed.forgive",
    descKey: "dn.deed.forgiveD",
    category: "character",
    shelf: "deeds",
    kind: "personal-goal",
  },
  {
    id: "deed.patience-act",
    nameKey: "dn.deed.patienceAct",
    descKey: "dn.deed.patienceActD",
    category: "character",
    shelf: "deeds",
    kind: "personal-goal",
  },
  {
    id: "deed.anger-control",
    nameKey: "dn.deed.angerControl",
    descKey: "dn.deed.angerControlD",
    category: "character",
    shelf: "deeds",
    kind: "personal-goal",
  },
  {
    id: "deed.kind-speech",
    nameKey: "dn.deed.kindSpeech",
    descKey: "dn.deed.kindSpeechD",
    category: "character",
    shelf: "deeds",
    kind: "personal-goal",
  },
  {
    id: "deed.promise",
    nameKey: "dn.deed.promise",
    descKey: "dn.deed.promiseD",
    category: "character",
    shelf: "deeds",
    kind: "personal-goal",
  },
  {
    id: "deed.volunteer",
    nameKey: "dn.deed.volunteer",
    descKey: "dn.deed.volunteerD",
    category: "community",
    shelf: "deeds",
    kind: "habit",
  },
  {
    id: "deed.clean-shared",
    nameKey: "dn.deed.cleanShared",
    descKey: "dn.deed.cleanSharedD",
    category: "community",
    shelf: "deeds",
    kind: "habit",
  },
  {
    id: "deed.community",
    nameKey: "dn.deed.community",
    descKey: "dn.deed.communityD",
    category: "community",
    shelf: "deeds",
    kind: "habit",
  },
  {
    id: "deed.teach-knowledge",
    nameKey: "dn.deed.teachKnowledge",
    descKey: "dn.deed.teachKnowledgeD",
    category: "knowledge",
    shelf: "deeds",
    kind: "advice",
  },
  {
    id: "deed.learn",
    nameKey: "dn.deed.learn",
    descKey: "dn.deed.learnD",
    category: "knowledge",
    shelf: "deeds",
    kind: "advice",
  },
  {
    id: "deed.secret-deed",
    nameKey: "dn.deed.secretDeed",
    descKey: "dn.deed.secretDeedD",
    category: "worship",
    shelf: "deeds",
    kind: "habit",
  },
];

/** Things-to-reduce + makruh-awareness (§10): ordinary habits stay habits. */
export const AWARENESS: AwarenessItem[] = [
  {
    id: "aware.waste",
    nameKey: "dn.aware.waste",
    descKey: "dn.aware.wasteD",
    kind: "verified",
    source: "Quran",
    reference: "7:31",
  },
  {
    id: "aware.excess-talk",
    nameKey: "dn.aware.excessTalk",
    descKey: "dn.aware.excessTalkD",
    kind: "advice",
  },
  { id: "aware.scroll", nameKey: "dn.aware.scroll", descKey: "dn.aware.scrollD", kind: "habit" },
  { id: "aware.overeat", nameKey: "dn.aware.overeat", descKey: "dn.aware.overeatD", kind: "habit" },
  {
    id: "aware.time-waste",
    nameKey: "dn.aware.timeWaste",
    descKey: "dn.aware.timeWasteD",
    kind: "habit",
  },
  {
    id: "aware.gossip-risk",
    nameKey: "dn.aware.gossipRisk",
    descKey: "dn.aware.gossipRiskD",
    kind: "advice",
  },
];

/** Haram-awareness (§11): educational, reflection-only, never scored. */
export const HARAM: AwarenessItem[] = [
  {
    id: "haram.backbiting",
    nameKey: "dn.haram.backbiting",
    descKey: "dn.haram.backbitingD",
    kind: "verified",
    source: "Quran",
    reference: "49:12",
    schoolsKey: "dn.schools.agreed",
  },
  {
    id: "haram.unjust-wealth",
    nameKey: "dn.haram.unjustWealth",
    descKey: "dn.haram.unjustWealthD",
    kind: "verified",
    source: "Quran",
    reference: "2:188",
    schoolsKey: "dn.schools.agreed",
  },
  {
    id: "haram.intoxicants",
    nameKey: "dn.haram.intoxicants",
    descKey: "dn.haram.intoxicantsD",
    kind: "verified",
    source: "Quran",
    reference: "5:90",
    schoolsKey: "dn.schools.agreed",
  },
  {
    id: "haram.false-speech",
    nameKey: "dn.haram.falseSpeech",
    descKey: "dn.haram.falseSpeechD",
    kind: "verified",
    source: "Quran",
    reference: "22:30",
    schoolsKey: "dn.schools.agreed",
  },
  {
    id: "haram.mockery",
    nameKey: "dn.haram.mockery",
    descKey: "dn.haram.mockeryD",
    kind: "verified",
    source: "Quran",
    reference: "49:11",
    schoolsKey: "dn.schools.agreed",
  },
];

/** Speech & communication (§13): ghibah verified, the rest personal goals. */
export const SPEECH: AwarenessItem[] = [
  {
    id: "speech.ghibah",
    nameKey: "dn.speech.ghibah",
    descKey: "dn.speech.ghibahD",
    kind: "verified",
    source: "Quran",
    reference: "49:12",
    schoolsKey: "dn.schools.agreed",
  },
  {
    id: "speech.lying",
    nameKey: "dn.speech.lying",
    descKey: "dn.speech.lyingD",
    kind: "personal-goal",
  },
  {
    id: "speech.insults",
    nameKey: "dn.speech.insults",
    descKey: "dn.speech.insultsD",
    kind: "personal-goal",
  },
  {
    id: "speech.arguments",
    nameKey: "dn.speech.arguments",
    descKey: "dn.speech.argumentsD",
    kind: "habit",
  },
  {
    id: "speech.hurtful",
    nameKey: "dn.speech.hurtful",
    descKey: "dn.speech.hurtfulD",
    kind: "personal-goal",
  },
  {
    id: "speech.trust",
    nameKey: "dn.speech.trust",
    descKey: "dn.speech.trustD",
    kind: "personal-goal",
  },
  { id: "speech.excess", nameKey: "dn.speech.excess", descKey: "dn.speech.excessD", kind: "habit" },
  {
    id: "speech.unverified",
    nameKey: "dn.speech.unverified",
    descKey: "dn.speech.unverifiedD",
    kind: "advice",
  },
];

/** Character & akhlaq (§17): personal-development goals, never rulings. */
export const CHARACTER: AwarenessItem[] = [
  {
    id: "char.patience",
    nameKey: "dn.char.patience",
    descKey: "dn.char.patienceD",
    kind: "personal-goal",
  },
  {
    id: "char.kindness",
    nameKey: "dn.char.kindness",
    descKey: "dn.char.kindnessD",
    kind: "personal-goal",
  },
  {
    id: "char.honesty",
    nameKey: "dn.char.honesty",
    descKey: "dn.char.honestyD",
    kind: "personal-goal",
  },
  {
    id: "char.forgiveness",
    nameKey: "dn.char.forgiveness",
    descKey: "dn.char.forgivenessD",
    kind: "personal-goal",
  },
  {
    id: "char.humility",
    nameKey: "dn.char.humility",
    descKey: "dn.char.humilityD",
    kind: "personal-goal",
  },
  { id: "char.anger", nameKey: "dn.char.anger", descKey: "dn.char.angerD", kind: "personal-goal" },
  {
    id: "char.respect",
    nameKey: "dn.char.respect",
    descKey: "dn.char.respectD",
    kind: "personal-goal",
  },
  {
    id: "char.promises",
    nameKey: "dn.char.promises",
    descKey: "dn.char.promisesD",
    kind: "personal-goal",
  },
  {
    id: "char.speech-kind",
    nameKey: "dn.char.speechKind",
    descKey: "dn.char.speechKindD",
    kind: "personal-goal",
  },
  {
    id: "char.arrogance",
    nameKey: "dn.char.arrogance",
    descKey: "dn.char.arroganceD",
    kind: "personal-goal",
  },
  { id: "char.envy", nameKey: "dn.char.envy", descKey: "dn.char.envyD", kind: "personal-goal" },
  {
    id: "char.quiet-help",
    nameKey: "dn.char.quietHelp",
    descKey: "dn.char.quietHelpD",
    kind: "personal-goal",
  },
];

/** Quest templates (§8/§26): difficulty = time/effort, never holiness. */
export const QUESTS: QuestTemplate[] = [
  { id: "q.read-quran", nameKey: "dn.quest.readQuran", kind: "deed", difficulty: "easy", xp: 5 },
  {
    id: "q.morning-adhkar",
    nameKey: "dn.quest.morningAdhkar",
    kind: "worship",
    difficulty: "easy",
    xp: 5,
  },
  {
    id: "q.evening-adhkar",
    nameKey: "dn.quest.eveningAdhkar",
    kind: "worship",
    difficulty: "easy",
    xp: 5,
  },
  { id: "q.charity", nameKey: "dn.quest.charity", kind: "deed", difficulty: "easy", xp: 5 },
  { id: "q.help", nameKey: "dn.quest.help", kind: "deed", difficulty: "easy", xp: 5 },
  { id: "q.dua", nameKey: "dn.quest.dua", kind: "worship", difficulty: "easy", xp: 5 },
  { id: "q.learn", nameKey: "dn.quest.learn", kind: "learning", difficulty: "easy", xp: 5 },
  {
    id: "q.optional-prayer",
    nameKey: "dn.quest.optionalPrayer",
    kind: "worship",
    difficulty: "medium",
    xp: 10,
  },
  { id: "q.family", nameKey: "dn.quest.family", kind: "deed", difficulty: "medium", xp: 10 },
  {
    id: "q.character",
    nameKey: "dn.quest.character",
    kind: "character",
    difficulty: "medium",
    xp: 10,
  },
  {
    id: "q.speech-pause",
    nameKey: "dn.quest.speechPause",
    kind: "character",
    difficulty: "medium",
    xp: 10,
  },
  {
    id: "q.discipline",
    nameKey: "dn.quest.discipline",
    kind: "discipline",
    difficulty: "advanced",
    xp: 15,
  },
];

/** Educational cards (§4/§49): famous references only, variance stated. */
export const LEARN: LearnCard[] = [
  { id: "learn.fard", titleKey: "dn.learn.fard", bodyKey: "dn.learn.fardB" },
  { id: "learn.wajib", titleKey: "dn.learn.wajib", bodyKey: "dn.learn.wajibB" },
  { id: "learn.sunnah", titleKey: "dn.learn.sunnah", bodyKey: "dn.learn.sunnahB" },
  { id: "learn.mustahabb", titleKey: "dn.learn.mustahabb", bodyKey: "dn.learn.mustahabbB" },
  { id: "learn.mubah", titleKey: "dn.learn.mubah", bodyKey: "dn.learn.mubahB" },
  { id: "learn.makruh", titleKey: "dn.learn.makruh", bodyKey: "dn.learn.makruhB" },
  { id: "learn.haram", titleKey: "dn.learn.haram", bodyKey: "dn.learn.haramB" },
  { id: "learn.salah", titleKey: "dn.learn.salah", bodyKey: "dn.learn.salahB" },
  { id: "learn.fasting", titleKey: "dn.learn.fasting", bodyKey: "dn.learn.fastingB" },
  { id: "learn.zakah", titleKey: "dn.learn.zakah", bodyKey: "dn.learn.zakahB" },
  { id: "learn.hajj", titleKey: "dn.learn.hajj", bodyKey: "dn.learn.hajjB" },
];

export const ACHIEVEMENT_IDS = [
  "first-step",
  "returned",
  "consistent",
  "reflected",
  "helpful",
  "learner",
  "disciplined",
] as const;
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export const STREAK_KINDS = ["salah", "quran", "reflection", "deed", "habit"] as const;
export type StreakKind = (typeof STREAK_KINDS)[number];

/** XP table: fixed, public, and disconnected from any divine measure. */
export const XP = {
  questEasy: 5,
  questMedium: 10,
  questAdvanced: 15,
  salahDay: 10,
  deed: 5,
  secretDeed: 5,
  reflection: 5,
  chest: 3,
  returned: 5,
} as const;
