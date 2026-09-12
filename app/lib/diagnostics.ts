// Local-only observability (1.22): counts and statuses, NEVER personal
// content. Nothing here leaves the device except through an explicit
// user-initiated export (emergency file / diagnostics file).

import { readHealth, readQuarantine, readRecord, SCHEMAS, type StorageLike } from "./schema";
import { readLastBackup } from "./crypto";
import { loadProfiles } from "./profiles";

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
      for (const storedKey of allKeys(st)) {
        if (!isStoredKey(storedKey)) continue;
        if (storedKey === "wird-quarantine-v1" || storedKey === "wird-health-v1") continue;
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
