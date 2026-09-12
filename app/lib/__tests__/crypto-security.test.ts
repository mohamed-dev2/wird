import { beforeEach, describe, expect, it } from "vitest";
import {
  collectBackup,
  decryptBackup,
  encryptBackup,
  unwrapDecrypted,
  wrapForEncryption,
} from "../crypto";

function memStorage(initial: Record<string, string> = {}) {
  const m = new Map<string, string>(Object.entries(initial));
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
  (globalThis as unknown as { localStorage: unknown }).localStorage = memStorage({
    "wird-daymode-v1": JSON.stringify("عادي"),
  });
});

describe("encrypted backup hardening (AES-GCM / PBKDF2-120k)", () => {
  it("round-trips the manifest envelope and preserves the dataset map", async () => {
    const wrapped = wrapForEncryption(collectBackup());
    expect(wrapped.encrypted).toBe(true);
    expect(wrapped.app).toBe("wird");
    expect(wrapped.datasets["wird-daymode-v1"]?.version).toBe(1);
    const payload = await encryptBackup("correct-horse", wrapped);
    const back = unwrapDecrypted(await decryptBackup("correct-horse", payload));
    expect(back).toEqual(collectBackup());
  });

  it("rejects wrong passwords without leaking details", async () => {
    const payload = await encryptBackup("right", wrapForEncryption(collectBackup()));
    await expect(decryptBackup("wrong", payload)).rejects.toThrow();
  });

  it("detects tampered ciphertext (GCM auth)", async () => {
    const payload = await encryptBackup("pw", wrapForEncryption(collectBackup()));
    const wrap = JSON.parse(payload) as { data: string };
    const tampered = { ...wrap, data: `A${wrap.data.slice(1)}` };
    await expect(decryptBackup("pw", JSON.stringify(tampered))).rejects.toThrow();
  });

  it("rejects malformed payloads generically", async () => {
    await expect(decryptBackup("pw", "not json")).rejects.toThrow("bad backup file");
    await expect(decryptBackup("pw", JSON.stringify({ v: 1 }))).rejects.toThrow("bad backup file");
    await expect(
      decryptBackup("pw", JSON.stringify({ v: 999, salt: "eA==", iv: "eA==", data: "eA==" })),
    ).rejects.toThrow("bad backup file");
  });

  it("uses fresh salt+IV per backup and keeps legacy compat", async () => {
    const a = await encryptBackup("pw", wrapForEncryption(collectBackup()));
    const b = await encryptBackup("pw", wrapForEncryption(collectBackup()));
    expect(a).not.toBe(b);
    // pre-manifest backups (raw map, no envelope) still decrypt+unwrap
    const legacy = await encryptBackup("pw", collectBackup());
    expect(unwrapDecrypted(await decryptBackup("pw", legacy))).toEqual(collectBackup());
  });

  it("unwrapDecrypted refuses non-backup shapes", () => {
    expect(() => unwrapDecrypted({ foo: 1 })).toThrow("bad backup data");
    expect(() => unwrapDecrypted({})).toThrow("bad backup data");
    expect(() => unwrapDecrypted(null)).toThrow("bad backup data");
    expect(() => unwrapDecrypted([{ "wird-daymode-v1": "x" }])).toThrow("bad backup data");
  });
});
