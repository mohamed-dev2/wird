# Terms of Use — Wird

**Version:** 1.0.0 · **Effective:** 2026-09-14 · **Status:** requires
professional legal review before any production launch
(see `docs/COMPLIANCE_MATRIX.md`). This is a plain-language foundation,
not legal advice.

**Material changes:** none yet (initial version).

> **Read this first:** Wird is a local-first personal tracker. There are
> no accounts, no servers holding your data, and no cloud backend. Most
> of these Terms therefore describe what Wird _does not_ do — that is
> intentional, and it is verified by the architecture
> (`docs/ARCHITECTURE.md`, `docs/PRIVACY_ARCHITECTURE.md`).

## 1. What Wird is

Wird ("the app") is a private, offline-first daily companion for Islamic
habits: prayers, Quran reading and memorization marks, adhkar, duas,
goals, challenges, reflections, analytics over your own history, an
adaptive guide, a library (Quran, hadith, tafsir, audio, learning
paths), and optional private self-management plans. Features listed in
`DOCUMENTATION.md` §3 are what exists — nothing described as future or
planned elsewhere is promised here.

The open-source software (Apache-2.0, see `LICENSE`) and any hosted
service (e.g. `https://wird-gamma.vercel.app/`) are different things:
the license governs the code; these Terms govern use of the service.
Where they overlap, the more protective rule for the user applies.

## 2. Your content stays yours

Goals, notes, reflections, habit records, recovery records, and settings
are created by you, owned by you, and stored only on your device. Wird
claims no ownership and takes only the permission needed to operate
locally (store, display, back up at your explicit request). Export
formats: JSON backups (plain/encrypted), QR snapshot, LAN transfer,
emergency and diagnostics files — all generated on-device, all
user-initiated.

## 3. Acceptable use

Do not: access others' devices or data without permission; steal
credentials; distribute malware; attack infrastructure (including ours
or our CDN/hosting providers); abuse APIs; attempt to bypass PIN,
vault, or lockout protections on devices you do not own; harass;
defraud; or break the law. Legitimate security research, open-source
development, accessibility testing, and normal automated testing are
welcome and are not abuse.

Content you enter must be lawful and must not infringe others' rights.
Reports are reviewed humanly before action (see `GOVERNANCE.md`);
nothing is auto-deleted on accusation.

## 4. Availability — no promises

Wird does not promise uninterrupted availability. Expect: maintenance
windows, hosting/CDN/provider outages, network failures, update
rollouts (applied only with your confirmation in-app), and emergency
shutdowns. Offline-first design means your data and core features keep
working without internet; optional online content (extra tafsirs,
full-book editions, audio) degrades to calm retry states.

## 5. Accounts, suspension, deletion

There are no accounts, so there is nothing to suspend and no
administrator who can read your data — your device PIN/OS lock is the
access boundary. "Delete my account" means: Account → backup page →
erase (double-confirmed, rescue snapshot downloads first), then clear
diagnostics in data-health. Quarantine/health forensic stores survive a
wipe until explicitly cleared; backups you exported are files you own
and must delete yourself.

## 6. Health, recovery, and religious content limits

Wird is not a medical service, not a therapist, and not a scholar. It
does not diagnose addiction, illness, or disorders; never promises
recovery, spiritual, or behavioral outcomes; and never replaces
professional or scholarly guidance. In a medical emergency, contact
your local emergency number — the app says this in-product and cannot
intervene. Religious texts come from reviewed sources (see
`CONTENT_RIGHTS.md`); translations and explanations are labeled as
such and are study aids, not fatwas.

## 7. Changes to these Terms

Versioned here with effective date and a material-changes note at the
top. Material changes will additionally be noted in `CHANGELOG.md` and,
where the app can reach you without tracking (in-app notice on launch),
announced there. Continued use after the effective date means acceptance.

## 8. Liability and warranty

As stated in `LICENSE` (Apache-2.0 §§7–8): the software is provided
"AS IS", without warranties, and contributors are not liable for
damages from its use. You are responsible for your backups (export
regularly; verify restores with `/recovery`).

## 9. Contact and reports

Security: GitHub Security Advisories on the project repository
(private by default). Copyright/abuse: open a GitHub issue or pull
request (see `GOVERNANCE.md` for the review process). Dedicated email
addresses are not yet configured; do not trust any address claiming to
be Wird unless it is published in this file by the project owner.

---

# شروط الاستخدام — وِرد

**الإصدار:** 1.0.0 · **ساري من:** 2026-09-14 · **الحالة:** يتطلب مراجعة
قانونية متخصصة قبل أي إطلاق إنتاجي (انظر `docs/COMPLIANCE_MATRIX.md`).
هذه صياغة مبسطة، وليست استشارة قانونية.

**التغييرات الجوهرية:** لا يوجد بعد (الإصدار الأول).

> **اقرأ أولًا:** وِرد متتبع شخصي يعمل على جهازك أولًا. لا حسابات، ولا
> خوادم تحفظ بياناتك، ولا سحابة. معظم هذه الشروط تصف ما لا يفعله وِرد —
> وهذا مقصود، والبنية تثبته (`docs/ARCHITECTURE.md`).

## 1. ما هو وِرد

