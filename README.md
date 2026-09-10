# ورد - رفيقك اليومي

متابعة العبادات والأوراد اليومية (Next.js 16 + React 19).

## التشغيل

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
```

## الملاحظات
- يُحفظ تقدم اليوم في `localStorage` بمفاتيح يومية (`wird-done-v2`, `wird-quran-pages-v2` بصيغة `{day, ...}`) فيتصفّر تلقائيًا كل يوم.
- زر «يوم جديد» في صفحة حسابي يصفّر إنجاز اليوم فعلًا.
- نسبة الإنجاز تُحسب فقط من الأوراد الأساسية (`sections + extras`) حتى لا تتضخم من الأزرار الإضافية.
- عدّاد «ورد القرآن اليومي» ديناميكي من `quranPages` بهدف `QURAN_GOAL_PAGES = 20`، وزر «أضف صفحة +» يزيد الصفحات فعلًا.
- التاريخ الهجري/الميلادي ديناميكي عبر `Intl`.
- البيانات ومساعدات التخزين في `app/lib/wird.ts` بدل تكديسها في `page.tsx`.
- كل الأزرار `type="button"` وأزرار التبديل تحمل `aria-pressed`.
- Node المقترح 22 (`.nvmrc`).
- الفحص عبر ESLint CLI بإعداد flat (`eslint.config.mjs`) لأن `next lint` أُزيل في Next 16، والبناء لم يعد يفحص تلقائيًا.
- الأمان: `next.config.ts` يضيف `X-Content-Type-Options` و`X-Frame-Options: DENY` و`Referrer-Policy` و`Permissions-Policy` ويخفي `X-Powered-By`.
- لا hydration errors: الحالة تبدأ بقيم ثابتة مطابقة لـ SSR ثم تُحمّل القيم المحفوظة بعد التركيب (`mounted`).
- بعد أي ترقية رئيسية شغّل `npm run clean` أولًا (كاش `.next` القديم كسر بناء 16 مرة).

