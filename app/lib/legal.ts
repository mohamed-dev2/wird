// Legal documents, single source for the in-app routes (STEP 8).
// SPDX-License-Identifier: Apache-2.0
//
// Bilingual section data rendered by app/terms + app/privacy. The root
// TERMS_OF_USE.md / PRIVACY_POLICY.md are the versioned records — keep
// them in sync (rule + legal-compliance.test.ts asserts version, date,
// and every heading matches on both sides).

export type LegalLang = "ar" | "en";
export type LegalSection = { h: Record<LegalLang, string>; ps: Record<LegalLang, string>[] };

export const TERMS_VERSION = "1.0.0";
export const TERMS_EFFECTIVE = "2026-09-14";
export const TERMS_TITLE = { ar: "شروط الاستخدام - وِرد", en: "Terms of Use - Wird" } as const;
export const PRIVACY_TITLE = { ar: "سياسة الخصوصية - وِرد", en: "Privacy Policy - Wird" } as const;

export const TERMS_SECTIONS: LegalSection[] = [
  {
    h: { ar: "اقرأ أولًا", en: "Read this first" },
    ps: [
      {
        ar: "وِرد متتبع شخصي يعمل على جهازك أولًا. لا حسابات، ولا خوادم تحفظ بياناتك، ولا سحابة.",
        en: "Wird is a local-first personal tracker. No accounts, no servers holding your data, no cloud.",
      },
    ],
  },
  {
    h: { ar: "1. ما هو وِرد", en: "1. What Wird is" },
    ps: [
      {
        ar: "رفيق يومي خاص للعادات الإسلامية: الصلوات والقرآن والأذكار والأهداف والتأملات والتحليلات والمرشد والمكتبة والخطط الخاصة. المزايا الموثقة هي الموجودة فعلًا.",
        en: "A private daily companion for Islamic habits: prayers, Quran, adhkar, goals, reflections, analytics, guide, library, and private plans. Documented features are what exists.",
      },
      {
        ar: "البرنامج مفتوح المصدر (Apache-2.0) والخدمة المستضافة شيء مختلف تحكمه هذه الشروط.",
        en: "The open-source software (Apache-2.0) and any hosted service are different things governed by these Terms.",
      },
    ],
  },
  {
    h: { ar: "2. محتواك ملكك", en: "2. Your content stays yours" },
    ps: [
      {
        ar: "أهدافك وملاحظاتك وسجلاتك ملكك ومحفوظة على جهازك فقط. لا ملكية لنا ولا إذن إلا للتشغيل المحلي والنسخ الذي تطلبه.",
        en: "Your goals, notes, and records are yours, stored only on your device. We claim no ownership and take only the permission needed to operate locally and back up at your request.",
      },
    ],
  },
  {
    h: { ar: "3. الاستخدام المقبول", en: "3. Acceptable use" },
    ps: [
      {
        ar: "يُمنع الوصول غير المصرح والاحتيال والبرمجيات الخبيثة ومهاجمة البنية وإساءة الواجهات ومخالفة القانون. أبحاث الأمان المشروعة والتطوير المفتوح مرحب بهما.",
        en: "No unauthorized access, fraud, malware, infrastructure attacks, API abuse, or illegal activity. Legitimate security research and open development are welcome.",
      },
      {
        ar: "المحتوى المخالف يُراجع بشريًا قبل أي إجراء — لا حذف تلقائي بالاتهام.",
        en: "Violating content is human-reviewed before action — no automatic deletion on accusation.",
      },
    ],
  },
  {
    h: { ar: "4. التوافر", en: "4. Availability" },
    ps: [
      {
        ar: "لا وعد بتوافر دائم: صيانة وأعطال وتحديثات بتأكيدك. بياناتك الأساسية تعمل دون إنترنت.",
        en: "No uptime promises: maintenance, outages, and updates (only with your confirmation). Your core data works offline.",
      },
    ],
  },
  {
    h: { ar: "5. الحسابات والحذف", en: "5. Accounts and deletion" },
    ps: [
      {
        ar: "لا حسابات فلا إيقاف ولا مشرف يقرأ بياناتك. الحذف: مسح مزدوج التأكيد مع نسخة إنقاذ، ثم مسح التشخيص.",
        en: "No accounts means nothing to suspend and no admin reading your data. Deletion: double-confirmed wipe with a rescue snapshot first, then diagnostics clear.",
      },
    ],
  },
  {
    h: { ar: "6. حدود الصحة والمحتوى", en: "6. Health and content limits" },
    ps: [
      {
        ar: "وِرد ليس خدمة طبية ولا يشخّص ولا يعد بنتائج ولا يغني عن المختصين. في الطوارئ اتصل برقم الطوارئ المحلي. المحتوى الشرعي من مصادر مراجعة وهو للمدارسة لا للفتوى.",
        en: "Wird is not medical care: no diagnosis, no promised outcomes, no substitute for professionals. In emergencies call your local emergency number. Religious content comes from reviewed sources, for study — not fatwas.",
      },
    ],
  },
  {
    h: { ar: "7. تغيير الشروط", en: "7. Changes" },
    ps: [
      {
        ar: "مؤرخة ومُرقمة، والتغييرات الجوهرية تُعلن في CHANGELOG وداخل التطبيق حيث أمكن دون تتبع.",
        en: "Versioned and dated; material changes are noted in the changelog and announced in-app where reachable without tracking.",
      },
    ],
  },
  {
    h: { ar: "8. المسؤولية", en: "8. Liability" },
    ps: [
      {
        ar: "كما في Apache-2.0: البرنامج كما هو دون ضمانات. أنت مسؤول عن نسخك الاحتياطية.",
        en: "Per Apache-2.0: the software is AS IS without warranties. You are responsible for your backups.",
      },
    ],
  },
  {
    h: { ar: "9. التواصل", en: "9. Contact" },
    ps: [
      {
        ar: "الأمان: GitHub Security Advisories (خاصة). غيرها: GitHub issue. لا بريد مخصص بعد.",
        en: "Security: GitHub Security Advisories (private). Everything else: GitHub issues. No dedicated email yet.",
      },
    ],
  },
];

