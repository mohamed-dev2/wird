import { beforeEach, describe, expect, it } from "vitest";
import {
  disableVault,
  lockVault,
  readVaultText,
  setupVault,
  unlockVault,
  vaultStatus,
  VAULT_KEY,
} from "../vault";
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
  lockVault();
});

describe("reflection vault (discouraged, opt-in)", () => {
  it("starts off, encrypts on setup, removes plaintext", async () => {
    expect(vaultStatus()).toBe("off");
    localStorage.setItem("wird-reflection-v2", JSON.stringify({ day: "2026-09-12", text: "hi" }));
    await setupVault("correct horse", "2026-09-12", "secret words");
    expect(vaultStatus()).toBe("open");
    expect(localStorage.getItem("wird-reflection-v2")).toBeNull();
    const raw = localStorage.getItem(VAULT_KEY) ?? "";
    expect(raw).not.toContain("secret words");
    expect(await readVaultText()).toEqual({ day: "2026-09-12", text: "secret words" });
  });

  it("locks on demand and rejects wrong passphrases generically", async () => {
    await setupVault("correct horse", "2026-09-12", "secret words");
    lockVault();
    expect(vaultStatus()).toBe("locked");
    expect(await readVaultText()).toBeNull();
    await expect(unlockVault("wrong horse")).rejects.toThrow("bad passphrase");
    expect(vaultStatus()).toBe("locked");
    expect(await unlockVault("correct horse")).toEqual({ day: "2026-09-12", text: "secret words" });
    expect(vaultStatus()).toBe("open");
  });

  it("rejects short passphrases and disables only with the right one", async () => {
    await expect(setupVault("abc", "2026-09-12", "x")).rejects.toThrow();
    await setupVault("correct horse", "2026-09-12", "keep me");
    await expect(disableVault("wrong horse")).rejects.toThrow();
    // failed attempt changes nothing: still open, record intact
    expect(vaultStatus()).toBe("open");
    expect(await readVaultText()).toEqual({ day: "2026-09-12", text: "keep me" });
    const back = await disableVault("correct horse");
    expect(back).toEqual({ day: "2026-09-12", text: "keep me" });
    expect(vaultStatus()).toBe("off");
    expect(localStorage.getItem(VAULT_KEY)).toBeNull();
  });
});
