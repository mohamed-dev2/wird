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

/**
 * AES-GCM backup encryption: fresh 128-bit salt + 96-bit IV per backup,
 * PBKDF2-SHA256 120k. The password lives in memory only and is never
 * stored, logged, or embedded.
 * @param data Manifest envelope (wrapForEncryption) or legacy raw map.
 */
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

/**
 * Decrypt + parse. Every failure mode (bad JSON, bad shape, wrong password,
 * tampered ciphertext) surfaces as a generic "bad backup file" — callers
 * must never leak which step failed (padding-oracle hygiene).
 */
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

/**
 * @deprecated Use `restoreBackupSafe` to get a full `RestoreReport`
 * (applied/skipped/quarantined counts and per-key details). This thin
 * wrapper only returns the applied count and hides quarantine outcomes.
 * Migration: `restoreBackup(data)` → `restoreBackupSafe(data).applied`.
 * Removal target: next major version after the analytics era. Legacy
 * callers inside the repo were migrated in v0.1.0.
 */
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

/**
 * Dry-run: report what an import would do (valid/salvageable/invalid/
 * unknown counts) without touching storage. Callers confirm with the user
 * before committing.
 */
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
 * Validated, atomic import. Phase 1 classifies EVERYTHING without writing
 * a byte (zero applicable entries → rejected untouched); phase 2 snapshots
 * overwritten keys, applies valid, salvages partial, quarantines corrupt,
 * and rolls the snapshot back on mid-restore failure.
 * @param data Backup map (raw, decrypted, or manifest-unwrapped).
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
export type BackupScope = { kind: "device" | "profile" };
export type BackupFileV2 = {
  v: 2;
  app: "wird";
  format: number;
  appVersion: string;
  exportedAt: string;
  encrypted: false;
  count: number;
  integrity: string;
  scope?: BackupScope;
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

/**
 * Manifest-wrapped export (v2): format version, app version, timestamp,
 * dataset inventory with versions + record counts, and a tamper-evident
 * checksum. Encrypted exports wrap separately (see below).
 */
export function buildBackupFile(
  data: Record<string, string> = collectBackup(),
  scope: BackupScope = { kind: "device" },
): BackupFileV2 {
  return {
    v: 2,
    app: "wird",
    format: BACKUP_FORMAT,
    appVersion: WIRD_APP_VERSION,
    exportedAt: new Date().toISOString(),
    encrypted: false,
    count: Object.keys(data).length,
    integrity: checksumStr(JSON.stringify(data)),
    scope,
    datasets: describeDatasets(data),
    data,
  };
}

/** cyrb53 hex: tamper-EVIDENT checksum for plain backups (GCM already
 *  authenticates encrypted ones). NOT cryptographic — detects accidents
 *  and casual edits, not a dedicated attacker. Documented as such. */
export function checksumStr(s: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/** Verify a parsed backup file's integrity claim. True when the file makes
 *  no claim (legacy) — absence of evidence is reported, never punishment. */
export function verifyBackupIntegrity(parsed: unknown): boolean {
  try {
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return true;
    const rec = parsed as Record<string, unknown>;
    if (typeof rec.integrity !== "string" || !rec.data || typeof rec.data !== "object") {
      return true;
    }
    return checksumStr(JSON.stringify(rec.data)) === rec.integrity;
  } catch {
    return true;
  }
}

/** Distinct profile ids contained in a backup map (for pre-import review). */
export function profilesInBackup(data: unknown): string[] {
  try {
    if (!data || typeof data !== "object" || Array.isArray(data)) return [];
    const out = new Set<string>();
    for (const k of Object.keys(data as Record<string, unknown>)) {
      const m = /^p_([^_]+)_/.exec(k);
      if (m?.[1]) out.add(m[1]);
    }
    return [...out];
  } catch {
    return [];
  }
}

/**
 * Decide whether an import should be retargeted at the active profile.
 * Returns {from, to} ONLY when the backup holds exactly one foreign profile
 * and nothing for the active one — any ambiguity keeps keys untouched.
 * Whole-device restores on the same device never trigger (ids match).
 */
export function planProfileRemap(
  data: unknown,
  activeId: string | null,
): { from: string; to: string } | null {
  try {
    if (!activeId) return null;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const keys = Object.keys(data as Record<string, unknown>);
    const foreign = new Set<string>();
    let hasActive = false;
    for (const k of keys) {
      const m = /^p_([^_]+)_/.exec(k);
      if (!m?.[1]) continue;
      if (m[1] === activeId) hasActive = true;
      else foreign.add(m[1]);
    }
    if (hasActive || foreign.size !== 1) return null;
    const from = [...foreign][0];
    if (!from || from === activeId) return null;
    return { from, to: activeId };
  } catch {
    return null;
  }
}

/** Rename one profile prefix across a backup map (pure; original untouched). */
export function remapBackupProfile(
  data: Record<string, unknown>,
  from: string,
  to: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const prefix = `p_${from}_`;
  const next = `p_${to}_`;
  for (const [k, v] of Object.entries(data)) {
    out[k.startsWith(prefix) ? next + k.slice(prefix.length) : k] = v;
  }
  return out;
}

/** Collect a whole-device backup, or just one profile + globals. */
export function collectBackupFor(profileId: string | null): Record<string, string> {
  const all = collectBackup();
  if (!profileId) return all;
  const prefix = `p_${profileId}_`;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(all)) {
    if (!k.startsWith("p_") || k.startsWith(prefix)) out[k] = v;
  }
  return out;
}

/** Export filenames stay recognizable but unique per file (no overwrites). */
export function backupFilename(prefix: string, ext = "json"): string {
  const stamp = new Date().toISOString().slice(0, 10);
  let rand = "";
  try {
    rand = [...crypto.getRandomValues(new Uint8Array(2))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    rand = Math.floor(Math.random() * 65536).toString(16);
  }
  return `${prefix}${stamp}-${rand}.${ext}`;
}

export type ExportKind = "file-plain" | "file-enc" | "qr" | "lan" | "emergency" | "diagnostics";
export type ExportLogEntry = { at: number; kind: ExportKind; count: number };
const EXPORT_LOG_KEY = "wird-export-log-v1";
const EXPORT_LOG_MAX = 50;

/** Local consent log: WHAT left the device and when — never the content.
 *  Shown in Account → backup so sharing stays visible to its owner. */
export function logExport(kind: ExportKind, count: number): void {
  try {
    const raw = localStorage.getItem(EXPORT_LOG_KEY);
    const list = (raw ? JSON.parse(raw) : []) as ExportLogEntry[];
    const next = Array.isArray(list) ? list : [];
    next.push({ at: Date.now(), kind, count });
    localStorage.setItem(EXPORT_LOG_KEY, JSON.stringify(next.slice(-EXPORT_LOG_MAX)));
  } catch {}
}

export function readExportLog(): ExportLogEntry[] {
  try {
    const raw = localStorage.getItem(EXPORT_LOG_KEY);
    const list = (raw ? JSON.parse(raw) : []) as unknown;
    return Array.isArray(list) ? (list as ExportLogEntry[]) : [];
  } catch {
    return [];
  }
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
  scope?: BackupScope;
  datasets: Record<string, BackupDatasetInfo>;
  data: Record<string, string>;
};

export function wrapForEncryption(
  data: Record<string, string>,
  scope: BackupScope = { kind: "device" },
): EncryptedBackupPayload {
  return {
    v: 2,
    app: "wird",
    format: BACKUP_FORMAT,
    appVersion: WIRD_APP_VERSION,
    exportedAt: new Date().toISOString(),
    encrypted: true,
    count: Object.keys(data).length,
    scope,
    datasets: describeDatasets(data),
    data,
  };
}

/**
 * Accept the encrypted envelope OR a legacy raw key map (pre-manifest
 * backups keep restoring). Throws a generic error — callers must not leak
 * crypto details into UI copy.
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
