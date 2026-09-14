// Section boundary safety logic (STEP 7.3/7.4): the static error mapping
// and the diagnostic id must hold without rendering anything — ids are
// content-free hex, unique per failure, never user data.
import { describe, expect, it } from "vitest";
import { newErrorId, SectionError } from "../../components/section-error";

describe("section boundary", () => {
  it("maps any error to a failed state with a safe id", () => {
    const s = SectionError.getDerivedStateFromError(new Error("boom"));
    expect(s.failed).toBe(true);
    expect(s.errorId).toMatch(/^[0-9a-f]{16}$/);
  });
  it("mints unique content-free identifiers", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newErrorId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{16}$/);
  });
});
