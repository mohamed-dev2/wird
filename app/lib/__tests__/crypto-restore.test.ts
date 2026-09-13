import { beforeEach, describe, expect, it } from "vitest";
import {
  backupFilename,
  buildBackupFile,
  collectBackup,
  collectBackupFor,
  datasetKeyOf,
  parseBackupFile,
  planProfileRemap,
  previewRestore,
  remapBackupProfile,
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

describe("scoped backup collection", () => {
  it("device scope includes every profile; profile scope keeps only one", () => {
    localStorage.setItem("wird-daymode-v1", JSON.stringify("عادي"));
    localStorage.setItem("p_alice_wird-tasbeeh-v2", DAY);
    localStorage.setItem("p_bob_wird-tasbeeh-v2", JSON.stringify({ day: "2026-09-11", value: 3 }));
    const device = collectBackupFor(null);
    expect(Object.keys(device).sort()).toEqual([
      "p_alice_wird-tasbeeh-v2",
      "p_bob_wird-tasbeeh-v2",
      "wird-daymode-v1",
    ]);
    const alice = collectBackupFor("alice");
    expect(Object.keys(alice).sort()).toEqual(["p_alice_wird-tasbeeh-v2", "wird-daymode-v1"]);
  });
});

describe("profile remap", () => {
  it("proposes a retarget only for a single foreign profile with no active key", () => {
    expect(planProfileRemap({ "p_old_wird-tasbeeh-v2": DAY }, "me")).toEqual({
      from: "old",
      to: "me",
    });
    // Ambiguous (two foreign profiles) or active-present → untouched.
    expect(
      planProfileRemap({ "p_old_wird-tasbeeh-v2": DAY, "p_other_wird-tasbeeh-v2": DAY }, "me"),
    ).toBeNull();
    expect(planProfileRemap({ "p_me_wird-tasbeeh-v2": DAY }, "me")).toBeNull();
    expect(planProfileRemap({ "wird-daymode-v1": JSON.stringify("عادي") }, "me")).toBeNull();
    expect(planProfileRemap(null, "me")).toBeNull();
  });

  it("renames one profile prefix and leaves everything else intact", () => {
    const remapped = remapBackupProfile(
      {
        "p_old_wird-tasbeeh-v2": DAY,
        p_old_customs: "bind",
        "wird-daymode-v1": JSON.stringify("عادي"),
        "p_keep_wird-daymode-v1": JSON.stringify("عادي"),
      },
      "old",
      "me",
    );
    expect(remapped["p_me_wird-tasbeeh-v2"]).toBe(DAY);
    expect(remapped["p_me_customs"]).toBe("bind");
    expect((remapped as Record<string, unknown>)["wird-daymode-v1"]).toBe(JSON.stringify("عادي"));
    expect((remapped as Record<string, unknown>)["p_keep_wird-daymode-v1"]).toBe(
      JSON.stringify("عادي"),
    );
    expect("p_old_wird-tasbeeh-v2" in remapped).toBe(false);
  });
});

describe("export filenames", () => {
  it("are date-stamped and random so files never overwrite", () => {
    const a = backupFilename("wird-backup-");
    const b = backupFilename("wird-backup-");
    expect(a).toMatch(/^wird-backup-\d{4}-\d{2}-\d{2}-[0-9a-f]{4}\.json$/);
    expect(b).toMatch(/^wird-backup-\d{4}-\d{2}-\d{2}-[0-9a-f]{4}\.json$/);
    expect(a).not.toBe(b);
  });
});
