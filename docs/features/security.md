# Security feature

Threat model, controls, and the documented security posture of Wird.

- Authoritative doc: `SECURITY.md` (repo root).
- Crypto: `app/lib/crypto.ts` (AES-256-GCM, PBKDF2 210k iters, per-salt
  IVs), `app/lib/recovery.ts` (salted verification of the 24-word secret).
- Auth boundary: profile PIN gate (`wird-profiles-v1` + salted `pinHash` /
  optional `duressPinHash`), `app/components/login-gate.tsx`.
- Export hardening: backups carry header checksums, QR/LAN receive paths
  throttle via `backoffDelay`, and profile scope is enforced via
  `collectBackupFor`.

**Key posture (from SECURITY.md):**

- Local-only storage; theft of the device is the realistic high-impact
  scenario → encrypted backup + recovery secret.
- No cloud sync, no analytics server, no third-party auth (ADR-002).
- CSP limits `connect-src` to `cdn.jsdelivr.net` + `api.quran.com`;
  `media-src` to `everyayah.com` (offline fallbacks exist for all).
- Private vulnerability reporting: GitHub Security Advisories.
