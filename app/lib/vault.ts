// Optional reflection vault: AES-GCM encryption for the daily reflection
// text, deliberately INCONVENIENT and STRONGLY DISCOURAGED (see vault.warn).
// Why discouraged: a forgotten passphrase means PERMANENT loss — not even
// the recovery phrase can unlock it (by design: no backdoor exists), every
// keystroke costs an async encrypt, and device-level encryption already
// protects localStorage on modern phones. Only for threat models where an
// unlocked device in hostile hands is expected AND backups exist.
//
// Security properties (honest):
// - AES-GCM-256, PBKDF2-SHA256 120k, fresh 128-bit salt + 96-bit IV.
// - Session key lives in module memory ONLY (never persisted, cleared on
//   reload) — each reload re-prompts. Tampering fails GCM auth generically.
// - The vault record itself reveals only: a vault exists + its salt/IV.
// - Plaintext reflection key is REMOVED while the vault is on (no shadow).

import { nsKey } from "./profiles";

export const VAULT_KEY = "wird-vault-v1";

type VaultRecord = { v: 1; enc: string; salt: string; iv: string; data: string };
type Session = { key: CryptoKey; salt: string };
let session: Session | null = null;

const ENC = new TextEncoder();
const DEC = new TextDecoder();

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64ToBuf(b64: string): Uint8Array {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", ENC.encode(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 120000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function readRecord(): VaultRecord | null {
  try {
    const raw = localStorage.getItem(nsKey(VAULT_KEY));
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<VaultRecord>;
    if (v?.v !== 1 || !v.salt || !v.iv || !v.data || v.enc !== "AES-GCM/PBKDF2-SHA256-120k") {
      return null;
    }
    return v as VaultRecord;
  } catch {
    return null;
  }
}

export type VaultState = "off" | "locked" | "open";

export function vaultStatus(): VaultState {
  if (session) return "open";
  return readRecord() ? "locked" : "off";
}

/** Enable: encrypts {day, text} and REMOVES the plaintext key. Throws generically. */
export async function setupVault(passphrase: string, day: string, text: string): Promise<void> {
  if (!passphrase || passphrase.length < 4) throw new Error("bad passphrase");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ENC.encode(JSON.stringify({ day, text })),
  );
  const rec: VaultRecord = {
    v: 1,
    enc: "AES-GCM/PBKDF2-SHA256-120k",
    salt: bufToB64(salt.buffer as ArrayBuffer),
    iv: bufToB64(iv.buffer as ArrayBuffer),
    data: bufToB64(cipher),
  };
  localStorage.setItem(nsKey(VAULT_KEY), JSON.stringify(rec));
  try {
    localStorage.removeItem(nsKey("wird-reflection-v2"));
  } catch {}
  session = { key, salt: rec.salt };
}

/** Unlock for this session only. Generic failure (never: which step failed). */
export async function unlockVault(passphrase: string): Promise<{ day: string; text: string }> {
  const rec = readRecord();
  if (!rec) throw new Error("no vault");
  try {
    const key = await deriveKey(passphrase, b64ToBuf(rec.salt));
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBuf(rec.iv) as BufferSource },
      key,
      b64ToBuf(rec.data) as BufferSource,
    );
    const v = JSON.parse(DEC.decode(plain)) as { day?: unknown; text?: unknown };
    session = { key, salt: rec.salt };
    return {
      day: typeof v.day === "string" ? v.day : "",
      text: typeof v.text === "string" ? v.text : "",
    };
  } catch {
    throw new Error("bad passphrase");
  }
}

export function lockVault(): void {
  session = null;
}

/** Read through the open session. Null when locked/off. */
export async function readVaultText(): Promise<{ day: string; text: string } | null> {
  const rec = readRecord();
  if (!rec || !session) return null;
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBuf(rec.iv) as BufferSource },
      session.key,
      b64ToBuf(rec.data) as BufferSource,
    );
    const v = JSON.parse(DEC.decode(plain)) as { day?: unknown; text?: unknown };
    return {
      day: typeof v.day === "string" ? v.day : "",
      text: typeof v.text === "string" ? v.text : "",
    };
  } catch {
    return null;
  }
}

/** Persist through the open session (fresh IV every write). No-op when locked. */
export async function writeVaultText(day: string, text: string): Promise<void> {
  const rec = readRecord();
  if (!rec || !session) return;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    session.key,
    ENC.encode(JSON.stringify({ day, text })),
  );
  const next: VaultRecord = {
    ...rec,
    iv: bufToB64(iv.buffer as ArrayBuffer),
    data: bufToB64(cipher),
  };
  try {
    localStorage.setItem(nsKey(VAULT_KEY), JSON.stringify(next));
  } catch {}
}

/**
 * Disable: requires the passphrase (proves ownership before the destructive
 * step), returns the plaintext for the caller to restore, then removes the
 * vault record. Throws generically on wrong passphrase.
 */
export async function disableVault(passphrase: string): Promise<{ day: string; text: string }> {
  const v = await unlockVault(passphrase);
  try {
    localStorage.removeItem(nsKey(VAULT_KEY));
  } catch {}
  session = null;
  return v;
}
