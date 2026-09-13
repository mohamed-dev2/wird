# Technical debt register

Debt that could materially affect reliability, security, privacy,
maintainability, performance, or contributor experience. Kept short on
purpose — only items whose cost is real get a row.

Priority: P0 (blocker), P1 (high), P2 (medium). Owners are the person
most likely to work on it; empty = open.

| #    | Problem                                                            | Impact                                                  | Why it exists                                       | Risk                                      | Possible solution                                                                                                 | Priority |
| ---- | ------------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| TD-1 | Two-language dictionary only (AR/EN)                               | Third language needs dir (LTR) + root-language plumbing | Designed in when AR+EN sufficed                     | LTR contributors blocked                  | `Lang` union + `dir`/language root metadata; ADR-006 supersede                                                    | P2       |
| TD-2 | `restoreBackup` deprecated but present                             | Two restore paths confuse API consumers                 | Replaced by `restoreBackupSafe` during privacy work | Miscall on legacy imports                 | Remove in next major (VERSIONING.md deprecation window)                                                           | P2       |
| TD-3 | Quran reader lacks virtual-cursor a11y                             | Screen-reader linear mushaf reading suboptimal          | Scope creep cut during reader build                 | A11y audit gap                            | `aria-activedescendant` cursor + tests                                                                            | P2       |
| TD-4 | e2e must run `--workers=1`                                         | CI slower; parallel flaky on this machine               | Unknown shared-state in specs                       | Release friction                          | Root-cause parallel flakiness, remove serial note                                                                 | P1       |
| TD-5 | SBOM generation is script, not wired to CI                         | Release artifacts may drift from lockfile               | Added before release pipeline matured               | Supply-chain opacity at release time      | Hook `npm run sbom` into CI release job                                                                           | P2       |
| TD-6 | `WIRD_APP_VERSION` duplicated with package.json                    | Two places must bump in lockstep                        | Backup manifest needs version independent of build  | Version stamp drift                       | Read version from package.json at build; assert equality in CI                                                    | P1       |
| TD-7 | 18 `!important` CSS overrides (17 waived)                          | Style layering gets brittle under change                | Evolution before token discipline landed            | Visual regressions                        | Shrink with token-refactor each feature pass                                                                      | P3       |
| TD-8 | `lib/i18n.ts` value-imports `useWird` from `components/wird-store` | lib layer reaches into UI layer (boundary-allow: R1)    | Store context predates the lib/components split     | Further lib→components couplings creep in | Move the store context (and `Lang`) into lib or a boundary module; keep `import type` allowed only after the move | P2       |

How to add a row: only if the cost is real and the risk is material — a
vague "could be better" does not qualify. Link the row from the PR that
introduces the debt.

How to close a row: fix it in a PR, run the gates, move the row to a
"Resolved" appendix with the PR/commit reference.

## Resolved

(none yet)
