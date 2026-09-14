# Privacy Policy — Wird

**Version:** 1.0.0 · **Effective:** 2026-09-14 · **Status:** requires
professional legal review before any production launch
(see `docs/COMPLIANCE_MATRIX.md`). Plain language, not legal advice.

**Material changes:** none yet (initial version).

> **One paragraph:** Wird collects nothing to a server because there is
> no server. Everything you record lives in your browser's local storage
> on your device. Nothing leaves except three kinds of content you
> explicitly fetch (Quran/hadith/audio data coming _in_) and files you
> explicitly export or transfer. There are no accounts, no analytics
> SDKs, no ads, no cloud AI, no tracking.

## 1. What data exists, why, and where

The complete field inventory is `DATA_INVENTORY.md` (source of truth).
In short: habits, goals, Quran tracking, adhkar, reflections, reviews,
analytics inputs, companion memory, library marks, private plans,
profiles (name/avatar/PIN hash), and preferences — all in localStorage,
per-profile where applicable. Purpose is always the visible feature
itself; nothing is collected "because it might be useful later."

## 2. Who can access it

You, on your device, behind your device lock (plus optional profile PIN
and reflection vault). No administrator, maintainer, parent, teacher, or
third party has access — there is no backend to access it through, and
no master passwords, backdoors, or admin endpoints exist (asserted in
CI). Anyone borrowing an unlocked device can see the open screen:
use the profile lock, discreet plan names, generic notifications, and
quick exit.

## 3. What leaves the device

Only this, only on your tap: (a) content fetches that send nothing
personal — a book id to `cdn.jsdelivr.net`, a tafsir id + verse to
`api.quran.com`, a reciter id + verse to `everyayah.com`; (b) encrypted
or plain backups/QR/LAN transfers you start (AES-GCM, fresh salt+IV,
generic failure messages); (c) diagnostics/emergency files you export
(counts and metadata; quarantine raws are scrubbed before export).
Full matrix: `docs/NETWORK.md` + `app/lib/privacy.ts`. Everything else
— reflections, mood, plans, history, analytics — never leaves.

## 4. Retention and deletion

`DATA_RETENTION.md` governs: shortest practical retention, rolling caps
(guide/export/health logs, adhkar window, plan detail pruning),
session-only unlock flags. Delete any item where you made it; delete a
profile in profile manager; surgical-reset any dataset or wipe
everything in Account (double-confirmed, rescue snapshot downloads
first); clear forensics in data-health. Exported files are yours to
delete. There is no server copy to chase and no backup system retaining
your data beyond your own files.

## 5. Your rights (and the exact buttons)

Access: open the app — everything is visible where you put it; export a
JSON backup for a portable copy. Correction: edit in place everywhere
(states recompute from source data). Deletion: per-item, per-profile,
per-dataset, or full wipe as above. Consent withdrawal: there is no
behavioral consent to withdraw (no tracking); notification permission is
withdrawn in the browser; reminders/analytics/personalization toggles
in-app take effect immediately. Questions: see §9.

## 6. Children and recovery privacy

No age is collected (verified: no age/birth/school/phone/location keys
in the schema). Recovery is age-neutral and private by default — plans,
counters, setbacks, triggers, and notes never appear in profiles,
leaderboards, shares, notifications content, URLs, titles, or analytics,
and are never sent to parents, teachers, or any third party. Young users
get the same privacy as everyone else; parent access, if ever built,
will be child-created, opt-in, granular, revocable, with no master
password (roadmap: `docs/SAFETY.md`).

## 7. International transfers and hosting

Default: no transfer at all (local-first). When you fetch online
content or use the hosted build, ordinary internet routing applies;
content requests carry only content identifiers. Hosting is currently a
static deploy (see canonical domain in `.env.example`); region
guarantees are not made — review before production claims.

## 8. Changes and contact

Versioned here with effective date and material-changes note (top).
Material changes are also noted in `CHANGELOG.md` and announced in-app
where reachable without tracking. Contact: GitHub Security Advisories
(security/privacy, private by default) or a GitHub issue (general).
Dedicated privacy email is not yet configured — do not trust addresses
not published here by the project owner.

---

# سياسة الخصوصية — وِرد

**الإصدار:** 1.0.0 · **ساري من:** 2026-09-14 · **الحالة:** يتطلب مراجعة
قانونية متخصصة قبل أي إطلاق إنتاجي (انظر `docs/COMPLIANCE_MATRIX.md`).
صياغة مبسطة، وليست استشارة قانونية.

**التغييرات الجوهرية:** لا يوجد بعد (الإصدار الأول).

> **في فقرة:** وِرد لا يجمع شيئًا إلى خادم لأنه لا يوجد خادم. كل ما
> تسجله يعيش في التخزين المحلي لمتصفحك على جهازك. لا يغادر شيء إلا ثلاثة
> أنواع تبادر أنت إليها: محتوى تجلبه (بيانات قرآن/حديث/صوت _واردة_)،
> وملفات تصدّرها أو تنقلها. لا حسابات، ولا تحليلات خارجية، ولا إعلانات،
> ولا ذكاء سحابي، ولا تتبع.

## 1. ما البيانات الموجودة ولماذا وأين

