# app/

Application source (Next.js App Router).

```
app/
├── account/ calendar/ insights/ library/ recovery/ review/  # routes (one dir per page)
├── components/       # React components (views, library, overlays)
├── lib/              # framework-free logic (see lib/README.md)
├── layout.tsx        # root <html lang="ar" dir="rtl">, skip link, toasts
├── page.tsx          # entry route (Today)
├── fonts.ts          # self-hosted fonts (next/font)
├── robots.ts         # robots handler (never index app screens)
├── sitemap.ts        # public routes only
├── opengraph-image.tsx  # static brand OG image (no user data)
├── tokens.css styles.css additions.css views.css rescue.css library.css
└── lib/data/         # curated content source (see lib/data/README.md)
```

- **Import direction (strict):** `components/*` may import `lib/*`;
  `lib/*` never imports `components/*`; `schema.ts` imports nothing
  project-internal. `docs/HOW_TO_ADD_A_FEATURE.md` explains the happy
  path for a new feature.
- **No `console.*`** in this directory (lint rule); errors are suppressed
  or surfaced in UI, never logged.
- **Energy/power:** PWA registration and shell logic live here; see
  `public/sw.js` for the service worker.
