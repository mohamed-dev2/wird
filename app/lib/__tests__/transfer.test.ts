import { describe, expect, it } from "vitest";
import {
  assembleChunks,
  chunkPayload,
  decodeChunk,
  encodeChunk,
  isSaneChunk,
  QR_MAX_CHUNKS,
} from "../transfer";

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
