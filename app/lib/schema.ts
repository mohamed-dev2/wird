// Central data-integrity layer (§1.2–1.4, §1.17).
//
// Lifecycle: read → validate → migrate → normalize → use → mutate →
// validate → persist. App state flows through loadFromStorage /
// saveToStorage (lib/wird.ts), which delegate here.
//
// Backward-compatibility contract:
// - Legacy bare values are accepted as v0 (no envelope).
// - New writes are enveloped: { __wird: { v, updatedAt }, d: <data> }.
// - Validators never strip unknown fields; migrations spread old data.
// - Malformed records are quarantined (capped), never silently dropped.
// - No dependencies; sync only (localStorage is sync).

export type Envelope<T> = { __wird: { v: number; updatedAt: number }; d: T };

export type Schema = {
  /** Current schema version for this dataset. */
  version: number;
  /** Structural check. Must NOT strip unknown fields. */
  validate: (v: unknown) => boolean;
  /** Optional cleanup returning {value, rejected}. Rejects are quarantined, not lost. */
  normalize?: (v: unknown) => { value: unknown; rejected: unknown[] };
  /** Deterministic, idempotent upgrade. Must preserve unknown fields. */
  migrate?: (old: unknown) => unknown;
  fallback: () => unknown;
};

export type ReadStatus =
  "ok" | "legacy" | "migrated" | "fallback-quarantined" | "fallback-empty" | "future-version";

export type HealthKind =
  "corrupt-quarantined" | "quota-full" | "migrated" | "future-version" | "import-rollback";

export type HealthIssue = { key: string; kind: HealthKind; at: number };
export type QuarantineEntry = { key: string; at: number; reason: string; raw: string };

export type StorageLike = {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
  readonly length: number;
  key: (i: number) => string | null;
};

export const QUARANTINE_KEY = "wird-quarantine-v1";
export const HEALTH_KEY = "wird-health-v1";
const QUARANTINE_MAX = 20;
const QUARANTINE_RAW_MAX = 4096;
const HEALTH_MAX = 50;

function browserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

// ---------- primitive validators (non-stripping) ----------

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isStrArr = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const isArr = (v: unknown): v is unknown[] => Array.isArray(v);

const isHabitLike = (v: unknown) =>
  isObj(v) &&
  typeof v.id === "string" &&
  typeof v.title === "string" &&
  typeof v.points === "number";
const isGoalLike = (v: unknown) =>
  isObj(v) && typeof v.title === "string" && typeof v.detail === "string";
const isDreamLike = (v: unknown) =>
  isObj(v) && typeof v.id === "string" && typeof v.title === "string";
const isKidLike = (v: unknown) => isObj(v) && typeof v.name === "string";
const isPledgeLike = (v: unknown) =>
  isObj(v) && typeof v.id === "string" && typeof v.text === "string";
const isQadaLike = (v: unknown) =>
  isObj(v) && typeof v.id === "string" && typeof v.label === "string";
const isChallengeLike = (v: unknown) =>
  isObj(v) &&
  typeof v.id === "string" &&
  typeof v.title === "string" &&
  typeof v.target === "number";
const isReviewLike = (v: unknown) => isObj(v) && isObj(v.items) && typeof v.score === "number";
const isDayRecLike = (v: unknown) =>
  isObj(v) && typeof v.day === "string" && isStrArr(v.ids) && typeof v.pages === "number";
const isProfileLike = (v: unknown) =>
  isObj(v) && typeof v.id === "string" && typeof v.name === "string";

const isDayEnvelope = (v: unknown): v is { day: string } & Record<string, unknown> =>
  isObj(v) && typeof v.day === "string";

const isNumEnvelope = (v: unknown): v is { day: string; value: number } & Record<string, unknown> =>
  isObj(v) && typeof v.day === "string" && typeof v.value === "number";

const isTextEnvelope = (v: unknown): v is { day: string; text: string } & Record<string, unknown> =>
  isObj(v) && typeof v.day === "string" && typeof v.text === "string";

