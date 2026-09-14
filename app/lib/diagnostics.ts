// Local-only observability (1.22): counts and statuses, NEVER personal
// content. Nothing here leaves the device except through an explicit
// user-initiated export (emergency file / diagnostics file).

import {
  readHealth,
  readQuarantine,
  readRecord,
  SCHEMAS,
  type QuarantineEntry,
  type StorageLike,
} from "./schema";
import { readLastBackup } from "./crypto";
import { loadProfiles } from "./profiles";
import { isPrivatePlansKey, privatePlansExcluded } from "./private-plans";

function browserStore(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function allKeys(store: StorageLike): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k) out.push(k);
    }
  } catch {}
  return out;
}

function isStoredKey(k: string): boolean {
  return k.startsWith("wird-") || (k.startsWith("p_") && k.includes("_wird-"));
}

function splitKey(storedKey: string): { profile: string | null; dataset: string } {
  const m = /^p_([^_]+)_(wird-.*)$/.exec(storedKey);
  if (m) return { profile: m[1] ?? null, dataset: m[2] ?? storedKey };
  return { profile: null, dataset: storedKey };
}

// ---------- readiness (STEP 7.26/7.27) ----------

export type StorageProbe = "ok" | "denied" | "full";

/**
 * Actually write + delete a probe key: a health check must test the thing
 * it claims (7.26), not merely report that the process runs. Transient
 * probe key, removed in the same call — never persisted, never backed up.
 */
export function probeStorage(store?: StorageLike | null): StorageProbe {
  const st = store ?? browserStore();
  if (!st) return "denied";
  try {
    st.setItem("wird-probe-v1", "1");
  } catch (e) {
    const msg = `${(e as Error)?.name ?? ""} ${(e as Error)?.message ?? e}`;
    return /quota/i.test(msg) ? "full" : "denied";
  }
  try {
    const v = st.getItem("wird-probe-v1");
    st.removeItem("wird-probe-v1");
    return v === "1" ? "ok" : "denied";
  } catch {
    return "denied";
  }
}

export type Readiness = {
  /** Servable state. False = writes impossible or newer-version data
   * present — the app degrades to explicit read-only messaging, never a
   * silent corrupted state (7.27/7.28). Boot itself never blocks. */
  ready: boolean;
  storage: StorageProbe;
  futureVersionKeys: number;
  quarantineEntries: number;
  notes: Array<"storage-denied" | "storage-full" | "future-versions" | "quarantine-near-cap">;
};

/**
 * Compose a readiness verdict from a diagnostics snapshot + live probe.
 * Pure and unit-tested; surfaced today through the per-dataset statuses
 * on /recovery (same numbers, no new screen), and available to any host
 * probe that needs liveness vs readiness split.
 */
export function summarizeReadiness(
  snap: Pick<DiagnosticsSnapshot, "futureVersionKeys" | "quarantineEntries">,
  storage: StorageProbe,
): Readiness {
  const notes: Readiness["notes"] = [];
  // QUARANTINE_MAX is 20 in schema.ts: warn while headroom still exists.
  if (storage === "full") notes.push("storage-full");
  else if (storage === "denied") notes.push("storage-denied");
  if (snap.futureVersionKeys > 0) notes.push("future-versions");
  if (snap.quarantineEntries >= 18) notes.push("quarantine-near-cap");
  return {
    ready: notes.length === 0,
    storage,
    futureVersionKeys: snap.futureVersionKeys,
    quarantineEntries: snap.quarantineEntries,
    notes,
  };
}

export type ScrubbedQuarantine = { key: string; at: number; reason: string; bytes: number };

/**
 * Strip quarantine raws for anything that leaves the device (7.39/7.40/
 * 7.48): raws are arbitrary user bytes (reflections, notes, any dataset)
 * and must never travel in diagnostics exports. Metadata only.
 */
export function scrubQuarantine(entries: QuarantineEntry[]): ScrubbedQuarantine[] {
  return (Array.isArray(entries) ? entries : []).map((e) => ({
    key: typeof e?.key === "string" ? e.key : "?",
    at: typeof e?.at === "number" ? e.at : 0,
    reason: typeof e?.reason === "string" ? e.reason : "?",
    bytes: typeof e?.raw === "string" ? e.raw.length : 0,
  }));
}

export type IncidentState = "normal" | "degraded" | "major" | "recovering";

/**
 * Operational state from a readiness verdict (7.44): normal (nothing
 * flagged), degraded (foreign versions piling quarantine — watch),
 * major (writes impossible — act). Recovering/resolved are operator
 * judgments recorded in postmortems, never auto-claimed.
 */
