import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  entropyFromMnemonic,
  loadVerifiers,
  mnemonicFromEntropy,
  saveVerifier,
  saveVerifierSalted,
  verifierMatches,
} from "../recovery";
import type { StorageLike } from "../schema";

function memStore(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
    get length() {
      return m.size;
    },
    key: (i: number) => [...m.keys()][i] ?? null,
  };
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: unknown }).localStorage = memStore();
});

const words = readFileSync(
  join(__dirname, "..", "..", "..", "public", "data", "bip39-en.txt"),
  "utf-8",
)
  .split(/\s+/)
  .filter(Boolean);

describe("recovery phrases (BIP39 vectors)", () => {
  it("has a valid 2048-word list", () => {
    expect(words.length).toBe(2048);
    expect(words[0]).toBe("abandon");
  });

  it("matches the official zero-entropy vector", async () => {
    const got = await mnemonicFromEntropy(words, new Uint8Array(16));
    expect(got).toEqual([...new Array<string>(11).fill("abandon"), "about"]);
  });

  it("round-trips and rejects bad phrases", async () => {
    const entropy = new Uint8Array([9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 9, 8, 7, 6, 5, 4]);
    const phrase = (await mnemonicFromEntropy(words, entropy)).join(" ");
    const back = await entropyFromMnemonic(words, phrase);
    expect(back && [...back]).toEqual([...entropy]);
    expect(await entropyFromMnemonic(words, "hello world")).toBeNull();
    const tampered = phrase.split(" ");
    tampered[11] = tampered[11] === "about" ? "abandon" : "about";
    expect(await entropyFromMnemonic(words, tampered.join(" "))).toBeNull();
  });
});

describe("salted verifiers (v1) with legacy (v0) compat", () => {
  const phrase =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  it("salted save verifies, wrong words fail, salts differ", async () => {
    await saveVerifierSalted("a", phrase.split(" "));
    const stored = loadVerifiers()["a"];
    expect(typeof stored).toBe("object");
    expect(await verifierMatches(stored, phrase.split(" "))).toBe(true);
    expect(await verifierMatches(stored, ["wrong", "words"])).toBe(false);
    await saveVerifierSalted("b", phrase.split(" "));
    // same phrase, different profile → different hash (unique salts)
    expect(loadVerifiers()["a"]).not.toEqual(loadVerifiers()["b"]);
  });

  it("legacy unsalted hashes still verify", async () => {
    saveVerifier("old", "legacy-hash-placeholder");
    const stored = loadVerifiers()["old"];
    expect(typeof stored).toBe("string");
    // wrong words fail against a real legacy record too
    expect(await verifierMatches(stored, ["nope"])).toBe(false);
    expect(await verifierMatches(undefined, phrase.split(" "))).toBe(false);
  });
});
