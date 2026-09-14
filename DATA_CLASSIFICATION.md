# Data classification

Five levels, enforced in code by `sensitivityOf()` in
`app/lib/privacy.ts` (longest-match over key suffixes; default `private`).
The class of a dataset decides its handling everywhere: exports, logs,
diagnostics, analytics eligibility, and personalization access.

| Level            | Meaning                                           | Examples (datasets)                                                                                                                                       |
| ---------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PUBLIC           | device preferences revealing no personal behavior | `wird-theme-v1`, `wird-lang-v1`, `wird-daymode-v1`, Quran font/reciter/tafsir-source prefs, mosque/reminder flags                                         |
| PRIVATE          | behavioral counters, not intimate alone           | daily counts, `wird-reviews-v1`, `wird-adhkar-log-v1`, goals/challenges/pledges catalogs, planner data                                                    |
| SENSITIVE        | detailed personal/religious practice              | `wird-history-v1`, `wird-guide-log-v1`, dreams, custom paths, pledges, recovery verifiers (`wird-recovery-v1`), recovery plans (`wird-recovery-plans-v1`) |
| HIGHLY SENSITIVE | raw journalling text + vault material             | `*-reflections-v1`, `wird-vault-v1` (AES-256-GCM at rest, session-only keys)                                                                              |
| INTERNAL         | operational metadata, no user content             | quarantine/health stores, export log (kind/timestamp/count only), backup manifests, diagnostics counts                                                    |

Rules:

- New `wird-*` keys default to `private`; raising to sensitive/highly
  sensitive is a one-line classifier change plus a row here.
- HIGHLY SENSITIVE content is additionally encrypted at rest when the
  vault is enabled, excluded from share images, and never appears in
  notifications, titles, URLs, or logs (CI-gated: `comments:check`,
  e2e leak scans, `privacy-firewall.test.ts`).
- SENSITIVE content never enters analytics, personalization, telemetry
  (there is none), or any export except an explicit user-initiated backup
  — and recovery plans can be excluded from even those.
- Downgrading a dataset's class is a privacy-architectural change:
  requires an ADR, a `docs/NETWORK.md` + `privacy.ts` review, and a
  CHANGELOG entry.