export function incidentState(r: Pick<Readiness, "ready" | "storage">): IncidentState {
  if (r.storage !== "ok") return "major";
  if (!r.ready) return "degraded";
  return "normal";
}

export type InvariantViolation = { code: string; key: string; detail: string };

/**
 * Cross-record invariants (7.38): referential checks the per-dataset
 * validators cannot see. Returns violations (empty = clean), never throws.
 * Checks: history/review day-ids well-formed; guide-log kinds known;
 * quarantine raws within cap.
 */
export function checkInvariants(store?: StorageLike | null): InvariantViolation[] {
  const out: InvariantViolation[] = [];
  try {
    const st = store ?? browserStore();
    if (!st) return out;
    const dayRe = /^\d{4}-\d{2}-\d{2}$/;
    // Guide-log kinds are namespaced by construction (state:<STATE>,
    // once:<STATE>, once:CHALLENGE_MILESTONE:<id>); legacy bare action
    // names predate namespacing. Anything else is foreign data.
    const knownKinds = new Set([
      "rescue",
      "review",
      "core",
      "intention",
      "tawbah",
      "quran",
      "friday",
      "none",
      "milestone",
    ]);
    const getAllKeys = (): string[] => {
      const keys: string[] = [];
      for (let i = 0; i < st.length; i++) {
        const k = st.key(i);
        if (k) keys.push(k);
      }
      return keys;
    };
    const readJson = (k: string): unknown => {
      try {
        const raw = st.getItem(k);
        return raw == null ? null : JSON.parse(raw);
      } catch {
        return undefined;
      }
    };
    const unwrap = (parsed: unknown): unknown =>
      parsed && typeof parsed === "object" && !Array.isArray(parsed) && "__wird" in parsed
        ? (parsed as { d?: unknown }).d
        : parsed;
    for (const k of getAllKeys()) {
      const bare = k.replace(/^p_[^_]+_/, "");
      if (bare === "wird-history-v1" || bare === "wird-reviews-v1") {
        const d = unwrap(readJson(k));
        if (d && typeof d === "object" && !Array.isArray(d)) {
          for (const day of Object.keys(d as Record<string, unknown>)) {
            if (!dayRe.test(day))
              out.push({ code: "bad-day-id", key: k, detail: day.slice(0, 24) });
          }
        }
      }
      if (bare === "wird-guide-log-v1") {
        const d = unwrap(readJson(k));
        if (Array.isArray(d)) {
          for (const e of d.slice(-30)) {
            const kind = (e as { kind?: unknown })?.kind;
            if (
              typeof kind === "string" &&
              !knownKinds.has(kind) &&
              !kind.startsWith("state:") &&
              !kind.startsWith("once:")
            ) {
              out.push({ code: "unknown-guide-kind", key: k, detail: kind.slice(0, 24) });
              break;
            }
          }
        }
      }
    }
    try {
      const q = readQuarantine(st);
      for (const e of q) {
        if (typeof e?.raw === "string" && e.raw.length > 4096) {
          out.push({ code: "quarantine-over-cap", key: e.key, detail: String(e.raw.length) });
        }
      }
    } catch {}
  } catch {}
  return out;
}

export type DatasetStatus = "ok" | "legacy" | "migrated" | "quarantined" | "future" | "unknown";

export type DatasetReport = {
  storedKey: string;
  dataset: string;
  profile: string | null;
  status: DatasetStatus;
  records: number;
};

function countRecordsOf(value: unknown): number {
  try {
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === "object") return Object.keys(value).length;
    return value == null ? 0 : 1;
  } catch {
    return 0;
  }
}

export function scanDatasets(store?: StorageLike | null): DatasetReport[] {
  const st = store ?? browserStore();
  if (!st) return [];
  const out: DatasetReport[] = [];
  for (const storedKey of allKeys(st)) {
    if (!isStoredKey(storedKey)) continue;
    if (storedKey === "wird-quarantine-v1" || storedKey === "wird-health-v1") continue;
    const { profile, dataset } = splitKey(storedKey);
    if (!SCHEMAS[dataset]) {
      out.push({ storedKey, dataset, profile, status: "unknown", records: 0 });
      continue;
    }
    try {
      const { value, status } = readRecord<unknown>(st, storedKey, dataset);
      out.push({
        storedKey,
        dataset,
        profile,
        status:
          status === "fallback-quarantined"
            ? "quarantined"
            : status === "future-version"
              ? "future"
              : status === "fallback-empty"
                ? "quarantined"
                : status,
        records: countRecordsOf(value),
      });
    } catch {
      out.push({ storedKey, dataset, profile, status: "quarantined", records: 0 });
    }
  }
  return out.sort((a, b) => a.storedKey.localeCompare(b.storedKey));
}

