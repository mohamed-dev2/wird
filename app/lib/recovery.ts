import { readRecord, writeRecord } from "./schema";

let wordsCache: Promise<string[]> | null = null;

export function loadWordlist(): Promise<string[]> {
  if (!wordsCache) {
    wordsCache = fetch("/data/bip39-en.txt")
      .then((r) => {
        if (!r.ok) throw new Error("wordlist missing");
        return r.text();
      })
      .then((t) => {
        const words = t.split(/\s+/).filter(Boolean);
        if (words.length !== 2048) throw new Error("bad wordlist");
        return words;
      })
      .catch((e) => {
        wordsCache = null;
        throw e;
      });
  }
  return wordsCache;
}

async function sha256HexRaw(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** BIP39-style 12-word phrase from 128-bit entropy. */
export async function mnemonicFromEntropy(words: string[], entropy: Uint8Array): Promise<string[]> {
  if (words.length !== 2048 || entropy.length !== 16) throw new Error("bad input");
  const hashBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", entropy as BufferSource));
  const bits: number[] = [];
  for (const b of entropy) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  for (let i = 7; i >= 4; i--) bits.push(((hashBytes[0] ?? 0) >> i) & 1);
  const out: string[] = [];
  for (let i = 0; i < 12; i++) {
    let idx = 0;
    for (let j = 0; j < 11; j++) idx = (idx << 1) | (bits[i * 11 + j] ?? 0);
    const w = words[idx];
    if (!w) throw new Error("wordlist");
    out.push(w);
  }
  return out;
}

function bitsToEntropy(words: string[], parts: string[]): Uint8Array {
  const entropy = new Uint8Array(16);
  const bits: number[] = [];
  for (const w of parts) {
    const idx = words.indexOf(w);
    for (let j = 10; j >= 0; j--) bits.push((idx >> j) & 1);
  }
  for (let i = 0; i < 16; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | (bits[i * 8 + j] ?? 0);
    entropy[i] = b;
  }
  return entropy;
}

export async function entropyFromMnemonic(
  words: string[],
  input: string,
): Promise<Uint8Array | null> {
  try {
    const parts = input.toLowerCase().trim().split(/\s+/);
    if (parts.length !== 12 || parts.some((w) => !words.includes(w))) return null;
    const entropy = bitsToEntropy(words, parts);
    const check = await mnemonicFromEntropy(words, entropy);
    return check.join(" ") === parts.join(" ") ? entropy : null;
  } catch {
    return null;
  }
}

export async function entropyToMnemonic(entropy: Uint8Array): Promise<string[]> {
  return mnemonicFromEntropy(await loadWordlist(), entropy);
}

export async function newRecoveryPhrase(): Promise<{ words: string[]; verifier: string }> {
  const entropy = crypto.getRandomValues(new Uint8Array(16));
  const words = await entropyToMnemonic(entropy);
  const verifier = await sha256HexRaw(`wird-recovery:${words.join(" ")}`);
  return { words, verifier };
}

/** Returns entropy bytes if the phrase checks out, else null. */
export async function verifyPhrase(input: string): Promise<Uint8Array | null> {
  try {
    return await entropyFromMnemonic(await loadWordlist(), input);
  } catch {
    return null;
  }
}

export async function recoveryVerifier(words: string[]): Promise<string> {
  return sha256HexRaw(`wird-recovery:${words.join(" ")}`);
}

export function loadVerifiers(): Record<string, string> {
  try {
    // Routed through the integrity layer: malformed maps fall back to {}
    // and the raw bytes are quarantined instead of crashing auth.
    // NOTE: namespaced per active profile by the caller (see profiles.ts);
    // entries inside are keyed by profileId as a second scope.
    const { value } = readRecord<Record<string, string>>(
      localStorage,
      namespacedRecoveryKey(),
      "wird-recovery-v1",
    );
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function namespacedRecoveryKey(): string {
  // localStorage key resolution without importing profiles (avoids a cycle):
  // profiles.ts nsKey() prefixes non-global wird-* keys with p_<id>_.
  // wird-recovery-v1 is intentionally NOT global, so resolve the prefix here.
  try {
    const active = localStorage.getItem("wird-active-profile");
    if (active && /^[A-Za-z0-9-]+$/.test(active)) return `p_${active}_wird-recovery-v1`;
  } catch {}
  return "wird-recovery-v1";
}

export function saveVerifier(profileId: string, verifier: string): void {
  try {
    const all = loadVerifiers();
    all[profileId] = verifier;
    writeRecord(localStorage, namespacedRecoveryKey(), "wird-recovery-v1", all);
  } catch {}
}