/** Filter array items, collecting rejects for quarantine. */
function filterItems(
  v: unknown,
  keep: (x: unknown) => boolean,
): { value: unknown[]; rejected: unknown[] } | null {
  if (!isArr(v)) return null;
  const value: unknown[] = [];
  const rejected: unknown[] = [];
  v.forEach((x) => {
    try {
      if (keep(x)) value.push(x);
      else rejected.push(x);
    } catch {
      rejected.push(x);
    }
  });
  return { value, rejected };
}

/** Filter record entries, collecting rejects for quarantine. */
function filterRecord(
  v: unknown,
  keep: (x: unknown) => boolean,
): { value: Record<string, unknown>; rejected: unknown[] } | null {
  if (!isObj(v)) return null;
  const value: Record<string, unknown> = {};
  const rejected: unknown[] = [];
  for (const [k, x] of Object.entries(v)) {
    try {
      if (keep(x)) value[k] = x;
      else rejected.push({ key: k, entry: x });
    } catch {
      rejected.push({ key: k, entry: x });
    }
  }
  return { value, rejected };
}

const normArr =
  (keep: (x: unknown) => boolean) =>
  (v: unknown): { value: unknown; rejected: unknown[] } => {
    const r = filterItems(v, keep);
    return r ?? { value: v, rejected: [] };
  };

const normRec =
  (keep: (x: unknown) => boolean) =>
  (v: unknown): { value: unknown; rejected: unknown[] } => {
    const r = filterRecord(v, keep);
    return r ?? { value: v, rejected: [] };
  };

// Pre-envelope v1 shapes: bare array/number/string. Stamped day:""
// (undated legacy) — daily loaders treat "" as current-but-undated,
// exactly how the old code treated bare values. Deterministic + idempotent:
// migrated output already validates, so re-running is a no-op.
const migList = (v: unknown): unknown =>
  Array.isArray(v) ? { day: "", ids: v.filter((x): x is string => typeof x === "string") } : v;
const migNum = (v: unknown): unknown =>
  typeof v === "number" && Number.isFinite(v) ? { day: "", value: v } : v;
const migText = (v: unknown): unknown => (typeof v === "string" ? { day: "", text: v } : v);

// ---------- schema registry (keys are unprefixed dataset keys) ----------

const S = (
  version: number,
  validate: (v: unknown) => boolean,
  fallback: () => unknown,
  extra?: Partial<Pick<Schema, "normalize" | "migrate">>,
): Schema => ({ version, validate, fallback, ...extra });

