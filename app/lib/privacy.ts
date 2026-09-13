// Privacy classification layer (docs/PRIVACY_ARCHITECTURE.md):
// - `DataSensitivity` drives how touchy a storage key is.
// - `sensitivityOf(key)` maps every dataset key to a class so future
//   features (export dialogs, diagnostics redaction, devtools helpers)
//   can refuse/redact without hard-coding names.
// - `NETWORK_ACCESS` is the single source of truth for what contacts the
//   network, so "does this feature phone home?" has one place to answer.
//
// KEEP THIS FILE IN SYNC WITH DOCUMENTATION.md §4 (storage keys) and
// §5 (network boundaries). CI does not enforce sync — review on change.

/** Privacy classification of a dataset key. Order matters (ascending touchiness). */
export type DataSensitivity = "public" | "private" | "sensitive" | "highly_sensitive";

/**
 * Key-prefix → class. Exact keys are checked first (longest match wins).
 *
 * - public: device preferences that reveal no personal behavior
 *   (theme, language, quran font/reciter prefs, installed-reminder flags).
 * - private: behavioral counters tied to a person but not intimate on
 *   their own (daily counts, adhkar logs, review aggregates).
 * - sensitive: reveals religious/personal practice in detail — history
 *   windows, custom paths, dreams, pledges, guide-log (adaptive
 *   interpretation), reflection metadata.
 * - highly_sensitive: raw reflection/journalling text and vault material.
 *   These are additionally encrypted at rest when the vault is enabled.
 */
const EXACT: Array<[string, DataSensitivity]> = [["p__wird-vault-v1", "highly_sensitive"]];

const SUFFIX: Array<[string, DataSensitivity]> = [
  ["-reflections-v1", "highly_sensitive"],
  ["-dreams-v1", "sensitive"],
  ["-pledges-v1", "sensitive"],
  ["-paths-custom-v1", "sensitive"],
  ["-guide-log-v1", "sensitive"],
  ["-history-v1", "sensitive"],
  ["wird-recovery-v1", "sensitive"],
  ["wird-recovery-plans-v1", "sensitive"],
  ["wird-reviews-v1", "private"],
  ["wird-adhkar-log-v1", "private"],
  ["wird-daymode-v1", "public"],
  ["wird-theme-v1", "public"],
  ["wird-lang-v1", "public"],
];

/** Default for keys that are personal records but not individually classified. */
const DEFAULT_SENSITIVITY: DataSensitivity = "private";

export function sensitivityOf(key: string): DataSensitivity {
  const bare = key.replace(/^p_[^_]+_/, "");
  for (const [s, c] of EXACT) if (bare === s.replace(/^p_/, "")) return c;
  for (const [s, c] of SUFFIX)
    if (s.startsWith("p_") ? bare === s.replace(/^p_/, "") : bare.includes(s)) return c;
  return DEFAULT_SENSITIVITY;
}

/**
 * Network transparency manifest — every legitimate way data can leave the
 * origin. Everything else in the app is strictly offline.
 *
 * reason/howToAudit fields exist so reviewers can re-derive the permit
 * from the CSP (next.config.ts) instead of trusting this file alone.
 */
export const NETWORK_ACCESS = [
  {
    domain: "same-origin (/data/*)",
    kind: "static bundle",
    who: "@user-visible features; executed by the service worker runtime",
    reason: "Quran mushaf, English translation, Jalalayn tafsir, BIP39 wordlist",
    optIn: false,
    contentLeavesDevice: false,
  },
  {
    domain: "cdn.jsdelivr.net",
    kind: "GET dataset",
    who: "hadith-full.ts (full hadith books)",
    reason: "user taps a hadith that needs the full book edition",
    optIn: true,
    contentLeavesDevice: false,
  },
  {
    domain: "api.quran.com",
    kind: "GET tafsir",
    who: "tafsir.ts (fetchTafsir)",
    reason: "user opens a tafsir not bundled locally",
    optIn: true,
    contentLeavesDevice: false,
  },
  {
    domain: "everyayah.com",
    kind: "GET audio",
    who: "audio.ts (ayahAudioUrl)",
    reason: "user plays audio recitation",
    optIn: true,
    contentLeavesDevice: false,
  },
  {
    domain: "WebRTC (peer-to-peer)",
    kind: "encrypted transfer",
    who: "lan.ts (transfer card)",
    reason:
      "device-to-device backup transfer; no STUN/TURN configured, so only direct LAN hosts are viable",
    optIn: true,
    contentLeavesDevice: true, // both ends are the same user's devices
  },
] as const;
