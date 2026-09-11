# ورد — رفيقك اليومي | Wird Daily Tracker

[![CI](https://github.com/mohamed-dev2/wird/actions/workflows/ci.yml/badge.svg)](https://github.com/mohamed-dev2/wird/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![PWA ready](https://img.shields.io/badge/PWA-ready-14725d)](./public/manifest.webmanifest)

Daily Islamic habits tracker — Next.js 16 + React 19, **100% on-device** (localStorage only, no database, no accounts).

## التشغيل | Run

```bash
npm install
npm run dev        # dev server (Turbopack)
npm run build      # production build
npm run start      # serve production
npm run lint       # ESLint flat config, zero warnings
npm run typecheck  # tsc --noEmit (strict + noUncheckedIndexedAccess)
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright e2e (production server)
npm run format     # Prettier write
npm run clean      # wipe .next + tsbuildinfo (run after major upgrades)
```

Node 22 (`.nvmrc`). CI (`.github/workflows/ci.yml`) runs typecheck → lint → unit → e2e → build → audit.

## المزايا | Features

- **اليوم**: صلوات وأوراد، خطة إنقاذ، جلسة قرآن بمؤقت، بطاقات الجمعة/الوتر، عادات مخصصة، تحديات، عهود، ركن الصغار، قضاء الفوائت، الصيام، كسر العادات، وضع رمضان التلقائي.
- **الحصاد** (`/review`): مراجعة ليلية tri-state مع درجة ومزاج وامتنان — تُحفظ كسجل يومي غير قابل للعبث.
- **التقدّم** (`/insights`): إحصاءات حقيقية من سجلك، رادار التوازن، مدرب خبير (إهمال/كفاءة/رفع/مخاطر)، حصاد العام الهجري، شريط ٣٠ يومًا.
- **المكتبة** (`/library`): قارئ قرآن كامل دون إنترنت (بحث، علامات، حفظ)، مختارات الكتب التسعة + الأربعون النووية، مسارات علمية ٤ مستويات × ٨ علوم، لوحة الأحلام.
- **العودة**: شاشة رجوع متدرجة الرحمة بعد الغياب + سلّم تنبيهات محلية + تسجيل صوتي + مواقيت يدوية بعدّادات حية + وضع المسجد.
- **الخصوصية**: تصدير عادي/مشفر (AES-GCM)، استيراد، مسح شامل — صفحة حسابي.
- **التجربة**: عربي/إنجليزي (RTL/LTR)، فاتح/ليلي/أسود، PWA (تثبيت + عمل دون إنترنت)، حركات هادئة تحترم تقليل الحركة، طباعة للتقارير.

## البنية | Structure

```
app/
  page.tsx              اليوم (Today)
  review|insights|calendar|library|account  one route per tab
  components/
    wird-store.tsx      shared state (mount-hydration pattern, no SSR mismatch)
    shell.tsx           sidebar/nav/header/zikr
    views/              tab views (props-driven)
    library/            quran/hadith/paths/dreams
  lib/
    wird.ts             habits data + storage helpers (daily-keyed, self-resetting)
    history.ts coach.ts review analytics engine (pure, unit-tested)
    crypto.ts           AES-GCM backup, quran.ts search, prayer.ts, notify.ts, voice.ts
    strings.ts          420+ key AR/EN dictionary (religious content stays Arabic)
    data/               surahs, hadith selections, learning paths, return verses
public/data/quran-uthmani.min.json  offline mushaf (~1.4MB, lazy-fetched)
e2e/                    Playwright smoke (prod server — dev HMR is sandbox-flaky)
```

## الأمان | Security

Security headers + production-only strict CSP (`next.config.ts`), `X-Powered-By` hidden, mic allowed for self (voice logging), `npm audit` clean, encrypted backups, one-tap wipe, input-safe rendering.

## ملاحظات تقنية

- الحالة تبدأ بقيم ثابتة مطابقة لـ SSR ثم تُحمّل بعد التركيب — لا hydration errors.
- مفاتيح التخزين يومية (`{day, ...}`) فتتصفّر تلقائيًا؛ السجل `wird-history-v1` يحتفظ بأرشيف per-deed للتحليل.
- بعد أي ترقية رئيسية: `npm run clean` أولًا.
