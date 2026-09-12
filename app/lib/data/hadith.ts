// Curated famous selections (مختارات مشهورة) with English translations.
// For full texts consult the printed editions or the in-app full library.
export type HadithEntry = {
  id: string;
  text: string;
  en: string;
  grade: string;
  ref: string;
  meaning?: string;
  meaningEn?: string;
};

export type HadithBook = {
  id: string;
  name: string;
  full: string;
  note: string;
  entries: HadithEntry[];
};

export const HADITH_BOOKS: HadithBook[] = [
  {
    id: "bukhari",
    name: "صحيح البخاري",
    full: "الجامع المسند الصحيح المختصر",
    note: "أصح الكتب بعد كتاب الله",
    entries: [
      {
        id: "b1",
        text: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى، فمن كانت هجرته إلى دنيا يصيبها أو إلى امرأة ينكحها فهجرته إلى ما هاجر إليه",
        en: "Actions are but by intentions, and every person shall have only what they intended.",
        grade: "صحيح",
        ref: "بدء الوحي، ١",
        meaning: "مدار الأعمال على النية؛ فأخلص نيتك يَعظُم أجرك ولو قل العمل.",
        meaningEn: "Deeds are judged by intentions — purify yours and small acts grow great.",
      },
      {
        id: "b2",
        text: "من يرد الله به خيرًا يفقهه في الدين",
        en: "Whoever Allah wishes good for, He gives him understanding of the religion.",
        grade: "صحيح",
        ref: "كتاب العلم، ٧١",
        meaning: "التفقه في الدين علامة إرادة الله الخير بالعبد.",
        meaningEn: "Understanding the religion is a sign Allah wills good for you.",
      },
      {
        id: "b3",
        text: "خيركم من تعلم القرآن وعلمه",
        en: "The best of you are those who learn the Quran and teach it.",
        grade: "صحيح",
        ref: "فضائل القرآن، ٥٠٢٧",
      },
    ],
  },
  {
    id: "muslim",
    name: "صحيح مسلم",
    full: "المسند الصحيح المختصر",
    note: "ثاني الصحيحين",
    entries: [
      {
        id: "m1",
        text: "الطهور شطر الإيمان، والحمد لله تملأ الميزان، وسبحان الله والحمد لله تملآن ما بين السماوات والأرض",
        en: "Purity is half of faith, and Alhamdulillah fills the scale.",
        grade: "صحيح",
        ref: "الطهارة، ٢٢٣",
        meaning: "الطهارة نصف الإيمان، والذكر يثقل الميزان.",
        meaningEn: "Purity is half of faith, and remembrance weighs heavy in the balance.",
      },
      {
        id: "m2",
        text: "من سلك طريقًا يلتمس فيه علمًا سهل الله له به طريقًا إلى الجنة",
        en: "Whoever travels a path seeking knowledge, Allah makes easy a path to Paradise.",
        grade: "صحيح",
        ref: "الذكر والدعاء، ٢٦٩٩",
        meaning: "طلب العلم طريق مختصر إلى الجنة.",
        meaningEn: "Seeking knowledge is a shortcut to Paradise.",
      },
      {
        id: "m3",
        text: "من صلى البردين دخل الجنة",
        en: "Whoever prays the two cool prayers (Fajr and Asr) will enter Paradise.",
        grade: "صحيح",
        ref: "المساجد، ٦٣٥",
      },
    ],
  },
  {
    id: "abudawud",
    name: "سنن أبي داود",
    full: "السنن — سليمان بن الأشعث السجستاني",
    note: "من السنن الأربع، عناية بأحاديث الأحكام",
    entries: [
      {
        id: "d1",
        text: "وإن العلماء ورثة الأنبياء، وإن الأنبياء لم يورثوا دينارًا ولا درهمًا، ورثوا العلم فمن أخذه أخذ بحظ وافر",
        en: "Scholars are the heirs of the Prophets, who left knowledge as inheritance.",
        grade: "صحيح",
        ref: "كتاب العلم، ٣٦٤١",
        meaning: "العلماء ورثة الأنبياء في العلم والدعوة.",
        meaningEn: "Scholars inherit the Prophets' knowledge and mission.",
      },
      {
        id: "d2",
        text: "من تشبه بقوم فهو منهم",
        en: "Whoever imitates a people is one of them.",
        grade: "حسن صحيح",
        ref: "كتاب اللباس، ٤٠٣١",
        meaning: "تحذير من التشبه بالكفار في خصائصهم.",
        meaningEn: "A warning against imitating disbelievers in their distinct ways.",
      },
      {
        id: "d3",
        text: "إن أول ما يحاسب به العبد يوم القيامة من عمله صلاته",
        en: "The first thing a person will be held accountable for is their prayer.",
        grade: "صحيح",
        ref: "الصلاة، ٨٦٤",
      },
    ],
  },
  {
    id: "tirmidhi",
    name: "سنن الترمذي",
    full: "الجامع الكبير — محمد بن عيسى الترمذي",
    note: "تميز ببيان درجات الأحاديث والخلاف الفقهي",
    entries: [
      {
        id: "t1",
        text: "اتق الله حيثما كنت، وأتبع السيئة الحسنة تمحها، وخالق الناس بخلق حسن",
        en: "Fear Allah wherever you are, follow a bad deed with a good one, and treat people well.",
        grade: "حسن صحيح",
        ref: "البر والصلة، ١٩٨٧",
        meaning: "جماع الوصايا: تقوى الله، ومحو السيئة بالحسنة، وحسن الخلق.",
        meaningEn: "Three encompassing counsels: piety, erasing bad with good, fine character.",
      },
      {
        id: "t2",
        text: "الكلمة الطيبة صدقة، وكل خطوة يمشيها إلى الصلاة صدقة",
        en: "A kind word is charity, and every step to prayer is charity.",
        grade: "صحيح",
        ref: "البر والصلة",
        meaning: "الكلام الطيب والخطا إلى المساجد صدقات يومية.",
        meaningEn: "Kind words and steps to prayer are daily charities.",
      },
      {
        id: "t3",
        text: "الراحمون يرحمهم الرحمن، ارحموا من في الأرض يرحمكم من في السماء",
        en: "The merciful will be shown mercy by the Most Merciful.",
        grade: "حسن صحيح",
        ref: "البر والصلة، ١٩٢٤",
      },
    ],
  },
  {
    id: "nasai",
    name: "سنن النسائي",
    full: "السنن الصغرى (المجتبى) — أحمد بن شعيب النسائي",
    note: "أصح السنن إسنادًا عند كثير من الحفاظ",
    entries: [
      {
        id: "n1",
        text: "السواك مطهرة للفم مرضاة للرب",
        en: "The siwak purifies the mouth and pleases the Lord.",
        grade: "صحيح",
        ref: "الطهارة، ٥",
        meaning: "السواك سنة مؤكدة تجمع طهارة الفم ورضا الرب.",
        meaningEn: "Siwak is an emphasized sunnah joining oral purity with divine pleasure.",
      },
      {
        id: "n2",
        text: "خمس صلوات كتبهن الله على العباد، فمن جاء بهن لم يضيع منهن شيئًا استخفافًا بحقهن كان له عند الله عهد أن يدخله الجنة",
        en: "Five prayers Allah prescribed; whoever upholds them has a covenant to enter Paradise.",
        grade: "صحيح",
        ref: "الصلاة",
        meaning: "المحافظة على الصلوات الخمس عهد بدخول الجنة.",
        meaningEn: "Guarding the five prayers is a covenant of Paradise.",
      },
      {
        id: "n3",
        text: "إن الله وتر يحب الوتر",
        en: "Indeed Allah is One (Witr) and loves the witr.",
        grade: "صحيح",
        ref: "قيام الليل",
      },
    ],
  },
  {
    id: "ibnmajah",
    name: "سنن ابن ماجه",
    full: "السنن — محمد بن يزيد القزويني",
    note: "سادس الكتب الستة عند الجمهور",
    entries: [
      {
        id: "j1",
        text: "طلب العلم فريضة على كل مسلم",
        en: "Seeking knowledge is obligatory upon every Muslim.",
        grade: "صحيح",
        ref: "المقدمة، ٢٢٤",
        meaning: "طلب العلم واجب على كل مسلم بحسب حاجته.",
        meaningEn: "Seeking knowledge is obligatory on every Muslim.",
      },
      {
        id: "j2",
        text: "ما ملأ آدمي وعاء شرًا من بطنه، بحسب ابن آدم أكلات يقمن صلبه",
        en: "No vessel a person fills is worse than his stomach.",
        grade: "صحيح",
        ref: "الأطعمة، ٣٣٤٩",
        meaning: "الاقتصاد في الطعام صحة للبدن وعون على العبادة.",
        meaningEn: "Moderation in food is health for the body and aid in worship.",
      },
      {
        id: "j3",
        text: "من سئل عن علم فكتمه ألجم يوم القيامة بلجام من نار",
        en: "Whoever is asked about knowledge and conceals it will be bridled with fire.",
        grade: "صحيح",
        ref: "المقدمة، ٢٦١",
      },
    ],
  },
  {
    id: "muwatta",
    name: "موطأ مالك",
    full: "الموطأ — مالك بن أنس، إمام دار الهجرة",
    note: "أقدم مدونات الحديث والفقه معًا",
    entries: [
      {
        id: "w1",
        text: "إنما بعثت لأتمم مكارم الأخلاق",
        en: "I was only sent to perfect noble character.",
        grade: "صحيح بلاغًا",
        ref: "حسن الخلق",
        meaning: "بعثة النبي ﷺ تتميم لمكارم الأخلاق.",
        meaningEn: "The Prophet ﷺ was sent to perfect noble character.",
      },
      {
        id: "w2",
        text: "لا يحل لمسلم أن يهجر أخاه فوق ثلاث ليال",
        en: "It is not lawful for a Muslim to forsake his brother for more than three nights.",
        grade: "صحيح",
        ref: "الجامع",
        meaning: "تحريم الهجر فوق ثلاث ليال بين المسلمين.",
        meaningEn: "Forsaking a fellow Muslim beyond three nights is forbidden.",
      },
      {
        id: "w3",
        text: "لا تحاسدوا، ولا تناجشوا، ولا تباغضوا، وكونوا عباد الله إخوانا",
        en: "Do not envy one another; be servants of Allah as brothers.",
        grade: "صحيح",
        ref: "حسن الخلق",
      },
    ],
  },
  {
    id: "musnad",
    name: "مسند أحمد",
    full: "المسند — أحمد بن حنبل",
    note: "أجمع المسانيد، نحو ثلاثين ألف حديث",
    entries: [
      {
        id: "h1",
        text: "أحب الأعمال إلى الله أدومها وإن قل",
        en: "The most beloved deeds to Allah are the most consistent, even if small.",
        grade: "صحيح",
        ref: "مسند عائشة",
        meaning: "المداومة على القليل أحب إلى الله من الكثير المنقطع.",
        meaningEn: "Consistent small deeds beat abundant interrupted ones.",
      },
      {
        id: "h2",
        text: "اتقوا النار ولو بشق تمرة، فمن لم يجد فبكلمة طيبة",
        en: "Shield yourselves from the Fire, even with half a date.",
        grade: "صحيح",
        ref: "مسند عدي بن حاتم",
        meaning: "اتق النار ولو بصدقة يسيرة أو كلمة طيبة.",
        meaningEn: "Shield yourself from Hellfire even with half a date or a kind word.",
      },
      {
        id: "h3",
        text: "الطيرة شرك، وما منا إلا، ولكن الله يذهبه بالتوكل",
        en: "Belief in omens is shirk; but Allah removes it through trust in Him.",
        grade: "صحيح",
        ref: "المسند",
      },
    ],
  },
  {
    id: "darimi",
    name: "سنن الدارمي",
    full: "المسند الجامع (السنن) — عبد الله بن عبد الرحمن الدارمي",
    note: "مقدمته كنز في آداب العلم والفتيا",
    entries: [
      {
        id: "r1",
        text: "أجرؤكم على الفتيا أجرؤكم على النار",
        en: "The boldest of you in giving fatwa is the boldest toward the Fire.",
        grade: "مرسل",
        ref: "المقدمة، باب من هاب الفتيا",
        meaning: "تحذير المفتين بغير علم من الجرأة على الفتيا.",
        meaningEn: "A warning to those bold in fatwa without knowledge.",
      },
      {
        id: "r2",
        text: "كن عالمًا أو متعلمًا أو مستمعًا أو محبًا، ولا تكن الخامس فتهلك",
        en: "Be a scholar, a student, a listener, or a lover — and do not be the fifth.",
        grade: "موقوف",
        ref: "المقدمة",
        meaning: "مراتب أهل العلم: عالم أو متعلم أو مستمع أو محب.",
        meaningEn: "Ranks of knowledge people: scholar, student, listener, lover.",
      },
      {
        id: "r3",
        text: "نضر الله امرأ سمع منا شيئا فبلغه كما سمعه",
        en: "May Allah brighten one who hears my words and conveys them as heard.",
        grade: "صحيح",
        ref: "المقدمة",
      },
    ],
  },
  {
    id: "qudsi",
    name: "الأحاديث القدسية",
    full: "الأربعون القدسية — كلام الله من غير القرآن",
    note: "أحاديث إلهية في الرجاء والمحبة",
    entries: [
      {
        id: "q1",
        text: "يا عبادي إني حرمت الظلم على نفسي وجعلته بينكم محرمًا فلا تظالموا",
        en: "O My servants, I have forbidden injustice for Myself and among you — so do not wrong one another.",
        grade: "صحيح مسلم",
        ref: "مسلم، ٢٥٧٧",
        meaning: "تحريم الظلم تحريمًا مؤكدًا على الله وعلى العباد.",
        meaningEn:
          "Injustice is emphatically forbidden — by Allah upon Himself and among servants.",
      },
      {
        id: "q2",
        text: "أنا عند ظن عبدي بي، وأنا معه إذا ذكرني",
        en: "I am as My servant expects Me, and I am with them when they remember Me.",
        grade: "متفق عليه",
        ref: "البخاري ومسلم",
        meaning: "حسن الظن بالله من أعظم العبادات القلبية.",
        meaningEn: "Good expectations of Allah are among the greatest heart-worships.",
      },
      {
        id: "q3",
        text: "إذا تقرب العبد إلي شبرًا تقربت إليه ذراعًا، وإذا تقرب إلي ذراعًا تقربت منه باعًا",
        en: "When My servant draws near a handspan, I draw near an arm's length.",
        grade: "صحيح",
        ref: "البخاري",
      },
    ],
  },
  {
    id: "dehlawi",
    name: "جوامع الكلم",
    full: "مختارات الدهلوي — حكم نبوية قصيرة جامعة",
    note: "كلمات قليلة المبنى عظيمة المعنى",
    entries: [
      {
        id: "e1",
        text: "الحرب خدعة",
        en: "War is deceit.",
        grade: "متفق عليه",
        ref: "البخاري ومسلم",
        meaning: "جواز الخدعة في الحرب ضد العدو.",
        meaningEn: "Deception against the enemy in war is permitted.",
      },
      {
        id: "e2",
        text: "المسلم مرآة المسلم",
        en: "The Muslim is a mirror to his fellow Muslim.",
        grade: "حسن",
        ref: "سنن أبي داود",
        meaning: "المؤمن مرآة أخيه ينصحه ويستر عيبه.",
        meaningEn: "A believer mirrors their brother: advising and concealing faults.",
      },
      {
        id: "e3",
        text: "ليس الخبر كالمعاينة",
        en: "Hearing news is not like seeing with one's own eyes.",
        grade: "صحيح",
        ref: "مسند أحمد",
      },
    ],
  },
];

