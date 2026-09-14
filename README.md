# ورد — رفيقك اليومي | Wird Daily Tracker

[![CI](https://github.com/mohamed-dev2/wird/actions/workflows/ci.yml/badge.svg)](https://github.com/mohamed-dev2/wird/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![PWA ready](https://img.shields.io/badge/PWA-ready-14725d)](./public/manifest.webmanifest)

Daily Islamic habits tracker — Next.js 16 + React 19, **100% on-device** (localStorage only, no database, no accounts).

**Wird** is a private, offline-first daily worship companion with an adaptive
guide that understands where you are in your journey. Nothing leaves the
device except user-initiated transfers. No analytics SDKs, no tracking, no
cloud AI.

## التشغيل | Run

```bash
npm ci             # exact lockfile (never npm install on a fresh clone)
npm run dev        # dev server (Turbopack)
npm run build      # production build
npm run start      # serve production
npm run lint       # ESLint flat config, zero warnings
npm run typecheck  # tsc --noEmit (strict + noUncheckedIndexedAccess)
npm run test       # Vitest unit tests (232)
npm run test:e2e   # Playwright e2e (production server)
npm run format     # Prettier write
npm run docs:check # verify docs match code (keys + routes + parity + links + inventory + quality + version)
npm run comments:check # every source file has a purpose header
npm run css:check # logical properties (RTL) + !important budget
npm run clean      # wipe .next + tsbuildinfo (run after major upgrades)
```

Node 22 (`.nvmrc`). CI (`.github/workflows/ci.yml`) runs typecheck → lint → format:check → unit → e2e → build → docs:check → comments:check → css:check → boundaries:check → metrics → audit.

## المزايا | Features

- **اليوم**: صلوات وأوراد، خطة إنقاذ، جلسة قرآن بمؤقت، بطاقات الجمعة/الوتر، عادات مخصصة، تحديات، عهود، ركن الصغار، قضاء الفوائت، الصيام، كسر العادات، وضع رمضان التلقائي.
- **المرشد التكيفي**: بطاقة واحدة ذكية (26 حالة: عودة، تعثر، زخم، إرهاق…) مع آية/حديث موثّقين من مجموعات محلية، ومسار توبة اختياري بعد الغياب الطويل — دون أحكام ودون ادعاء معرفة القلوب.
- **الحصاد** (`/review`): مراجعة ليلية tri-state مع درجة ومزاج وامتنان — تُحفظ كسجل يومي، مع سطر سياق ليلي.
- **التقدّم** (`/insights`): طبقات تحليلية محلية قابلة للتفسير (اتجاهات، عبادة-عبادة، قرآن وحفظ، أذكار، أهداف وتحديات وعهود، عودات واستمرارية، خريطة نشاط، مراجعة شهرية/سنوية، إنجازات) + مدى مخصص للمقارنة — لا بيانات مفتعلة أبدًا.
- **المكتبة** (`/library`): قارئ قرآن كامل دون إنترنت (بحث، علامات، حفظ بتاريخ مراجعة)، مختارات الكتب التسعة + الأربعون النووية، مسارات علمية ٤ مستويات × ٨ علوم، لوحة الأحلام.
- **العودة**: شاشة رجوع متدرجة حسب عمق الغياب (3/7/14/30/90 يومًا) + سلّم تنبيهات محلية + مواقيت يدوية بعدّادات حية + وضع المسجد.
- **الخصوصية**: تصدير عادي/مشفر (AES-GCM ببيان سلامة)، استيراد ذرّي متحقق، مسح شامل بتأكيد مزدوج — صفحة حسابي.
- **الاسترداد** (`/recovery`): بيئة طوارئ مستقلة لفحص التخزين والتصدير الطارئ والاسترجاع.
- **أمان إضافي (اختياري)**: رمز إكراه يفتح حسابًا فارغًا، خزنة مشفرة للتأملات (غير مستحسنة — موثقة المخاطر)، إخفاء الأسماء على القفل، تعتيم التبويب المخفي، مسح الحافظة تلقائيًا.
- **التجربة**: عربي/إنجليزي (RTL/LTR، 975 مفتاحًا بفحص تكافؤ)، فاتح/ليلي/أسود، PWA (تثبيت + عمل دون إنترنت)، حركات هادئة تحترم تقليل الحركة، طباعة للتقارير.

## البنية | Structure

```
app/
  page.tsx              اليوم (Today + companion card + return screen)
  review|insights|calendar|library|account|recovery  one route per tab
  components/
    wird-store.tsx      shared state (mount-hydration pattern, no SSR mismatch)
    shell.tsx           sidebar/nav/header/zikr
    companion.tsx       adaptive card + verified verse/hadith blocks
    analytics-layers.tsx  insights layers (progressive disclosure)
    views/              tab views (props-driven)
    library/            quran/hadith/paths/dreams
  lib/
    wird.ts             habits data + storage helpers (daily-keyed, self-resetting)
    history.ts coach.ts companion.ts analytics.ts content.ts
                        review/coach/guidance/analytics engines (pure, unit-tested)
    schema.ts           versioned integrity layer (envelopes, quarantine, migrations)
    crypto.ts           AES-GCM backup + atomic validated import, transfer.ts QR, lan.ts WebRTC
    diagnostics.ts      local-only health snapshots + emergency export
    strings.ts          975-key AR/EN dictionary (religious content stays Arabic)
    data/               surahs, hadith selections, learning paths, return verses
  public/data/          offline mushaf, Clear-Quran EN, Jalalayn, Nawawi, BIP39 (~4.7MB lazy)
  e2e/                  Playwright suites (prod server — dev HMR is sandbox-flaky)
  docs/ANALYTICS.md     analytics methodology (formulas, thresholds, confidence)
  docs/ARCHITECTURE.md  storage/data-flow conventions, zero-loss contract
  docs/COMPONENTS.md    component inventory + ownership
  docs/README.md        full documentation index
  docs/API.md           internal API/contracts, storage surface
  docs/DOMAIN_MODELS.md canonical data shapes + persistence matrix
  docs/VERSIONING.md    versioning, migrations, deprecation policy
  docs/PRIVACY_ARCHITECTURE.md  how privacy is enforced structurally
  docs/NETWORK.md       exhaustive network-request matrix
  docs/adr/             architecture decision records (ADR-001…006)
  docs/features/        per-feature documentation (analytics, coach, return system, …)
  docs/HOW_TO_ADD_A_FEATURE.md  new-feature walkthrough
  docs/HOW_TO_ADD_A_LANGUAGE.md add/update a UI language
  docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md  sourced religious-content guide
  SECURITY.md           threat model + vulnerability reporting
  GOVERNANCE.md         decision process + ADR workflow
  GOOD_FIRST_ISSUES.md  beginner-friendly contribution suggestions
  CODEOWNERS            subsystem ownership
  .env.example          optional environment variables (no secrets)
```

## الأمان | Security

Security headers + production-only strict CSP (`next.config.ts`), `X-Powered-By` hidden, camera/mic/geolocation denied by policy (voice logging removed — cloud transcription couldn't stay private), `npm audit` clean, encrypted backups with fresh salt/IV per file, profile-id scoping + quarantine purge on delete, one-tap wipe, input-safe rendering. Details: `DOCUMENTATION.md` §9.

## الخصوصية | Privacy

كل البيانات في `localStorage` على جهازك — السجل، المزاج، التأملات، الأهداف،
سجل الغياب، حالة المرشد، نتائج التحليلات: لا شيء يغادر الجهاز إلا بنسخة
احتياطية أو نقل تبادر به أنت صراحة (وملخص التشخيص العددي فقط عند التصدير
الطوعي). لا تحليلات خارجية، لا تتبع، لا ذكاء سحابي.

## ملاحظات تقنية

- الحالة تبدأ بقيم ثابتة مطابقة لـ SSR ثم تُحمّل بعد التركيب — لا hydration errors.
- مفاتيح التخزين يومية (`{day, ...}`) فتتصفّر تلقائيًا؛ السجل `wird-history-v1` يحتفظ بأرشيف per-deed للتحليل.
- طبقة السلامة (`schema.ts`) تقبل البيانات القديمة العارية وتهاجرها دون مسح، وتحجر التالف بدل إسقاطه.
- التحليلات حتمية ومفسّرة: لا اتجاه دون عتبة، لا نمط أيام دون عينات كافية، ولا دقة مفتعلة.
- بعد أي ترقية رئيسية: `npm run clean` أولًا.

## التوثيق الكامل

- `DOCUMENTATION.md` — الدليل الشامل (المعمارية، البيانات، الأمان، الجودة).
- `docs/ANALYTICS.md` — منهجية التحليلات بالتفصيل.
- `docs/COMPANION.md` — كيف يتخذ المرشد قراراته.
- `docs/PRIVACY.md` — نموذج الخصوصية وما الذي يغادر الجهاز ومتى.
- `docs/TESTING.md` — تشغيل البوابات وكتابة الاختبارات.
- `docs/ARCHITECTURE.md` — بنية التخزين ومسار البيانات.
- `docs/COMPONENTS.md` — جرد المكونات ومسؤولياتها.
- `CONTRIBUTING.md` — دليل المساهمة والبوابات.
- `docs/README.md` — فهرس التوثيق الكامل.
- `docs/PRIVACY_ARCHITECTURE.md` — كيف تُفرَض الخصوصية هيكليًا.
- `docs/NETWORK.md` — مصفوفة طلبات الشبكة الكاملة.
- `docs/VERSIONING.md` — الإصدارات، الهجرات، سياسة الإيقاف.
- `docs/HOW_TO_ADD_RELIGIOUS_CONTENT.md` — إضافة محتوى شرعي موثّق.
- `GOOD_FIRST_ISSUES.md` — مسائل مناسبة للانضمام.
