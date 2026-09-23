# Features

Every major feature has its own documentation. For features without their
own dedicated file, the authoritative docs are noted here.

Use this index when you need to understand a feature before modifying it.

| Feature                                | Primary doc                                                                                                                          | Key modules                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| **Analytics / Insights**               | [analytics.md](analytics.md) · [ANALYTICS.md](../ANALYTICS.md)                                                                       | `app/lib/analytics.ts`, `app/lib/history.ts`                                        |
| **Coach / Brief**                      | [coach.md](coach.md) · [COMPANION.md](../COMPANION.md)                                                                               | `app/lib/coach.ts`                                                                  |
| **Return system / Adaptive guide**     | [return-system.md](return-system.md) · [COMPANION.md](../COMPANION.md)                                                               | `app/lib/companion.ts`                                                              |
| **Quran reader**                       | [quran.md](quran.md)                                                                                                                 | `app/lib/quran.ts`, `app/lib/tafsir.ts`, `app/components/library/quran-reader.tsx`  |
| **Hadith library**                     | [hadith.md](hadith.md)                                                                                                               | `app/lib/hadith-full.ts`, `app/components/library/hadith-library.tsx`               |
| **Adhkar**                             | [adhkar.md](adhkar.md)                                                                                                               | `app/components/views/adhkar.tsx`, `app/lib/wird.ts`                                |
| **Goals / Habits / Review**            | [goals-habits-review.md](goals-habits-review.md)                                                                                     | `app/lib/wird.ts`, `app/lib/history.ts`, `app/components/views/review-tab.tsx`      |
| **Private plans (self-management)**    | [private-recovery.md](private-recovery.md)                                                                                           | `app/lib/private-plans.ts`, `app/components/views/private-plans.tsx`                |
| **Deen journey (levels/gamification)** | [deen.md](deen.md)                                                                                                                   | `app/lib/deen.ts`, `app/lib/deen-catalog.ts`, `app/components/views/deen-today.tsx` |
| **Storage / Schema**                   | [storage.md](storage.md) · [VERSIONING.md](../VERSIONING.md)                                                                         | `app/lib/schema.ts`, `app/lib/crypto.ts`                                            |
| **Privacy**                            | [privacy.md](privacy.md) · [PRIVACY_ARCHITECTURE.md](../PRIVACY_ARCHITECTURE.md) · [NETWORK.md](../NETWORK.md)                       | `app/lib/privacy.ts`, `app/lib/vault.ts`                                            |
| **Security**                           | [security.md](security.md) · [SECURITY.md](../../SECURITY.md)                                                                        | `app/lib/crypto.ts`, `app/lib/profiles.ts`, `app/components/login-gate.tsx`         |
| **Localization**                       | [localization.md](localization.md) · [LOCALIZATION.md](../LOCALIZATION.md) · [HOW_TO_ADD_A_LANGUAGE.md](../HOW_TO_ADD_A_LANGUAGE.md) | `app/lib/strings.ts`, `app/lib/i18n.ts`                                             |
| **Accessibility**                      | [accessibility.md](accessibility.md) · [ACCESSIBILITY.md](../ACCESSIBILITY.md)                                                       | `additions.css`, `scripts/check-css.mjs`                                            |
| **Testing**                            | [TESTING.md](../TESTING.md)                                                                                                          | `app/lib/__tests__/`, `e2e/`                                                        |
