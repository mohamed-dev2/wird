# app/lib/

Framework-free logic. Everything here is testable with vitest without a
browser, and every module documents its persistence + privacy footprint
(see API.md, DOMAIN_MODELS.md, PRIVACY_ARCHITECTURE.md).

| module                                                   | responsibility                               | network                            | storage                 |
| -------------------------------------------------------- | -------------------------------------------- | ---------------------------------- | ----------------------- |
| `crypto.ts`                                              | backup build/restore/encrypt                 | none                               | read/write + quarantine |
| `vault.ts`                                               | sensitive records at rest                    | none                               | AES-GCM                 |
| `recovery.ts`                                            | 12-word BIP39 secret + salted verifier       | none                               | verifier only           |
| `schema.ts`                                              | validation/migration/quarantine (foundation) | none                               | all keys                |
| `wird.ts`                                                | load/save hooks + catalog                    | none                               | daily + catalog         |
| `history.ts`                                             | DayRecord aggregation                        | none                               | `wird-history-v1`       |
| `analytics.ts`                                           | pure metrics pipeline                        | none                               | read-only               |
| `coach.ts` / `companion.ts`                              | brief/state engines (pure)                   | none                               | read-only               |
| `transfer.ts`                                            | chunk/encode/checksum                        | none                               | none                    |
| `lan.ts`                                                 | WebRTC local transfer                        | WebRTC LAN only                    | none                    |
| `quran.ts` / `tafsir.ts` / `audio.ts` / `hadith-full.ts` | content loaders                              | same-origin / CDN (see NETWORK.md) | none                    |
| `i18n.ts` / `strings.ts`                                 | localization                                 | none                               | none                    |
| `privacy.ts`                                             | sensitivity classifier + network manifest    | none                               | none                    |
| `use-stored-state.ts`                                    | hydration-safe React state                   | none                               | read/write              |

Rules: no React-DOM imports; no `console.*`; no storage reads during
render; new keys must be added to `schema.ts` + DOCUMENTATION.md §4.
