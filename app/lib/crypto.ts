import { SCHEMAS, logHealth, quarantineRecord, writeRecord } from "./schema";

/** Bump alongside package.json — stamped into every backup manifest. */
export const WIRD_APP_VERSION = "0.1.0";
/** Backup container format version (1 = legacy raw map / {data}, 2 = manifest). */
export const BACKUP_FORMAT = 2;

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
  let wrap: { v: number; salt: string; iv: string; data: string };
  try {
    wrap = JSON.parse(payload) as { v: number; salt: string; iv: string; data: string };
  } catch {
    throw new Error("bad backup file");
  }
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
 * Validated, atomic import. Two phases:
 *  1. classify EVERYTHING without writing a byte — a backup with zero
 *     applicable entries is rejected before current state is touched;
 *  2. snapshot overwritten keys, then apply valid / salvage partial /
 *     quarantine corrupt. Unexpected mid-restore failures roll back.
 * Per-entry corruption therefore never blocks healthy entries (with an
 * explicit report), and never leaves a half-applied import behind.
 */
export function restoreBackupSafe(data: unknown): RestoreReport {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad backup data");
  const raws = Object.entries(data as Record<string, unknown>).filter(
    (e): e is [string, string] => isBackupKey(e[0] as string) && typeof e[1] === "string",
  );
  if (raws.length === 0) throw new Error("no wird keys in backup");

  type Plan = {
    key: string;
    raw: string;
    action: "apply" | "unknown" | "salvage" | "invalid";
    value?: unknown;
    rejected?: unknown[];
    reason?: "parse" | "validate";
  };
  // Phase 1: pure classification, zero storage writes.
  const plan: Plan[] = raws.map(([k, v]) => {
    const schema = SCHEMAS[datasetKeyOf(k)];
    if (!schema) return { key: k, raw: v, action: "unknown" };
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(v);
    } catch {
      return { key: k, raw: v, action: "invalid", reason: "parse" };
    }
    const content = unwrapEnvelope(parsed);
    try {
      if (schema.validate(content)) return { key: k, raw: v, action: "apply" };
    } catch {
      // fall through to normalize
    }
    if (schema.normalize) {
      try {
        const { value, rejected } = schema.normalize(content);
        if (schema.validate(value)) return { key: k, raw: v, action: "salvage", value, rejected };
      } catch {
        // fall through
      }
    }
    return { key: k, raw: v, action: "invalid", reason: "validate" };
  });
  if (!plan.some((p) => p.action !== "invalid")) {
    throw new Error("no valid wird keys in backup");
  }

  // Phase 2: snapshot + commit.
  const store = localStorage;
  const snapshot = new Map<string, string | null>();
  for (const p of plan) {
    if (!snapshot.has(p.key)) {
      try {
        snapshot.set(p.key, store.getItem(p.key));
      } catch {
        snapshot.set(p.key, null);
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
    for (const p of plan) {
      const k = p.key;
      if (p.action === "unknown" || p.action === "apply") {
        store.setItem(k, p.raw);
        report.applied++;
        report.details.push({
          key: k,
          status: p.action === "unknown" ? "applied-unknown" : "applied",
        });
      } else if (p.action === "salvage") {
        const schema = SCHEMAS[datasetKeyOf(k)];
        const rejected = p.rejected ?? [];
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
          JSON.stringify({
            __wird: { v: schema?.version ?? 0, updatedAt: Date.now() },
            d: p.value,
          }),
        );
        report.applied++;
        report.salvaged++;
        report.details.push({ key: k, status: "applied-salvaged" });
      } else {
        quarantineRecord(store, k, `import-${p.reason}`, p.raw);
        report.skipped++;
        report.quarantined++;
        report.details.push({ key: k, status: "skipped" });
      }
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

export type BackupDatasetInfo = { version: number; records: number };
export type BackupFileV2 = {
  v: 2;
  app: "wird";
  format: number;
  appVersion: string;
  exportedAt: string;
  encrypted: false;
  count: number;
  datasets: Record<string, BackupDatasetInfo>;
  data: Record<string, string>;
};

/** Best-effort record count for a stored raw value (arrays/objects → size, else 1). */
function countRecords(raw: string): number {
  try {
    const content = unwrapEnvelope(JSON.parse(raw));
    if (Array.isArray(content)) return content.length;
    if (content && typeof content === "object") return Object.keys(content).length;
    return 1;
  } catch {
    return 0;
  }
}

function describeDatasets(data: Record<string, string>): Record<string, BackupDatasetInfo> {
  const out: Record<string, BackupDatasetInfo> = {};
  for (const [k, v] of Object.entries(data)) {
    const ds = datasetKeyOf(k);
    const schema = SCHEMAS[ds];
    const cur = out[ds] ?? { version: schema?.version ?? 0, records: 0 };
    cur.records += countRecords(v);
    out[ds] = cur;
  }
  return out;
}

/** Manifest-wrapped export (v2). Encrypted exports wrap separately (see below). */
export function buildBackupFile(): BackupFileV2 {
  const data = collectBackup();
  return {
    v: 2,
    app: "wird",
    format: BACKUP_FORMAT,
    appVersion: WIRD_APP_VERSION,
    exportedAt: new Date().toISOString(),
    encrypted: false,
    count: Object.keys(data).length,
    datasets: describeDatasets(data),
    data,
  };
}

/**
 * Encrypted-transfer envelope: the SAME integrity manifest travels inside the
 * ciphertext (never beside it), so QR/LAN/file-encrypted imports can verify
 * format, version, and dataset inventory before touching storage.
 */
export type EncryptedBackupPayload = {
  v: 2;
  app: "wird";
  format: number;
  appVersion: string;
  exportedAt: string;
  encrypted: true;
  count: number;
  datasets: Record<string, BackupDatasetInfo>;
  data: Record<string, string>;
};

export function wrapForEncryption(data: Record<string, string>): EncryptedBackupPayload {
  return {
    v: 2,
    app: "wird",
    format: BACKUP_FORMAT,
    appVersion: WIRD_APP_VERSION,
    exportedAt: new Date().toISOString(),
    encrypted: true,
    count: Object.keys(data).length,
    datasets: describeDatasets(data),
    data,
  };
}

/**
 * Accept the encrypted envelope OR a legacy raw key map (pre-manifest
 * backups). Throws a generic error — callers must not leak crypto details.
 */
export function unwrapDecrypted(payload: unknown): Record<string, string> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const rec = payload as Record<string, unknown>;
    if (rec.app === "wird" && rec.encrypted === true && rec.data && typeof rec.data === "object") {
      return rec.data as Record<string, string>;
    }
    const keys = Object.keys(payload);
    if (keys.length > 0 && keys.every((k) => isBackupKey(k))) {
      return payload as Record<string, string>;
    }
  }
  throw new Error("bad backup data");
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

/** Stamp a successful export/import for the local diagnostics card. */
export function markBackup(kind: "export" | "import"): void {
  try {
    writeRecord(localStorage, "wird-last-backup-v1", "wird-last-backup-v1", {
      at: Date.now(),
      kind,
    });
  } catch {}
}

export function readLastBackup(): { at: number; kind: string } {
  try {
    const raw = localStorage.getItem("wird-last-backup-v1");
    if (!raw) return { at: 0, kind: "none" };
    const v = JSON.parse(raw) as unknown;
    const d =
      v && typeof v === "object" && "__wird" in (v as Record<string, unknown>)
        ? (v as { d: unknown }).d
        : v;
    if (d && typeof d === "object" && typeof (d as { at?: unknown }).at === "number") {
      const r = d as { at: number; kind?: unknown };
      return { at: r.at, kind: typeof r.kind === "string" ? r.kind : "unknown" };
    }
  } catch {}
  return { at: 0, kind: "none" };
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
