# Data retention

Shortest practical retention everywhere. All data is local; "retention"
here means how long the app keeps something before the user deletes it
or a cap rolls it off.

| Data                            | Retention                                                                                                              | Deletion path                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Daily practice keys             | current day (+ history merge for pages/scores)                                                                         | automatic rollover; wipe; surgical reset                                 |
| History / reviews / adhkar log  | history: unbounded by days; adhkar log 180 days                                                                        | wipe; profile delete; surgical reset                                     |
| Catalogs, goals, library state  | until deleted                                                                                                          | item delete; wipe; profile delete; surgical reset                        |
| Recovery plans                  | until deleted; detail records pruned >730 days, setback history kept                                                   | plan delete; wipe; profile delete                                        |
| Deen journey                    | until deleted; day records pruned >365 days, achievements/XP ledger kept                                               | erase button; wipe; profile delete                                       |
| Guide log / export log / health | 30 / 50 / 50 entries (rolling caps)                                                                                    | automatic rollover; diagnostics clear; wipe                              |
| Quarantine                      | last 20 entries (~200KB)                                                                                               | explicit clear (data-health); survives wipe by design — clear separately |
| Vault                           | until disabled (forgetting passphrase = permanent loss, stated in UI)                                                  | disable vault; wipe                                                      |
| Recovery verifiers              | until profile deleted                                                                                                  | profile delete; wipe (phrases themselves are never stored)               |
| Session unlock flag             | tab session                                                                                                            | close tab / lock                                                         |
| Backups in user hands           | user-controlled files                                                                                                  | user deletes the file                                                    |
| Deleted-account remnants        | none on device after wipe + diagnostics clear (backups the user kept are theirs to delete)                             | wipe, then clear diagnostics                                             |
| Legal records                   | no legal records are collected (no accounts, no request tracking beyond the local export log, which the user can wipe) | —                                                                        |
| Security logs                   | the export log is the only security-relevant log (local, capped, user-visible, user-deletable)                         | wipe; diagnostics clear                                                  |

Reviews: retention is re-examined whenever a new dataset is added
(legal change gate in `GOVERNANCE.md`); any increase needs an ADR plus a
CHANGELOG entry. Effective 2026-09-14 (v1.0.0 of this policy).
