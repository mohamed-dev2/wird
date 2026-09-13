# Features

Every major feature has its own documentation. For features without their
own dedicated file, the authoritative docs are noted here.

Use this index when you need to understand a feature before modifying it.

| Feature                            | Primary doc                                                                                                                          | Key modules                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **Analytics / Insights**           | [analytics.md](analytics.md) · [ANALYTICS.md](../ANALYTICS.md)                                                                       | `lib/analytics.ts`, `lib/history.ts`                                   |
| **Coach / Brief**                  | [coach.md](coach.md) · [COMPANION.md](../COMPANION.md)                                                                               | `lib/coach.ts`                                                         |
| **Return system / Adaptive guide** | [return-system.md](return-system.md) · [COMPANION.md](../COMPANION.md)                                                               | `lib/companion.ts`                                                     |
| **Quran reader**                   | [quran.md](quran.md)                                                                                                                 | `lib/quran.ts`, `lib/tafsir.ts`, `components/library/quran-reader.tsx` |
| **Hadith library**                 | [hadith.md](hadith.md)                                                                                                               | `lib/hadith-full.ts`, `components/library/hadith-library.tsx`          |
| **Adhkar**                         | [adhkar.md](adhkar.md)                                                                                                               | `components/views/adhkar.tsx`, `lib/wird.ts`                           |
| **Goals / Habits / Review**        | [goals-habits-review.md](goals-habits-review.md)                                                                                     | `lib/wird.ts`, `lib/history.ts`, `components/views/review.tsx`         |
| **Storage / Schema**               | [storage.md](storage.md) · [VERSIONING.md](../VERSIONING.md)                                                                         | `lib/schema.ts`, `lib/crypto.ts`                                       |
| **Privacy**                        | [privacy.md](privacy.md) · [PRIVACY_ARCHITECTURE.md](../PRIVACY_ARCHITECTURE.md) · [NETWORK.md](../NETWORK.md)                       | `lib/privacy.ts`, `lib/vault.ts`                                       |
| **Security**                       | [security.md](security.md) · [SECURITY.md](../../SECURITY.md)                                                                        | `lib/crypto.ts`, `lib/profiles.ts`, `components/login-gate.tsx`        |
| **Localization**                   | [localization.md](localization.md) · [LOCALIZATION.md](../LOCALIZATION.md) · [HOW_TO_ADD_A_LANGUAGE.md](../HOW_TO_ADD_A_LANGUAGE.md) | `lib/strings.ts`, `lib/i18n.ts`                                        |
| **Accessibility**                  | [accessibility.md](accessibility.md) · [ACCESSIBILITY.md](../ACCESSIBILITY.md)                                                       | `additions.css`, `scripts/check-css.mjs`                               |
| **Testing**                        | [TESTING.md](../TESTING.md)                                                                                                          | `app/lib/__tests__/`, `e2e/`                                           |