export type DiagnosticsSnapshot = {
  takenAt: string;
  profiles: number;
  datasets: number;
  storedKeys: number;
  quarantinedKeys: number;
  quarantineEntries: number;
  futureVersionKeys: number;
  lastBackup: { at: number; kind: string };
  lastMigrationAt: number;
  serviceWorker: boolean;
  transferReady: boolean;
};

export function collectDiagnostics(store?: StorageLike | null): DiagnosticsSnapshot {
  const reports = scanDatasets(store);
  let profiles = 0;
  try {
    profiles = loadProfiles().length;
  } catch {}
  let lastMigrationAt = 0;
  try {
    for (const h of readHealth(store ?? undefined)) {
      if (h.kind === "migrated" && h.at > lastMigrationAt) lastMigrationAt = h.at;
    }
  } catch {}
  let serviceWorker = false;
  try {
    serviceWorker =
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      !!navigator.serviceWorker.controller;
  } catch {}
  return {
    takenAt: new Date().toISOString(),
    profiles,
    datasets: Object.keys(SCHEMAS).length,
    storedKeys: reports.length,
    quarantinedKeys: reports.filter((r) => r.status === "quarantined").length,
    quarantineEntries: (() => {
      try {
        return readQuarantine(store ?? undefined).length;
      } catch {
        return 0;
      }
    })(),
    futureVersionKeys: reports.filter((r) => r.status === "future").length,
    lastBackup: (() => {
      try {
        return readLastBackup();
      } catch {
        return { at: 0, kind: "none" };
      }
    })(),
    lastMigrationAt,
    serviceWorker,
    transferReady: true,
  };
}

export type EmergencyExport = {
  v: 1;
  app: "wird";
  kind: "emergency";
  exportedAt: string;
  summary: { recovered: number; corrupted: number; skipped: number };
  schemas: Record<string, number>;
  datasets: Record<string, { status: "recovered" | "corrupted" | "skipped"; value?: unknown }>;
  quarantine: ReturnType<typeof readQuarantine>;
  health: ReturnType<typeof readHealth>;
};

/**
 * Last-resort export: whatever is recoverable, plus an honest corruption
 * report. Corrupted entries are reported WITHOUT pretending they are
 * healthy (no value included); quarantine raws travel along for manual
 * recovery. Never throws on bad data — worst case it exports the report.
 */
export function buildEmergencyExport(store?: StorageLike | null): EmergencyExport {
  const st = store ?? browserStore();
  const datasets: EmergencyExport["datasets"] = {};
  const summary = { recovered: 0, corrupted: 0, skipped: 0 };
  try {
    if (st) {
      // Honors the private-plans backup exclusion: an excluded plan is
      // never smuggled out through the emergency path either.
      const skipPrivate = privatePlansExcluded();
      for (const storedKey of allKeys(st)) {
        if (!isStoredKey(storedKey)) continue;
        if (storedKey === "wird-quarantine-v1" || storedKey === "wird-health-v1") continue;
        if (skipPrivate && isPrivatePlansKey(storedKey)) continue;
        const { dataset } = splitKey(storedKey);
        try {
          const { value, status } = readRecord<unknown>(st, storedKey, dataset);
          if (status === "fallback-quarantined" || status === "fallback-empty") {
            datasets[storedKey] = { status: "corrupted" };
            summary.corrupted++;
          } else if (status === "future-version") {
            datasets[storedKey] = { status: "skipped" };
            summary.skipped++;
          } else {
            datasets[storedKey] = { status: "recovered", value };
            summary.recovered++;
          }
        } catch {
          datasets[storedKey] = { status: "corrupted" };
          summary.corrupted++;
        }
      }
    }
  } catch {}
  const schemas: Record<string, number> = {};
  for (const [k, s] of Object.entries(SCHEMAS)) schemas[k] = s.version;
  let quarantine: EmergencyExport["quarantine"] = [];
  let health: EmergencyExport["health"] = [];
  try {
    quarantine = readQuarantine(st ?? undefined);
  } catch {}
  try {
    health = readHealth(st ?? undefined);
  } catch {}
  return {
    v: 1,
    app: "wird",
    kind: "emergency",
    exportedAt: new Date().toISOString(),
    summary,
    schemas,
    datasets,
    quarantine,
    health,
  };
}
