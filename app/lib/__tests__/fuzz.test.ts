import { describe, expect, it } from "vitest";
import { readRecord, SCHEMAS, writeRecord, type StorageLike } from "../schema";

// Seeded PRNG so failures reproduce exactly.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function memStore(): StorageLike {
  const m = new Map<string, string>();
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

const ATOMS: unknown[] = [
  null,
  undefined,
  true,
  false,
  0,
  -1,
  1.5,
  NaN,
  Infinity,
  "",
  "x",
  "2026-09-12",
  [],
  {},
  [null],
  { day: "2026-09-12" },
  { __wird: { v: 1, updatedAt: 1 }, d: null },
  { __wird: "nope", d: [] },
];

function randomJson(rand: () => number, depth: number): unknown {
  const r = rand();
  if (depth <= 0 || r < 0.3) {
    const atoms = [null, true, false, 0, 42, -3.5, "", "s", "2026-09-12", "wird-x"];
    return atoms[Math.floor(rand() * atoms.length)];
  }
  if (r < 0.6) {
    const n = Math.floor(rand() * 4);
    return Array.from({ length: n }, () => randomJson(rand, depth - 1));
  }
  const keys = ["day", "ids", "value", "text", "id", "title", "points", "__wird", "d", "v", "x"];
  const out: Record<string, unknown> = {};
  const n = Math.floor(rand() * 4);
  for (let i = 0; i < n; i++) {
    out[keys[Math.floor(rand() * keys.length)] as string] = randomJson(rand, depth - 1);
  }
  return out;
}

describe("fuzz: invalid state never crashes, valid state round-trips", () => {
  const rand = mulberry32(20260912);
  const values: unknown[] = [...ATOMS];
  for (let i = 0; i < 400; i++) values.push(randomJson(rand, 3));

  it("every validator tolerates every value without throwing", () => {
    for (const [key, schema] of Object.entries(SCHEMAS)) {
      for (const v of values) {
        let threw = false;
        try {
          schema.validate(v);
          if (schema.normalize) schema.normalize(v);
        } catch {
          threw = true;
        }
        expect(threw, `${key} threw`).toBe(false);
      }
    }
  });

  it("readRecord never throws, even on hostile raw strings", () => {
    const hostile = [
      "",
      "{",
      "null",
      "undefined",
      "[1,2",
      '{"__wird":',
      "42",
      '"str"',
      "[1,2,3]",
      ...values.slice(0, 60).map((v) => {
        try {
          return JSON.stringify(v) ?? "";
        } catch {
          return "";
        }
      }),
    ];
    for (const key of Object.keys(SCHEMAS)) {
      for (const raw of hostile) {
        const st = memStore();
        st.setItem(key, raw);
        expect(() => readRecord(st, key, key), `${key} :: ${raw.slice(0, 40)}`).not.toThrow();
      }
    }
  });

  it("writeRecord never throws and accepted values read back intact", () => {
    for (const [key, schema] of Object.entries(SCHEMAS)) {
      for (const v of values) {
        const st = memStore();
        expect(() => writeRecord(st, key, key, v), `write ${key}`).not.toThrow();
        const back = readRecord(st, key, key);
        if (schema.validate(v)) {
          expect(back.status).toBe("ok");
          expect(back.value).toEqual(v);
        }
      }
    }
  });

  it("envelope serialization preserves valid state (unknown keys)", () => {
    const st = memStore();
    for (const v of values) {
      let json: string | undefined;
      try {
        json = JSON.stringify(v) as string | undefined;
      } catch {
        continue;
      }
      if (json === undefined) continue; // undefined/functions have no JSON form
      const res = writeRecord(st, "wird-future-zzz", "wird-future-zzz", v);
      expect(res.ok).toBe(true);
      // JSON normalization applies (NaN/Infinity → null): compare against it.
      expect(readRecord(st, "wird-future-zzz", "wird-future-zzz").value).toEqual(JSON.parse(json));
    }
  });
});
