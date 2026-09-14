// Personalize settings (STEP 6): defaults, normalization, schema wiring.
// One per-profile record; recovery is intentionally absent (firewall).
import { describe, expect, it } from "vitest";
import { readRecord, SCHEMAS, writeRecord, type StorageLike } from "../schema";
import {
  DEFAULT_PERSONALIZE,
  isPersonalizeLike,
  loadPersonalize,
  normalizePersonalize,
  PERSONALIZE_KEY,
  savePersonalize,
  type PersonalizeSettings,
} from "../personalize";

function memStore(initial: Record<string, string> = {}): StorageLike {
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
  };
}

describe("personalize settings", () => {
  it("defaults to full function (cold start)", () => {
    expect(DEFAULT_PERSONALIZE).toEqual({
      master: true,
      analyzeHabits: true,
      analyzeMood: true,
      analyzeReminders: true,
    });
    expect(normalizePersonalize(null)).toEqual(DEFAULT_PERSONALIZE);
    expect(normalizePersonalize({})).toEqual(DEFAULT_PERSONALIZE);
  });
  it("keeps valid shapes, rejects partial/garbage", () => {
    const good: PersonalizeSettings = {
      master: false,
      analyzeHabits: true,
      analyzeMood: false,
      analyzeReminders: true,
    };
    expect(isPersonalizeLike(good)).toBe(true);
    expect(normalizePersonalize(good)).toEqual(good);
    expect(isPersonalizeLike({ master: true })).toBe(false);
    expect(isPersonalizeLike("on")).toBe(false);
  });
  it("schema registry owns the key at version 1 with round-trip", () => {
    expect(SCHEMAS[PERSONALIZE_KEY]?.version).toBe(1);
    const st = memStore();
    const res = writeRecord(st, PERSONALIZE_KEY, PERSONALIZE_KEY, {
      ...DEFAULT_PERSONALIZE,
      master: false,
    });
    expect(res.ok).toBe(true);
    const { value } = readRecord<PersonalizeSettings>(st, PERSONALIZE_KEY, PERSONALIZE_KEY);
    expect(value?.master).toBe(false);
    expect(value?.analyzeMood).toBe(true);
  });
  it("load/save helpers exist and tolerate missing storage", () => {
    expect(typeof loadPersonalize).toBe("function");
    expect(typeof savePersonalize).toBe("function");
    expect(loadPersonalize()).toEqual(DEFAULT_PERSONALIZE);
  });
});