export const SCHEMAS: Record<string, Schema> = {
  // daily envelopes
  "wird-done-v2": S(
    1,
    (v) => isObj(v) && isStrArr((v as { ids?: unknown }).ids),
    () => ({ day: "", ids: [] }),
    { migrate: migList },
  ),
  "wird-quran-pages-v2": S(1, isNumEnvelope, () => ({ day: "", value: 0 }), {
    migrate: migNum,
  }),
  "wird-tasbeeh-v2": S(1, isNumEnvelope, () => ({ day: "", value: 0 }), { migrate: migNum }),
  "wird-salawat-v2": S(1, isNumEnvelope, () => ({ day: "", value: 0 }), { migrate: migNum }),
  "wird-fast-v2": S(1, isTextEnvelope, () => ({ day: "", text: "" }), { migrate: migText }),
  "wird-forget-v2": S(
    1,
    (v) => isDayEnvelope(v),
    () => ({ day: "", ids: [] as string[] }),
    { migrate: migList },
  ),
  "wird-reflection-v2": S(1, isTextEnvelope, () => ({ day: "", text: "" }), { migrate: migText }),
  "wird-partial-v2": S(
    1,
    (v) => isDayEnvelope(v),
    () => ({ day: "", ids: [] as string[] }),
    { migrate: migList },
  ),
  "wird-snoozed-v2": S(
    1,
    (v) => isDayEnvelope(v),
    () => ({ day: "", ids: [] as string[] }),
    { migrate: migList },
  ),
  "wird-adhkar-groups-v1": S(
    1,
    (v) => isObj(v) && isObj((v as { counts?: unknown }).counts),
    () => ({ day: "", counts: {} }),
  ),
  "wird-lastseen-v1": S(
    1,
    (v) => v === null || isStr(v),
    () => null,
  ),
  "wird-notify-day-v1": S(1, isStr, () => ""),
  // persistent primitives & lists
  "wird-daymode-v1": S(1, isStr, () => "عادي"),
  "wird-customs-v1": S(
    1,
    (v) => isArr(v) && v.every(isHabitLike),
    () => [],
    {
      normalize: normArr(isHabitLike),
    },
  ),
  "wird-duas-v1": S(1, isStrArr, () => []),
  "wird-goals-v1": S(
    1,
    (v) => isArr(v) && v.every(isGoalLike),
    () => [],
    {
      normalize: normArr(isGoalLike),
    },
  ),
  "wird-intention-v1": S(1, isStr, () => ""),
  "wird-remind-v1": S(1, isBool, () => false),
  "wird-ramp-v1": S(1, isBool, () => false),
  "wird-friday-plan-v1": S(1, isBool, () => false),
  "wird-mosque-v1": S(1, isBool, () => false),
  "wird-qada-v1": S(
    1,
    (v) => isArr(v) && v.every(isQadaLike),
    () => [],
    {
      normalize: normArr(isQadaLike),
    },
  ),
  "wird-breaker-v1": S(
    1,
    (v) => v === null || isObj(v),
    () => null,
  ),
  "wird-challenges-v1": S(
    1,
    (v) => isArr(v) && v.every(isChallengeLike),
    () => [],
    {
      normalize: normArr(isChallengeLike),
    },
  ),
  "wird-quran-bookmark-v1": S(
    1,
    (v) => isObj(v) && isNum((v as { surah?: unknown }).surah),
    () => ({ surah: 1, ayah: 1 }),
  ),
  "wird-quran-mem-v1": S(1, isStrArr, () => []),
  "wird-quran-font-v1": S(1, isNum, () => 18),
  "wird-quran-en-v1": S(1, isBool, () => false),
  "wird-reciter-v1": S(1, isStr, () => ""),
  "wird-tafsir-src-v1": S(1, isStr, () => ""),
  "wird-hadith-fav-v1": S(1, isStrArr, () => []),
  "wird-hadith-read-v1": S(1, isStrArr, () => []),
  "wird-paths-v1": S(1, isObj, () => ({})),
  "wird-paths-custom-v1": S(1, isStrArr, () => []),
  "wird-dreams-v1": S(
    1,
    (v) => isArr(v) && v.every(isDreamLike),
    () => [],
    {
      normalize: normArr(isDreamLike),
    },
  ),
  "wird-kids-v1": S(
    1,
    (v) => isArr(v) && v.every(isKidLike),
    () => [],
    {
      normalize: normArr(isKidLike),
    },
  ),
  "wird-pledges-v1": S(
    1,
    (v) => isArr(v) && v.every(isPledgeLike),
    () => [],
    {
      normalize: normArr(isPledgeLike),
    },
  ),
  "wird-history-v1": S(
    1,
    (v) => isObj(v) && Object.values(v).every(isDayRecLike),
    () => ({}),
    {
      normalize: normRec(isDayRecLike),
    },
  ),
  "wird-reviews-v1": S(
    1,
    (v) => isObj(v) && Object.values(v).every(isReviewLike),
    () => ({}),
    {
      normalize: normRec(isReviewLike),
    },
  ),
  "wird-reminders-v1": S(1, isObj, () => ({})),
  "wird-prayer-times-v1": S(1, isObj, () => ({})),
  "wird-profiles-v1": S(
    1,
    (v) => isArr(v) && v.every(isProfileLike),
    () => [],
    {
      normalize: normArr(isProfileLike),
    },
  ),
  "wird-recovery-v1": S(1, isObj, () => ({})),
  "wird-autolock-v1": S(1, isNum, () => 15),
  "wird-theme-v1": S(
    1,
    (v) => v === null || isStr(v),
    () => null,
  ),
  "wird-lang-v1": S(1, isStr, () => "ar"),
  "wird-last-backup-v1": S(
    1,
    (v) => isObj(v) && isNum((v as { at?: unknown }).at),
    () => ({
      at: 0,
      kind: "none",
    }),
  ),
};

