import { describe, expect, it } from "vitest";
import {
  assembleChunks,
  backoffDelay,
  chunkPayload,
  decodeChunk,
  encodeChunk,
  isSaneChunk,
  payloadChecksumWords,
  QR_MAX_CHUNKS,
} from "../transfer";

const FAKE_WORDS = Array.from({ length: 2048 }, (_, i) => `w${i}`);

describe("check words", () => {
  it("derives three deterministic words from a payload", async () => {
    const a = await payloadChecksumWords("QUJD", FAKE_WORDS);
    const b = await payloadChecksumWords("QUJD", FAKE_WORDS);
    const c = await payloadChecksumWords("QUJE", FAKE_WORDS);
    expect(a).toEqual(b);
    expect(a).toHaveLength(3);
    // One-byte difference must change at least one word.
    expect(a).not.toEqual(c);
  });

  it("fails gracefully on undecodable input", async () => {
    // Empty payload still yields three words (a hash of nothing, with
    // placeholder words for out-of-range indices) — callers only compute
    // these on real payloads anyway.
    expect(await payloadChecksumWords("", FAKE_WORDS)).toHaveLength(3);
    // `!!!` is invalid base64 — atob throws, which the function catches.
    expect(await payloadChecksumWords("!!!", FAKE_WORDS)).toBeNull();
  });
});

describe("backoff delay", () => {
  it("doubles from the base until the cap", () => {
    expect(backoffDelay(0)).toBe(2000);
    expect(backoffDelay(1)).toBe(4000);
    expect(backoffDelay(2)).toBe(8000);
    // Clamps at the cap regardless of further attempts.
    expect(backoffDelay(10)).toBe(30000);
    expect(backoffDelay(-3)).toBe(2000);
  });
});

describe("qr chunking", () => {
  it("round-trips a payload through encode/decode/assemble", () => {
    const b64 = "QUJD".repeat(1500);
    const chunks = chunkPayload(b64, 1800);
    expect(chunks.length).toBeGreaterThan(1);
    const got = new Map<number, string>();
    for (const c of chunks) {
      const back = decodeChunk(encodeChunk(c));
      expect(back).toEqual(c);
      if (back) got.set(back.i, back.payload);
    }
    expect(assembleChunks(got, chunks.length)).toBe(b64);
  });

  it("rejects foreign qr content and partial sets", () => {
    expect(decodeChunk("https://example.com")).toBeNull();
    expect(decodeChunk("WIRD1:1/2:AAA")).toEqual({ i: 1, n: 2, payload: "AAA" });
    expect(assembleChunks(new Map([[1, "AAA"]]), 2)).toBeNull();
  });

  it("tolerates duplicates and out-of-order scans, refuses contaminated sets", () => {
    const b64 = "QUJD".repeat(1500);
    const chunks = chunkPayload(b64, 1800);
    const got = new Map<number, string>();
    // reversed + duplicated delivery
    for (const c of [...chunks].reverse()) {
      const back = decodeChunk(encodeChunk(c));
      expect(back && isSaneChunk(back)).toBe(true);
      if (back) {
        got.set(back.i, back.payload);
        got.set(back.i, back.payload); // duplicate scan
      }
    }
    expect(assembleChunks(got, chunks.length)).toBe(b64);
    // A foreign chunk smuggled into the set (unknown index) poisons the
    // size check, so assembly safely refuses instead of building garbage.
    // The scanner UI prevents this earlier via its session lock.
    const mixed = new Map(got);
    mixed.set(9999, "AAAA");
    expect(assembleChunks(mixed, chunks.length)).toBeNull();
    const foreign = decodeChunk(`WIRD1:1/${chunks.length + 5}:AAAA`);
    expect(foreign && isSaneChunk(foreign)).toBe(true);
    expect(assembleChunks(got, chunks.length + 5)).toBeNull();
  });

  it("bounds chunk shapes before they reach memory", () => {
    expect(QR_MAX_CHUNKS).toBe(600);
    expect(isSaneChunk({ i: 1, n: 3, payload: "AAA" })).toBe(true);
    expect(isSaneChunk({ i: 0, n: 3, payload: "AAA" })).toBe(false);
    expect(isSaneChunk({ i: 4, n: 3, payload: "AAA" })).toBe(false);
    expect(isSaneChunk({ i: 1, n: 0, payload: "AAA" })).toBe(false);
    expect(isSaneChunk({ i: 1, n: QR_MAX_CHUNKS + 1, payload: "AAA" })).toBe(false);
    expect(isSaneChunk({ i: 1, n: 3, payload: "" })).toBe(false);
  });
});
