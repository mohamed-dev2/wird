// Safe mode flag (STEP 7.13): param parsing, SSR-safe defaults, schema
// wiring. The hook itself is exercised by e2e (hydration-safe mounting);
// here we lock the pure parts + the registry contract.
import { describe, expect, it } from "vitest";
import { SCHEMAS } from "../schema";
import { isSafeMode, parseSafeParam, SAFE_MODE_KEY, setSafeMode } from "../safe-mode";

describe("safe mode", () => {
  it("parses the ?safe= param strictly", () => {
    expect(parseSafeParam("?safe=1")).toBe(true);
    expect(parseSafeParam("?safe=0")).toBe(false);
    expect(parseSafeParam("")).toBeNull();
    expect(parseSafeParam("?x=1")).toBeNull();
    expect(parseSafeParam("?safe=2")).toBeNull();
    expect(parseSafeParam("?safe=yes")).toBeNull();
  });
  it("is off without a window (SSR) and never throws", () => {
    expect(typeof window).toBe("undefined");
    expect(isSafeMode()).toBe(false);
    expect(() => setSafeMode(true)).not.toThrow();
    expect(() => setSafeMode(false)).not.toThrow();
  });
  it("schema registry owns the device-global flag", () => {
    expect(SAFE_MODE_KEY).toBe("wird-safe-mode-v1");
    expect(SCHEMAS[SAFE_MODE_KEY]?.version).toBe(1);
  });
});
