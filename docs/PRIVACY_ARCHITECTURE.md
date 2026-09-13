# Privacy Architecture

This document is the privacy contract for Wird. It answers "what data
exists, where it lives, what happens to it, and what — if anything —
leaves the device." If a feature violates a line here, it is a bug.

Companion documents: `SECURITY.md` (threat model), `docs/NETWORK.md`
(every network boundary), `lib/privacy.ts` (code-level classification +
network manifest), DOCUMENTATION.md §4/§5 (keys + boundaries).

---

## Data that exists

All persistent data is key–value JSON in `localStorage` under one origin,
versioned by schemas (`app/lib/schema.ts`). Complete key inventory:
DOCUMENTATION.md §4. Classification by touchiness lives in
`app/lib/privacy.ts` (`sensitivityOf()`):

| Class              | Meaning                                    | Examples                                                                                                                              |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `public`           | device prefs; reveals no personal behavior | theme, language, font, reciter, prayer-time prefs                                                                                     |
| `private`          | personal counters; not intimate alone      | daily counts, adhkar log, review aggregates                                                                                           |
| `sensitive`        | detailed personal/religious practice       | history windows, custom paths, dreams, pledges, guide-log (adaptive interpretation), recovery verifier, private self-management plans |
| `highly_sensitive` | raw reflection text and vault content      | reflection corpus, vault envelope                                                                                                     |

## Where it is stored

- **At rest:** browser `localStorage`, protected only by the OS/disk
  encryption of the device. Justification: encrypting everything would
  only move the key next to the ciphertext (ADR-004).
- **Exception — at-rest encryption:** the optional reflection **vault**
  (`app/lib/vault.ts`) encrypts `highly_sensitive` text with AES-256-GCM;
  the passphrase is never stored. Forgot it → permanent loss, by design.
- **In transit:** only when the user initiates an export/transfer (below).

## What processing occurs locally

Everything. Companion, analytics, insights, calendar aggregation, search,
guidance — all are pure functions in `app/lib/` running in the browser
(ADR-002, ADR-003). No computation is offloaded.

## Networking — what it is and is NOT

**There is no telemetry, no analytics SDK, no crash reporting, no
fingerprinting, no server, no sync, no login.** The complete, auditable set
of network touchpoints is in `docs/NETWORK.md` and mirrored in code
(`lib/privacy.ts` → `NETWORK_ACCESS`). Summary:

- Same-origin static bundles (the app's own deploy).
- User-initiated CDN content: hadith full books (jsdelivr), tafsir
  (api.quran.com), audio (everyayah.com). All CSP-allowlisted.
- WebRTC device-to-device transfer on the local network (no STUN/TURN).

None of these ever send your behavioral data to a third party; audio/text
content is fetched _to_ your device, not recorded from it.

## What can be exported

Backups (plain or AES-GCM-encrypted JSON) hold the same keys as local
storage, scoped to the whole device or a single profile. Encrypted
exports are the recommended path. **Exports are the only bulk egress.**

## What can be shared

From the share sheet: only explicit, allowlisted aggregated stats
(`app/lib/share.ts`) — e.g. "prayer consistency" counts — never raw
records, never profile identity, never reflections. The "hide names"
option and travel mode additionally hide profile identities from casual
shoulder-surfing.

## Telemetry that exists

A **local** export consent log (`wird-export-log-v1`): kind, timestamp,
record count. It lives only on the device (visible on Account → backup).

## Telemetry that does NOT exist

No network telemetry of any kind: no page views, no usage events, no crash
reports, no error beacons, no analytics cookies, no ad IDs, no installation
stats to third parties. The PWA is installable without any "phone-home".

## Rules that keep this true (enforced by gates/review)

1. New storage keys → schema entry + DOCUMENTATION §4 + round-trip test.
2. Any new network call → `lib/privacy.ts` `NETWORK_ACCESS` + CSP
   allowlist + docs/NETWORK.md entry (otherwise a PR reviewer should fail it).
3. New user-facing strings → AR+EN parity (CI-enforced).
4. `console.*` in `app/` is forbidden (crash logs could leak content).
5. Sensitive classes (vault/reflections) are excluded from diagnostics
   exports by construction.