export const PRIVACY_VERSION = "1.0.0";
export const PRIVACY_EFFECTIVE = "2026-09-14";

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    h: { ar: "الخلاصة", en: "In short" },
    ps: [
      {
        ar: "لا خادم فلا جمع. كل ما تسجله في التخزين المحلي لجهازك. لا يغادر شيء إلا محتوى تجلبه أو ملفات تصدّرها. لا حسابات ولا تحليلات خارجية ولا إعلانات ولا ذكاء سحابي ولا تتبع.",
        en: "No server means no collection. Everything you record lives in your device's local storage. Nothing leaves except content you fetch or files you export. No accounts, analytics SDKs, ads, cloud AI, or tracking.",
      },
    ],
  },
  {
    h: { ar: "1. البيانات وأين هي", en: "1. Data and where it lives" },
    ps: [
      {
        ar: "العادات والأهداف والقرآن والأذكار والتأملات والتحليلات والخطط والملفات — كلها محليًا. الجرد الكامل في DATA_INVENTORY.md.",
        en: "Habits, goals, Quran, adhkar, reflections, analytics, plans, profiles — all local. Full inventory: DATA_INVENTORY.md.",
      },
    ],
  },
  {
    h: { ar: "2. من يصل إليها", en: "2. Who can access it" },
    ps: [
      {
        ar: "أنت فقط خلف قفل جهازك (مع قفل الملف والخزنة اختياريًا). لا مشرف ولا أب ولا طرف ثالث — لا خلفية أصلًا.",
        en: "Only you, behind your device lock (plus optional profile PIN and vault). No admins, parents, or third parties — there is no backend.",
      },
    ],
  },
  {
    h: { ar: "3. ما الذي يغادر", en: "3. What leaves" },
    ps: [
      {
        ar: "فقط بنقرتك: معرفات محتوى (كتاب/تفسير/قارئ) ونسخ تبادر إليها وملفات تشخيص بإحصاءات. المصفوفة: NETWORK.md.",
        en: "Only on your tap: content identifiers, backups you start, and count-only diagnostics. Matrix: NETWORK.md.",
      },
    ],
  },
  {
    h: { ar: "4. الاحتفاظ والحذف", en: "4. Retention and deletion" },
    ps: [
      {
        ar: "أقصر احتفاظ عملي (DATA_RETENTION.md). احذف حيث أنشأت، أو امسح الملف، أو امسح الكل مع نسخة إنقاذ.",
        en: "Shortest practical retention (DATA_RETENTION.md). Delete where created, delete the profile, or wipe all with a rescue snapshot.",
      },
    ],
  },
  {
    h: { ar: "5. حقوقك", en: "5. Your rights" },
    ps: [
      {
        ar: "الوصول والتصحيح والحذف والتصدير — كلها أزرار محلية تعمل دون الاتصال بأحد.",
        en: "Access, correction, deletion, export — all local buttons that work without contacting anyone.",
      },
    ],
  },
  {
    h: { ar: "6. الصغار والتعافي", en: "6. Children and recovery" },
    ps: [
      {
        ar: "لا يُجمع أي عمر. التعافي محايد عمريًا وخاص افتراضيًا، ولا يُرسل لأب أو معلم أو أي طرف.",
        en: "No age is collected. Recovery is age-neutral and private by default, never sent to parents, teachers, or anyone.",
      },
    ],
  },
  {
    h: { ar: "7. النقل والاستضافة", en: "7. Transfers and hosting" },
    ps: [
      {
        ar: "الافتراضي: لا نقل. طلبات المحتوى تحمل معرفاته فقط. لا ضمانات إقليمية.",
        en: "Default: no transfers. Content requests carry content identifiers only. No region guarantees.",
      },
    ],
  },
  {
    h: { ar: "8. التغييرات والتواصل", en: "8. Changes and contact" },
    ps: [
      {
        ar: "مؤرخة ومُرقمة وتُعلن دون تتبع. التواصل عبر GitHub؛ ولا بريد مخصص بعد.",
        en: "Versioned, dated, announced without tracking. Contact via GitHub; no dedicated email yet.",
      },
    ],
  },
];