رفيق يومي خاص للعادات الإسلامية: الصلوات، وقراءة القرآن وعلامات الحفظ،
والأذكار، والأدعية، والأهداف، والتحديات، والتأملات، وتحليلات لسجلك أنت،
ومرشد تكيفي، ومكتبة (قرآن، حديث، تفسير، صوت، مسارات)، وخطط خاصة
اختيارية. المزايا المذكورة في `DOCUMENTATION.md` §3 هي الموجود فعلًا —
لا نعد بأي مزايا مستقبلية هنا.

البرنامج مفتوح المصدر (Apache-2.0، انظر `LICENSE`) والخدمة المستضافة
(مثل `https://wird-gamma.vercel.app/`) شيئان مختلفان: الرخصة تحكم
الكود، وهذه الشروط تحكم استخدام الخدمة. عند التعارض تُطبق القاعدة
الأكثر حماية للمستخدم.

## 2. محتواك ملكك

الأهداف والملاحظات والتأملات وسجلات العادات وخطط التعافي والإعدادات من
إنشائك وملكك ومحفوظة على جهازك فقط. لا يدّعي وِرد أي ملكية، ولا يأخذ
إلا الإذن اللازم للتشغيل محليًا (الحفظ والعرض والنسخ الاحتياطي بطلب
صريح منك). صيغ التصدير: نسخ JSON (عادية/مشفرة)، ورموز QR، والنقل
المحلي، وملفات الطوارئ والتشخيص — كلها تُنتَج على جهازك وبمبادرتك.

## 3. الاستخدام المقبول

يُمنع: الوصول لأجهزة الآخرين أو بياناتهم دون إذن؛ سرقة بيانات الدخول؛
نشر البرمجيات الخبيثة؛ مهاجمة البنية التحتية؛ إساءة استخدام الواجهات؛
محاولة تجاوز القفل على أجهزة لا تملكها؛ المضايقة؛ الاحتيال؛ ومخالفة
القانون. أبحاث الأمان المشروعة وتطوير المصدر المفتوح واختبار الوصول
والاختبار الآلي العادي مرحب بها وليست إساءة.

المحتوى الذي تدخله يجب أن يكون قانونيًا وغير منتهك لحقوق الآخرين.
البلاغات تُراجع بشريًا قبل أي إجراء (انظر `GOVERNANCE.md`)؛ لا حذف
تلقائي بمجرد الاتهام.

## 4. التوافر — بلا وعود

لا يعد وِرد بتوافر دائم. توقع: نوافذ صيانة، وأعطال الاستضافة والشبكات،
وتحديثات (لا تُطبق إلا بتأكيدك داخل التطبيق)، وإيقافات طارئة. التصميم
الذي يعمل دون إنترنت يعني بقاء بياناتك ومزاياك الأساسية عاملة؛ والمحتوى
الاختياري عبر الشبكة يتحول لحالات انتظار هادئة.

## 5. الحسابات والإيقاف والحذف

لا توجد حسابات، فلا شيء يُعلَّق ولا مشرف يقرأ بياناتك — قفل جهازك هو
حد الوصول. "حذف حسابي" يعني: الحساب ← النسخ الاحتياطي ← المسح (بتأكيد
مزدوج، مع تنزيل نسخة إنقاذ أولًا)، ثم مسح التشخيص. تبقى مخازن الحجر
الصحي حتى مسحها الصريح؛ والنسخ التي صدّرتها ملفات تملكها أنت وتحذفها
بنفسك.

## 6. حدود الصحة والتعافي والمحتوى الشرعي

وِرد ليس خدمة طبية ولا معالجًا ولا عالمًا. لا يشخّص إدمانًا أو مرضًا أو
اضطرابًا؛ ولا يعد بنتائج علاجية أو روحية أو سلوكية؛ ولا يغني عن المختصين
وأهل العلم. في الطوارئ الطبية اتصل برقم الطوارئ المحلي — والتطبيق يقول
هذا داخل المنتج ولا يستطيع التدخل. النصوص الشرعية من مصادر مراجعة
(انظر `CONTENT_RIGHTS.md`)؛ والترجمات والشروح موسومة كذلك وهي للمدارسة،
وليست فتاوى.

## 7. تغيير هذه الشروط

مؤرخة ومُرقمة هنا مع ملاحظة التغييرات الجوهرية أعلاه. التغييرات الجوهرية
تُذكر أيضًا في `CHANGELOG.md` وتُعلن داخل التطبيق عند الإطلاق حيث أمكن
دون تتبع. الاستمرار بعد تاريخ السريان يعني القبول.

## 8. المسؤولية والضمان

كما في `LICENSE` (Apache-2.0 §§7–8): البرنامج "كما هو" دون ضمانات، ولا
مسؤولية على المساهمين عن أضرار استخدامه. أنت مسؤول عن نسخك الاحتياطية
(صدّر بانتظام، وتحقق من الاسترجاع عبر `/recovery`).

## 9. التواصل والبلاغات

الأمان: GitHub Security Advisories في مستودع المشروع (خاصة افتراضيًا).
حقوق النشر/إساءة الاستخدام: افتح issue أو pull request (انظر
`GOVERNANCE.md` لآلية المراجعة). لا توجد عناوين بريد مخصصة بعد؛ لا تثق
بأي عنوان يدّعي تمثيل وِرد ما لم يُنشر هنا من مالك المشروع.
