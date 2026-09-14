# AGENTS.md — guidance for AI coding tools

Wird is a local-first Islamic habits PWA (Next.js 16 App Router, React 19,
TypeScript strict, `localStorage`-only). This file gives AI-assisted
contributors the same orientation a human senior dev would give you on
day one.

> Rule: AI-generated code is **reviewed and tested exactly like
> human-written code**. Using an AI tool is never an exemption from the
> gates, privacy rules, or content rules. When in doubt, prefer the
> smallest correct change.

## The five things to know first

1. **No backend, no accounts, no telemetry.** All data is per-profile
   localStorage. Do not add anything that sends data somewhere.
2. **Zero-loss storage.** Never delete/rename a `wird-*` key; migrate on
   read; corrupt records go to quarantine. Adding a key = schema entry +
   DOCUMENTATION.md §4 row + test.
3. **Tiny dependency surface.** Runtime deps are exactly
   `next react react-dom qrcode jsqr`. No new runtime deps. One-line
   fixes: implement locally, don't import a package.
4. **Hydration rule.** No storage reads during render. Static fallbacks
   first; mount effects after. The e2e hydration listener will fail on
   mismatch.
5. **Religious content is sacred.** Quran/hadith/adhkar text comes from
   reviewed datasets only. Never generate or machine-translate it. This is
   a hard reviewer block.

## Repo map (where things live)

- `app/lib/` — framework-free logic: `schema.ts` (validation/migration/
  quarantine), `wird.ts` (load/save), `history.ts`, `analytics.ts`,
  `companion.ts`/`coach.ts`, `crypto.ts` (backup/restore), `vault.ts`,
  `recovery.ts` (12-word BIP39 secret + salted verifier), `transfer.ts`/`lan.ts` (QR/LAN), content
  loaders (`quran.ts`, `tafsir.ts`, `audio.ts`, `hadith-full.ts`),
  `privacy.ts` (sensitivity + network manifest), `strings.ts` (AR/EN
  dictionary, ~968 keys), `i18n.ts`.
- `app/components/` — React UI. `app/components/views/` route views,
  `app/components/library/` Quran/hadith, `transfer.tsx` (export infra),
  `profile-scope.tsx`, `login-gate.tsx`.
- `app/` — routes: `/`(today), `/account`, `/calendar`, `/insights`,
  `/review`, `/library`, `/recovery`.
- `e2e/` — Playwright (serial; `npm run test:e2e` pins `--workers=1`).
- `public/data/` — generated bundles (only touched via pipeline).
- `docs/`, `DOCUMENTATION.md`, `SECURITY.md`, `GOVERNANCE.md` — ground
  truth for rules. `docs/README.md` is the index (start there).

## Conventions & forbidden patterns

- Conventional commits (`feat: fix: docs: style: test: chore: rebuild:`).
- No `console.*` anywhere in `app/` (logs leak user content).
- AR + EN keys for every user-facing string (parity is CI-enforced).
- Logical CSS properties; every animation behind `prefers-reduced-motion`;
  never color-only meaning.
- Strict TS: no `any`; `noUncheckedIndexedAccess` is on.
- No cross-profile state: profile switch does a full reload on purpose.

## Commands

```bash
npm ci                  # install (lockfile; never npm install on fresh clone)
npm run dev             # dev server on :3000
npm run diagnose        # typecheck + lint + format + docs + comments + css + boundaries + unit
npm run test            # vitest (unit)        npm run test:e2e   # playwright (serial)
npm run build           # prod build           npm run docs:check # keys/routes/parity/links/inventory/quality/version
npm run comments:check  # purpose headers      npm run css:check  # logical properties
npm run audit           # vulnerability check  npm run metrics     # cycles/god-modules report
```

## Before you commit anything

1. `npm run diagnose` green.
2. `npm run build` green.
3. If you touched behavior: `npm run test:e2e`.
4. Update CHANGELOG + relevant docs.
5. Never add deps, never weaken privacy, never touch religious data
   without the review process. If you're unsure about a rule, ask in the
   issue/PR instead of guessing.

## DCO

Commits must be signed-off (`git commit -s`) per the DCO model — see the
"Legal" section of CONTRIBUTING.md. No CLA.