الجرد الكامل في `DATA_INVENTORY.md` (مرجع الحقيقة). باختصار: العادات والأهداف وتتبع القرآن والأذكار
والتأملات والمراجعات ومدخلات التحليلات وذاكرة المرشد وعلامات المكتبة
والخطط الخاصة والملفات (الاسم/الصورة/بصمة الرقم) والتفضيلات — كلها في
التخزين المحلي، وحسب الملف الشخصي حيث ينطبق. الغرض دائمًا الميزة
الظاهرة نفسها؛ لا يُجمع شيء "لأنه قد يفيد لاحقًا."

## 2. من يستطيع الوصول إليها

أنت، على جهازك، خلف قفل جهازك (مع قفل الملف الاختياري وخزنة التأملات).
لا مشرف ولا مشرف صيانة ولا أب ولا معلم ولا طرف ثالث لديه وصول — فلا
خلفية يمكن الوصول عبرها، ولا كلمات سر رئيسية ولا أبواب خلفية ولا نقاط
وصول إدارية (مثبت في CI). من يستعير جهازًا مفتوحًا يرى الشاشة المفتوحة:
استخدم قفل الملف والأسماء المتخفية والإشعارات العامة والخروج السريع.

## 3. ما الذي يغادر الجهاز

هذا فقط، وبنقرتك أنت: (أ) جلب محتوى لا يرسل شيئًا شخصيًا — اسم كتاب
إلى `cdn.jsdelivr.net`، ومعرف تفسير + آية إلى `api.quran.com`، ومعرف
قارئ + آية إلى `everyayah.com`؛ (ب) نسخ مشفرة أو عادية/QR/محلية تبادر
أنت إليها (AES-GCM بملح وتهيئة جديدين، ورسائل فشل عامة)؛ (ج) ملفات
تشخيص/طوارئ تصدّرها أنت (إحصاءات وبيانات وصفية؛ تُمسح خامّات الحجر قبل
التصدير). المصفوفة الكاملة: `docs/NETWORK.md` + `app/lib/privacy.ts`.
كل ما عداها — التأملات والمزاج والخطط والسجل والتحليلات — لا يغادر أبدًا.

## 4. الاحتفاظ والحذف

يحكم `DATA_RETENTION.md`: أقصر احتفاظ عملي، وحدود متدحرجة (سجلات
المرشد والتصدير والصحة، ونافذة الأذكار، وتقليم تفاصيل الخطط)، وأعلام
الجلسة فقط. احذف أي عنصر حيث أنشأته؛ احذف الملف من مدير الملفات؛ أعد
ضبط أي مجموعة أو امسح الكل من الحساب (بتأكيد مزدوج، مع تنزيل نسخة إنقاذ
أولًا)؛ وامسح التشخيص من بطاقة صحة البيانات. الملفات المصدّرة ملكك
تحذفها بنفسك. لا نسخة خادم تُلاحَق ولا نظام نسخ يحتفظ ببياناتك بعد
ملفاتك.

## 5. حقوقك (والأزرار الدقيقة)

الوصول: افتح التطبيق — كل شيء ظاهر حيث وضعته؛ وصدّر نسخة JSON لنسخة
محمولة. التصحيح: عدّل في مكانه (والحالات تُعاد حسابها من المصدر).
الحذف: لكل عنصر ولكل ملف ولكل مجموعة وللكل كما أعلاه. سحب الموافقة: لا
تتبع سلوكي يُسحب (لا يوجد)؛ إذن الإشعارات يُسحب من المتصفح؛ ومفاتيح
التذكيرات والتحليلات والتخصيص داخل التطبيق فورية. الأسئلة: انظر §9.

## 6. خصوصية الصغار والتعافي

لا يُجمع أي عمر (مثبت: لا مفاتيح عمر/ميلاد/مدرسة/هاتف/موقع في المخطط).
التعافي محايد عمريًا وخاص افتراضيًا — الخطط والعدادات والانتكاسات
والمحفزات والملاحظات لا تظهر في الملفات أو التصنيفات أو المشاركات أو
محتوى الإشعارات أو الروابط أو العناوين أو التحليلات، ولا تُرسل لأب أو
معلم أو أي طرف ثالث. الصغار لهم نفس خصوصية الجميع؛ ووصول الأبوين، إن
بُني يومًا، سيكون من إنشاء الطفل واختياره وحبيبي الصلاحيات وقابلًا
للإلغاء، دون كلمة سر رئيسية (خارطة الطريق: `docs/SAFETY.md`).

## 7. النقل الدولي والاستضافة

الافتراضي: لا نقل أصلًا (محلي أولًا). عند جلب محتوى أو استخدام النسخة
المستضافة تنطبق توجيهات الإنترنت العادية؛ وطلبات المحتوى تحمل معرفات
المحتوى فقط. الاستضافة نشر ثابت حاليًا (انظر النطاق المعتمد في
`.env.example`)؛ ولا ضمانات إقليمية — تُراجع قبل ادعاءات الإنتاج.

## 8. التغييرات والتواصل

مؤرخة ومُرقمة هنا مع ملاحظة التغييرات الجوهرية أعلاه. التغييرات الجوهرية
تُذكر أيضًا في `CHANGELOG.md` وتُعلن داخل التطبيق حيث يمكن الوصول دون
تتبع. التواصل: GitHub Security Advisories (للأمان/الخصوصية، خاص
افتراضيًا) أو GitHub issue (عام). لا بريد خصوصية مخصص بعد — لا تثق
بعناوين غير منشورة هنا من مالك المشروع.
