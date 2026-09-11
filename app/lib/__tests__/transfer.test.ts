import { describe, expect, it } from "vitest";
import { assembleChunks, chunkPayload, decodeChunk, encodeChunk } from "../transfer";

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
});
