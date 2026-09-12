import { beforeEach, describe, expect, it } from "vitest";
import {
  buildBackupFile,
  collectBackup,
  datasetKeyOf,
  parseBackupFile,
  previewRestore,
  restoreBackup,
  restoreBackupSafe,
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
    clear: () => m.clear(),
  };
}

const DAY = JSON.stringify({ day: "2026-09-12", value: 5 });

beforeEach(() => {
  (globalThis as unknown as { localStorage: unknown }).localStorage = memStorage();
});

describe("backup manifest + safe restore", () => {
  it("round-trips v2 manifest, legacy v1, and raw maps", () => {
    localStorage.setItem("wird-daymode-v1", JSON.stringify("عادي"));
    const file = buildBackupFile();
    expect(file.v).toBe(2);
    expect(file.app).toBe("wird");
    expect(file.format).toBe(2);
    expect(file.encrypted).toBe(false);
    expect(file.count).toBe(1);
    expect(file.datasets["wird-daymode-v1"]).toEqual({ version: 1, records: 1 });
    expect(parseBackupFile(JSON.stringify(file))).toEqual(collectBackup());
    expect(parseBackupFile(JSON.stringify({ v: 1, plain: true, data: { a: "b" } }))).toEqual({
      a: "b",
    });
    expect(parseBackupFile(JSON.stringify({ "wird-daymode-v1": "x" }))).toEqual({
      "wird-daymode-v1": "x",
    });
  });

  it("applies valid entries, quarantines corrupt ones, keeps unknown keys", () => {
    const report = restoreBackupSafe({
      "wird-tasbeeh-v2": DAY,
      "wird-daymode-v1": JSON.stringify(42),
      "wird-something-future": JSON.stringify({ hello: 1 }),
      "not-a-wird-key": "zzz",
    });
    expect(report.applied).toBe(2);
    expect(report.skipped).toBe(1);
    expect(report.rolledBack).toBe(false);
    expect(JSON.parse(localStorage.getItem("wird-tasbeeh-v2") as string)).toEqual(JSON.parse(DAY));
    expect(localStorage.getItem("wird-daymode-v1")).toBeNull();
    expect(JSON.parse(localStorage.getItem("wird-something-future") as string)).toEqual({
      hello: 1,
    });
    expect(localStorage.getItem("not-a-wird-key")).toBeNull();
    const qRaw = localStorage.getItem("wird-quarantine-v1");
    expect(qRaw).not.toBeNull();
    expect(JSON.parse(qRaw as string).length).toBeGreaterThanOrEqual(1);
  });

  it("salvages partially-bad arrays instead of dropping them", () => {
    const report = restoreBackupSafe({
      "wird-customs-v1": JSON.stringify([{ id: "a", title: "ok", points: 2 }, { broken: true }]),
    });
    expect(report.applied).toBe(1);
    expect(report.salvaged).toBe(1);
    const stored = JSON.parse(localStorage.getItem("wird-customs-v1") as string) as { d: unknown };
    expect(stored.d).toEqual([{ id: "a", title: "ok", points: 2 }]);
  });

  it("previewRestore dry-runs without touching storage", () => {
    const pre = previewRestore({
      "wird-tasbeeh-v2": DAY,
      "wird-customs-v1": JSON.stringify([{ broken: 1 }]),
      "wird-daymode-v1": "{oops",
      "wird-mystery": JSON.stringify(1),
    });
    expect(pre).toEqual({ total: 4, valid: 1, salvagable: 1, invalid: 1, unknownKeys: 1 });
    expect(localStorage.length).toBe(0);
  });

  it("writes nothing — not even quarantine — when zero entries are applicable", () => {
    localStorage.setItem("wird-daymode-v1", JSON.stringify("keep me"));
    expect(() =>
      restoreBackupSafe({
        "wird-daymode-v1": JSON.stringify(42),
        "wird-tasbeeh-v2": "{oops",
      }),
    ).toThrow("no valid wird keys");
    expect(localStorage.getItem("wird-daymode-v1")).toBe(JSON.stringify("keep me"));
    expect(localStorage.getItem("wird-quarantine-v1")).toBeNull();
  });

  it("rolls back to snapshot when a write fails mid-restore", () => {
    localStorage.setItem("wird-tasbeeh-v2", DAY);
    const boom = JSON.stringify({ day: "2026-09-12", value: 9 });
    const inner = memStorage({ "wird-tasbeeh-v2": DAY });
    const failing = {
      ...inner,
      setItem: (k: string, v: string) => {
        if (k === "wird-salawat-v2") throw new Error("disk on fire");
        inner.setItem(k, v);
      },
    };
    (globalThis as unknown as { localStorage: unknown }).localStorage = failing;
    expect(() => restoreBackupSafe({ "wird-tasbeeh-v2": boom, "wird-salawat-v2": boom })).toThrow(
      "disk on fire",
    );
    expect(failing.getItem("wird-tasbeeh-v2")).toBe(DAY);
    expect(failing.getItem("wird-salawat-v2")).toBeNull();
  });

  it("legacy restoreBackup wrapper stays compatible", () => {
    expect(restoreBackup({ "wird-tasbeeh-v2": DAY })).toBe(1);
    expect(() => restoreBackup("garbage")).toThrow("bad backup data");
    expect(() => restoreBackup({})).toThrow("no wird keys in backup");
    expect(() => restoreBackup({ "wird-daymode-v1": JSON.stringify(42) })).toThrow(
      "no valid wird keys",
    );
  });

  it("strips profile prefixes for schema lookup", () => {
    expect(datasetKeyOf("p_abc123_wird-tasbeeh-v2")).toBe("wird-tasbeeh-v2");
    expect(datasetKeyOf("wird-daymode-v1")).toBe("wird-daymode-v1");
  });
});
