# Network Transparency

Every legitimate way this app touches the network, in one place. A
contributor should be able to answer "does this feature make a network
request?" by reading this file + `app/lib/privacy.ts` (`NETWORK_ACCESS`)
and diffing them — no further archaeology needed.

Features not listed here make **no network requests**.

---

## The complete matrix

| Endpoint                                                      | Kind                                      | Trigger (who initiates)                                        | Data sent                                  | Data received                                           | Opt-in  | CSP                                     |
| ------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------- | ------- | --------------------------------------- |
| same-origin `/data/*.json`, `/data/*.txt`                     | static bundle (served by your own deploy) | mushaf load, English load, Jalalayn tafsir, BIP39 wordlist     | none (cached by SW)                        | the corpus files                                        | no      | `'self'`                                |
| `https://cdn.jsdelivr.net/…/editions/…min.json`               | GET dataset                               | user opens a hadith requiring the full book (`hadith-full.ts`) | the book id only                           | the full hadith edition                                 | **yes** | `connect-src`                           |
| `https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@v1.2.0/…` | GET dataset (pinned mirror)               | user opens Musnad Ahmed or Sunan al-Darimi (`hadith-full.ts`)  | the file path only                         | the bilingual book file (Ahmed partial, Darimi AR-only) | **yes** | `connect-src` (same host)               |
| `https://api.quran.com/api/v4/tafsirs/…`                      | GET tafsir                                | user requests a tafsir not bundled (`tafsir.ts`)               | source id + surah:ayah                     | the tafsir passage                                      | **yes** | `connect-src`                           |
| `https://everyayah.com/data/…mp3`                             | GET audio                                 | user plays recitation (`audio.ts`)                             | reciter id + surah/ayah                    | the audio stream                                        | **yes** | `media-src`                             |
| WebRTC peer-to-peer (no STUN/TURN)                            | encrypted data channel                    | user runs the LAN transfer card (`lan.ts`)                     | the (AES-GCM) backup payload, peer-to-peer | same                                                    | **yes** | `connect-src 'self'` + `webrtc` default |

`NETWORK ACCESS: NONE` — everything else (companion, analytics, insights,
storage, vault, calendar, review, recovery, QR, theme, localization).

## How to verify this stays true

1. `lib/privacy.ts` exports the same manifest (single source of truth).
2. The production CSP in `next.config.ts` is the lock: anything not
   allowlisted cannot even attempt a request from the app's own origin.
3. Grep a feature for `fetch(` / `new WebSocket` / `RTCPeerConnection`
   and confirm the URL matches a row above.
4. CI runs `npm audit`; no analytics/tracking dependency is allowed by the
   dependency policy (CONTRIBUTING.md).

## Privacy notes per boundary

- Same-origin files are part of the app; the service worker caches them for
  offline reading. No PII.
- CDN fetches are for **content arriving at the device**, not data leaving
  it. The only identifiers in the URL are content coordinates (book/surah/
  ayah), never user- or device-identifying values.
- WebRTC transfer sends the same-user backup between two devices the user
  pairs via a code; without STUN the practical reach is a shared LAN.
  Payloads are AES-256-GCM with an ephemeral transfer PIN.
- **There is no `sendBeacon`, no analytics pixel, no crash/error
  reporting, no third-party scripts, and no iframes/embeds.**

## Changing the network surface

Any PR that adds a network touchpoint must:

1. Add the row to this file **and** `lib/privacy.ts`.
2. Update the CSP allowlist in `next.config.ts`.
3. Explain the privacy impact in the PR description (justification gate
   from CONTRIBUTING.md).
