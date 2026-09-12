import { SCHEMAS, logHealth, quarantineRecord } from "./schema";

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

function isBackupKey(k: string): boolean {
  return k.startsWith("wird-") || (k.startsWith("p_") && k.includes("_wird-"));
}

export function collectBackup(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && isBackupKey(k)) {
      const v = localStorage.getItem(k);
      if (v != null) out[k] = v;
    }
  }
  return out;
}

export function restoreBackup(data: unknown): number {
  return restoreBackupSafe(data).applied;
}

export type RestoreDetail = {
  key: string;
  status: "applied" | "applied-salvaged" | "applied-unknown" | "skipped";
};
export type RestoreReport = {
  applied: number;
  salvaged: number;
  skipped: number;
  quarantined: number;
  rolledBack: boolean;
  details: RestoreDetail[];
};
export type PreviewReport = {
  total: number;
  valid: number;
  salvagable: number;
  invalid: number;
  unknownKeys: number;
};

/** Strip per-profile prefix (p_<id>_) to reach the dataset key for schema lookup. */
export function datasetKeyOf(storedKey: string): string {
  const m = /^p_[^_]+_(wird-.*)$/.exec(storedKey);
  return m?.[1] ?? storedKey;
}

function unwrapEnvelope(parsed: unknown): unknown {
  if (
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    "__wird" in (parsed as Record<string, unknown>)
  ) {
    return (parsed as { d: unknown }).d;
  }
  return parsed;
}

function classifyValue(
  datasetKey: string,
  raw: string,
): "valid" | "salvagable" | "invalid" | "unknown" {
  const schema = SCHEMAS[datasetKey];
  if (!schema) return "unknown";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "invalid";
  }
  const data = unwrapEnvelope(parsed);
  try {
    if (schema.validate(data)) return "valid";
  } catch {
    // fall through to normalize
  }
  if (schema.normalize) {
    try {
      const { value } = schema.normalize(data);
      if (schema.validate(value)) return "salvagable";
    } catch {
      // fall through
    }
  }
  return "invalid";
}

/** Dry-run: report what an import would do, without touching storage. */
export function previewRestore(data: unknown): PreviewReport {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad backup data");
  const report: PreviewReport = { total: 0, valid: 0, salvagable: 0, invalid: 0, unknownKeys: 0 };
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (!isBackupKey(k) || typeof v !== "string") continue;
    report.total++;
    const c = classifyValue(datasetKeyOf(k), v);
    if (c === "valid") report.valid++;
    else if (c === "salvagable") report.salvagable++;
    else if (c === "unknown") report.unknownKeys++;
    else report.invalid++;
  }
  if (report.total === 0) throw new Error("no wird keys in backup");
  return report;
}

/**
 * Validated, atomic import. Snapshots overwritten keys first; valid entries
 * are applied, invalid ones quarantined (never silently dropped). On
 * unexpected failure mid-restore the snapshot is rolled back.
 */
export function restoreBackupSafe(data: unknown): RestoreReport {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad backup data");
  const entries = Object.entries(data as Record<string, unknown>).filter(
    (e): e is [string, string] => isBackupKey(e[0] as string) && typeof e[1] === "string",
  );
  if (entries.length === 0) throw new Error("no wird keys in backup");
  const store = localStorage;
  const snapshot = new Map<string, string | null>();
  for (const [k] of entries) {
    if (!snapshot.has(k)) {
      try {
        snapshot.set(k, store.getItem(k));
      } catch {
        snapshot.set(k, null);
      }
    }
  }
  const report: RestoreReport = {
    applied: 0,
    salvaged: 0,
    skipped: 0,
    quarantined: 0,
    rolledBack: false,
    details: [],
  };
  try {
    for (const [k, v] of entries) {
      const schema = SCHEMAS[datasetKeyOf(k)];
      if (!schema) {
        store.setItem(k, v);
        report.applied++;
        report.details.push({ key: k, status: "applied-unknown" });
        continue;
      }
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(v);
      } catch {
        quarantineRecord(store, k, "import-parse", v);
        report.skipped++;
        report.quarantined++;
        report.details.push({ key: k, status: "skipped" });
        continue;
      }
      const content = unwrapEnvelope(parsed);
      let ok = false;
      try {
        ok = schema.validate(content);
      } catch {
        ok = false;
      }
      if (ok) {
        store.setItem(k, v);
        report.applied++;
        report.details.push({ key: k, status: "applied" });
        continue;
      }
      if (schema.normalize) {
        try {
          const { value, rejected } = schema.normalize(content);
          if (schema.validate(value)) {
            if (rejected.length > 0) {
              quarantineRecord(
                store,
                k,
                `import-salvaged-${rejected.length}`,
                JSON.stringify(rejected).slice(0, 4096),
              );
              report.quarantined++;
            }
            store.setItem(
              k,
              JSON.stringify({ __wird: { v: schema.version, updatedAt: Date.now() }, d: value }),
            );
            report.applied++;
            report.salvaged++;
            report.details.push({ key: k, status: "applied-salvaged" });
            continue;
          }
        } catch {
          // fall through to quarantine
        }
      }
      quarantineRecord(store, k, "import-validate", v);
      report.skipped++;
      report.quarantined++;
      report.details.push({ key: k, status: "skipped" });
    }
  } catch (e) {
    // Roll back to the pre-import snapshot; never leave a half-applied import.
    try {
      for (const [k, prev] of snapshot) {
        if (prev == null) store.removeItem(k);
        else store.setItem(k, prev);
      }
      report.rolledBack = true;
      logHealth(store, "import", "import-rollback");
    } catch {}
    throw e;
  }
  if (report.applied === 0) throw new Error("no valid wird keys in backup");
  return report;
}

export type BackupFileV2 = {
  v: 2;
  app: "wird";
  exportedAt: string;
  count: number;
  data: Record<string, string>;
};

/** Manifest-wrapped export (v2). Encrypted exports keep the raw map (decrypt → map). */
export function buildBackupFile(): BackupFileV2 {
  const data = collectBackup();
  return {
    v: 2,
    app: "wird",
    exportedAt: new Date().toISOString(),
    count: Object.keys(data).length,
    data,
  };
}

/** Accept v2 manifest, legacy v1 ({v:1,data} / {plain,data}), or a raw key map. */
export function parseBackupFile(text: string): unknown {
  const parsed = JSON.parse(text) as unknown;
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const rec = parsed as Record<string, unknown>;
    if (rec.app === "wird" && rec.v === 2 && rec.data && typeof rec.data === "object")
      return rec.data;
    if ("data" in rec && rec.data && typeof rec.data === "object") return rec.data;
  }
  return parsed;
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
