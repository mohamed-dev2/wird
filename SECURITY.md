# Security

Wird is a **local-first, offline-capable PWA**. It runs entirely in the
browser; there is no server, no database, and no account system. Security
is therefore about the browser sandbox, the storage we use, and the few
data-in-transit paths (backup import/export, device-to-device transfer).

> Please read this before filing issues. For **how to report**, see
> [Reporting a vulnerability](#reporting-a-vulnerability) below — do not
> open a public issue for live vulnerabilities.

---

## Threat model

We defend against **you and the people you are next to**, not against the
platform. Trust boundaries:

| Trusted                                     | Not trusted                                            |
| ------------------------------------------- | ------------------------------------------------------ |
| The user themselves (owner of the device)   | Third parties who get the exported backup file         |
| The browser's localStorage + origin sandbox | Anyone shoulder-surfing or with brief physical access  |
| Same-origin bundles served by the deploy    | Network attackers on the user's LAN/Wi-Fi              |
| WebCrypto AES-GCM/PBKDF2 (platform crypto)  | Malicious browser extensions with broad storage access |

Explicitly **out of scope**: an attacker who already has full control of
the device/OS, keyloggers, compromised browser builds, or forensic access
by law enforcement. Your device's disk encryption and OS lock screen are
the first and last line of defense for a fully-offline app.

## Security assumptions

1. Mode: no authentication or server action, so there is no credential
   escalation surface — the app has nothing to escalate into.
2. `localStorage` is plaintext-equivalent under disk encryption. The only
   data we encrypt at rest is the optional **reflection vault** and, by
   default, the app does not store anything it wouldn't admit to showing.
3. Training the user is protective control: the threat model assumes a
   human can be coerced to reveal PINs or recovery phrases — hence the
   optional **duress PIN** decoy and explicit warnings.

## Attack surfaces

- **Backup files** (plain/encrypted JSON download). Integrity + scrub
  checks: `verifyBackupIntegrity`, quarantine instead of deletion, atomic
  import with rollback, `profilesInBackup` warnings, per-profile remap
  confirm. Encrypted backups: AES-256-GCM, fresh salt + IV per file,
  PBKDF2 (see DOCUMENTATION.md §9).
- **QR / LAN import**. Ephemeral 6-digit transfer PIN, AES-GCM-encrypted
  payload, copy-checksum words both ends (catches truncation/copy errors,
  not a network rogue — documented in code), exponential throttling of
  decrypt guesses, session-locked chunk assembly, import aborts if the
  active profile changes mid-decrypt.
- **Recovery phrase**. 12 BIP39 words → salted SHA-256 verifier stored per
  profile. The recovery path can only reset the PIN, never read data; the
  vault bonus is that the phrase alone cannot open vaulted reflections.
- **Reflection vault** (`lib/vault.ts`). AES-GCM-256 with PBKDF2, session
  key in module memory only. Forgetting the passphrase is **permanent
  loss** by design; the recovery phrase cannot open it.
- **Rendering**. All user/external text is rendered as text/React text
  nodes (no `dangerouslySetInnerHTML` without explicit allowlist —
  hadith/tafsir HTML is stripped first via `stripHtml`). No `eval`, no
  dynamic `new Function`.
- **Supply chain**. Five runtime deps, pinned exact versions, `next build`
  - lockfile; `npm audit --audit-level=moderate` runs in CI on every PR.
- **Browser features**. `Permissions-Policy` denies camera/mic/geolocation/
  payment unconditionally (`next.config.ts`) — QR-code scanning uses file
  upload, never the camera. Voice logging was removed rather than leak
  audio to cloud transcription (ADR-002).

## Local storage security

- All keys live in `localStorage` under one origin; per-profile keys are
  namespaced `p_<id>_`. There is no shared-state bug between profiles
  (isolation covered by unit + e2e tests).
- Versioned schemas validate every read; unknown/corrupt values route to a
  **quarantine** store (30-day TTL) instead of being dropped.
- PINs are stored as **salted per-profile verifiers**, not plaintext; the
  global `wird-pinlock` gate only holds a busy/verifier flag (see
  DOCUMENTATION.md §5). Weak PINs (sequential/repeated) are rejected.
- Sessions for the newest features never persist accidentally: the "unlock"
  session lives in `sessionStorage`, panic-lock, idle-blur, and
  hidden-tab-blur are implemented in `shell.tsx`.

## Export security

- Plain exports require PIN re-entry and carry a tamper-evident `integrity`
  checksum; encrypted exports authenticate via AES-GCM (no separate
  checksum needed).
- Every export is logged locally (`wird-export-log-v1`): kind, timestamp,
  count — "what left the device" is visible on the Account page.
- Exported filenames are date+random stamped (no overwrite collisions).
- Clipboard copies of transfer codes self-clear after 60 s.

## XSS / injection

- React text-node-only rendering; CSP is strict in production
  (`script-src 'self' 'unsafe-inline'` — a documented Next.js App Router
  requirement; `connect-src` narrowed to `cdn.jsdelivr.net` +
  `api.quran.com`, `media-src` to `everyayah.com` — see
  next.config.ts). The service worker and all bundles are same-origin.
- No HTML is injected from user data; tafsir/hadith HTML is sanitized via
  `stripHtml` before it reaches the DOM.

## Incident response (internal process)

Detect (health Diagnostics, user report, advisory) → contain (safe mode,
feature parks, Vercel rollback) → investigate (diagnostics export,
quarantine forensics — user bytes stay local) → determine affected data
(DATA_INVENTORY.md classes) → assess legal obligations (do not promise a
notification period unless legally verified) → remediate → notify where
required → document (postmortem: what/why/first-failure/escape/prevention,
no blame) → prevent recurrence (regression test + gate). Security log is
the local export log (kind/time/count, user-visible); no incident data
leaves the device except through the reporter's own private advisory.

## Authentication boundaries

There is no account, no server session, no third-party login. The only
"authentication" is the local PIN gate (protects against casual/same-session
surfing) and the optional vault passphrase — both client-side by design.

## Reporting a vulnerability

- **Do not** file a public issue for a live security bug.
- Report privately so we can fix before disclosure:
  - Preferred: GitHub Security Advisories → **New advisory** via
    `Security` tab (private draft), addressed to the maintainers.
  - Alternative: open a private fork + draft **security patch PR** and @-
    mention a maintainer describing the issue discreetly.
- Dedicated security email is not yet configured; do not trust any address
  claiming to be Wird unless published here by the project owner.
- Include, if possible: affected version/commit, reproduction steps, impact,
  and a suggested fix. Reports are handled confidentially; we publish an
  advisory + fix only after the issue is resolved (and, if needed, after a
  responsible-disclosure window).
