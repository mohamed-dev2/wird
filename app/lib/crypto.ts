const ENC = new TextEncoder();
const DEC = new TextDecoder();

const BACKUP_PREFIX = "wird-";

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

export async function encryptBackup(passphrase: string, data: unknown): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ENC.encode(JSON.stringify(data)),
  );
  return JSON.stringify({
    v: 1,
    enc: "AES-GCM/PBKDF2-SHA256-120k",
    salt: bufToB64(salt.buffer as ArrayBuffer),
    iv: bufToB64(iv.buffer as ArrayBuffer),
    data: bufToB64(cipher),
  });
}

export async function decryptBackup(passphrase: string, payload: string): Promise<unknown> {
  const wrap = JSON.parse(payload) as { v: number; salt: string; iv: string; data: string };
  if (wrap.v !== 1 || !wrap.salt || !wrap.iv || !wrap.data) throw new Error("bad backup file");
  const key = await deriveKey(passphrase, b64ToBuf(wrap.salt));
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBuf(wrap.iv) as BufferSource },
    key,
    b64ToBuf(wrap.data) as BufferSource,
  );
  return JSON.parse(DEC.decode(plain));
}

export function collectBackup(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(BACKUP_PREFIX)) {
      const v = localStorage.getItem(k);
      if (v != null) out[k] = v;
    }
  }
  return out;
}

export function restoreBackup(data: unknown): number {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad backup data");
  let n = 0;
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (k.startsWith(BACKUP_PREFIX) && typeof v === "string") {
      localStorage.setItem(k, v);
      n++;
    }
  }
  if (n === 0) throw new Error("no wird keys in backup");
  return n;
}

export function downloadFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
