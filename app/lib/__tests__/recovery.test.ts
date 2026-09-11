import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { entropyFromMnemonic, mnemonicFromEntropy } from "../recovery";

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
