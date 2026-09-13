# app/

Application source (Next.js App Router).

```
app/
├── (sections)/       # route group shells
├── components/       # React components (views, library, overlays)
├── layout.tsx        # root <html lang="ar" dir="rtl">, skip link, toasts
├── page.tsx          # entry route
├── ServerClient.tsx  # generic SSR→client bridge used by pages
├── globals.css       # tokens + base styles
├── additions.css     # a11y, motion gates, forced-colors, print
└── lib/              # framework-free logic (see lib/README.md)
```

- **Import direction (strict):** `components/*` may import `lib/*`;
  `lib/*` never imports `components/*`; `schema.ts` imports nothing
  project-internal. `docs/HOW_TO_ADD_A_FEATURE.md` explains the happy
  path for a new feature.
- **No `console.*`** in this directory (lint rule); errors are suppressed
  or surfaced in UI, never logged.
- **Energy/power:** PWA registration and shell logic live here; see
  `public/sw.js` for the service worker.