// ---------- quarantine + health (global, unprefixed keys) ----------

export function readQuarantine(store?: StorageLike | null): QuarantineEntry[] {
  const st = store ?? browserStorage();
  if (!st) return [];
  try {
    const raw = st.getItem(QUARANTINE_KEY);
    const v = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(v) ? (v as QuarantineEntry[]) : [];
  } catch {
    return [];
  }
}

function saveQuarantine(store: StorageLike, list: QuarantineEntry[]): void {
  try {
    store.setItem(QUARANTINE_KEY, JSON.stringify(list.slice(-QUARANTINE_MAX)));
  } catch {}
}

export function quarantineRecord(
  store: StorageLike,
  key: string,
  reason: string,
  raw: string,
): void {
  try {
    const list = readQuarantine(store);
    list.push({ key, at: Date.now(), reason, raw: raw.slice(0, QUARANTINE_RAW_MAX) });
    // cap total size (~200KB): drop oldest first
    let size = JSON.stringify(list).length;
    while (list.length > 0 && size > 200000) {
      list.shift();
      size = JSON.stringify(list).length;
    }
    saveQuarantine(store, list.slice(-QUARANTINE_MAX));
    logHealth(store, key, "corrupt-quarantined");
  } catch {}
}

export function readHealth(store?: StorageLike | null): HealthIssue[] {
  const st = store ?? browserStorage();
  if (!st) return [];
  try {
    const raw = st.getItem(HEALTH_KEY);
    const v = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(v) ? (v as HealthIssue[]) : [];
  } catch {
    return [];
  }
}

export function logHealth(store: StorageLike, key: string, kind: HealthKind): void {
  try {
    const list = readHealth(store);
    list.push({ key, at: Date.now(), kind });
    store.setItem(HEALTH_KEY, JSON.stringify(list.slice(-HEALTH_MAX)));
  } catch {}
}

// ---------- core read/write ----------

function isEnvelope(v: unknown): v is Envelope<unknown> {
  return isObj(v) && isObj((v as { __wird?: unknown }).__wird);
}

export type ReadOutcome<T> = { value: T; status: ReadStatus };

export type WriteResult = { ok: boolean; quota?: boolean; salvaged?: boolean };