export const NAWAWI: HadithEntry[] = [
  {
    id: "naw1",
    text: "إن الله طيب لا يقبل إلا طيبا، وإن الله أمر المؤمنين بما أمر به المرسلين",
    en: "Allah is Pure and accepts only what is pure.",
    grade: "صحيح مسلم",
    ref: "الأربعون النووية، ١٠",
  },
  {
    id: "naw2",
    text: "بني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمدًا رسول الله، وإقام الصلاة، وإيتاء الزكاة، والحج، وصوم رمضان",
    en: "Islam is built on five: testimony, prayer, charity, pilgrimage, and fasting.",
    grade: "متفق عليه",
    ref: "الأربعون النووية، ٣",
  },
  {
    id: "naw3",
    text: "الدين النصيحة. قلنا: لمن؟ قال: لله ولكتابه ولرسوله ولأئمة المسلمين وعامتهم",
    en: "Religion is sincere counsel — to Allah, His Book, His Messenger, and all Muslims.",
    grade: "صحيح مسلم",
    ref: "الأربعون النووية، ٧",
  },
  {
    id: "naw4",
    text: "من حسن إسلام المرء تركه ما لا يعنيه",
    en: "Part of one's good Islam is leaving what does not concern them.",
    grade: "حسن",
    ref: "الأربعون النووية، ١٢",
  },
  {
    id: "naw5",
    text: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه",
    en: "None of you believes until they love for others what they love for themselves.",
    grade: "متفق عليه",
    ref: "الأربعون النووية، ١٣",
  },
  {
    id: "naw6",
    text: "الطهور شطر الإيمان",
    en: "Purity is half of faith.",
    grade: "صحيح مسلم",
    ref: "الأربعون النووية، ٢٣",
  },
  {
    id: "naw7",
    text: "ما نهيتكم عنه فاجتنبوه، وما أمرتكم به فأتوا منه ما استطعتم",
    en: "Avoid what I forbid; do what I command to your ability.",
    grade: "متفق عليه",
    ref: "الأربعون النووية، ٩",
  },
  {
    id: "naw8",
    text: "احفظ الله يحفظك، احفظ الله تجده تجاهك، إذا سألت فاسأل الله، وإذا استعنت فاستعن بالله",
    en: "Be mindful of Allah and He will protect you; ask of Allah alone.",
    grade: "حسن صحيح",
    ref: "الأربعون النووية، ١٩",
  },
];