export function readRecord<T>(
  store: StorageLike,
  fullKey: string,
  datasetKey: string,
): ReadOutcome<T> {
  const schema = SCHEMAS[datasetKey];
  const raw = store.getItem(fullKey);
  if (raw == null) {
    const fb = (schema?.fallback() ?? null) as T;
    return { value: fb, status: "fallback-empty" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    quarantineRecord(store, fullKey, "parse", raw);
    const fb = (schema?.fallback() ?? null) as T;
    return { value: fb, status: "fallback-quarantined" };
  }
  let data: unknown = parsed;
  let version = 0;
  if (isEnvelope(parsed)) {
    version = typeof parsed.__wird.v === "number" ? parsed.__wird.v : 0;
    data = (parsed as { d: unknown }).d;
  }
  if (!schema) return { value: data as T, status: version === 0 ? "legacy" : "ok" };
  if (version > schema.version) {
    // Future version: fail safe, preserve stored data untouched.
    logHealth(store, fullKey, "future-version");
    return { value: schema.fallback() as T, status: "future-version" };
  }
  let working = data;
  let migrated = false;
  if (version < schema.version && schema.migrate) {
    try {
      working = schema.migrate(data);
      migrated = true;
      logHealth(store, fullKey, "migrated");
    } catch {
      quarantineRecord(store, fullKey, "migrate", raw);
      return { value: schema.fallback() as T, status: "fallback-quarantined" };
    }
  }
  try {
    if (schema.validate(working)) {
      return {
        value: working as T,
        status: migrated ? "migrated" : version === 0 ? "legacy" : "ok",
      };
    }
  } catch {
    // fall through to normalize
  }
  if (schema.normalize) {
    try {
      const { value, rejected } = schema.normalize(working);
      if (rejected.length > 0) {
        quarantineRecord(
          store,
          fullKey,
          `normalize-rejected-${rejected.length}`,
          JSON.stringify(rejected).slice(0, QUARANTINE_RAW_MAX),
        );
      }
      if (schema.validate(value)) {
        return { value: value as T, status: migrated ? "migrated" : "legacy" };
      }
    } catch {
      // fall through
    }
  }
  quarantineRecord(store, fullKey, "validate", raw);
  return { value: schema.fallback() as T, status: "fallback-quarantined" };
}

export function writeRecord(
  store: StorageLike,
  fullKey: string,
  datasetKey: string,
  value: unknown,
): WriteResult {
  const schema = SCHEMAS[datasetKey];
  let payload: unknown = value;
  let salvaged = false;
  if (schema) {
    let valid = false;
    try {
      valid = schema.validate(value);
    } catch {
      valid = false;
    }
    if (!valid && schema.normalize) {
      // Heal-on-write: persist the valid subset, quarantine the rejects —
      // refusing the whole write would freeze the dataset forever.
      try {
        const { value: clean, rejected } = schema.normalize(value);
        if (schema.validate(clean)) {
          if (rejected.length > 0) {
            quarantineRecord(
              store,
              fullKey,
              `write-salvaged-${rejected.length}`,
              JSON.stringify(rejected).slice(0, QUARANTINE_RAW_MAX),
            );
          }
          payload = clean;
          salvaged = true;
          valid = true;
        }
      } catch {
        valid = false;
      }
    }
    if (!valid) {
      logHealth(store, fullKey, "corrupt-quarantined");
      return { ok: false };
    }
  }
  const envelope: Envelope<unknown> = {
    __wird: { v: schema?.version ?? 0, updatedAt: Date.now() },
    d: payload,
  };
  try {
    store.setItem(fullKey, JSON.stringify(envelope));
    return salvaged ? { ok: true, salvaged: true } : { ok: true };
  } catch (e) {
    const quota = e instanceof Error && /quota/i.test(e.name + e.message);
    if (quota) logHealth(store, fullKey, "quota-full");
    return { ok: false, quota };
  }
}

// ---------- session notices (in-memory; drained by provider) ----------

export type StoreNotice = { kind: "quota"; key: string; at: number };
const notices: StoreNotice[] = [];

export function pushNotice(n: StoreNotice): void {
  notices.push(n);
  if (notices.length > 20) notices.shift();
}

export function drainNotices(): StoreNotice[] {
  return notices.splice(0, notices.length);
}

/**
 * Drop quarantine entries belonging to a deleted profile prefix
 * (e.g. `p_<id>_`). Quarantine raws can hold up to 4KB of that profile's
 * data, so deletion must not leave them behind. Health entries carry no
 * payload (key + kind only) and are kept for forensics.
 */
export function purgeQuarantineForPrefix(store: StorageLike, prefix: string): number {
  try {
    const list = readQuarantine(store);
    const kept = list.filter((e) => !e.key.startsWith(prefix));
    const dropped = list.length - kept.length;
    if (dropped > 0) saveQuarantine(store, kept);
    return dropped;
  } catch {
    return 0;
  }
}
