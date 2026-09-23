// Branch-security guard: the pre-push hook that blocks direct/forced
// pushes to protected branches must exist and stay wired, and the
// branch doc keeps the matching server-side settings. If this fails,
// secured branches silently regressed.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..");
const read = (p: string): string => readFileSync(join(ROOT, p), "utf8");

describe("branch security", () => {
  it("pre-push hook exists and blocks protected branches + force pushes", () => {
    const hook = read(".husky/pre-push");
    expect(hook, "blocks main").toContain("refs/heads/main");
    expect(hook, "blocks develop").toContain("refs/heads/develop");
    expect(hook, "blocks force push refs").toContain("+${local_ref#+}");
    expect(hook, "escape hatch documented").toContain("ALLOW_PROTECTED_PUSH");
  });
  it("branching doc keeps the server-side settings and the check name", () => {
    const doc = read("docs/BRANCHING.md");
    expect(doc, "pr required").toMatch(/require a pull request/i);
    expect(doc, "status check required").toMatch(/require status checks/i);
    expect(doc, "ci check named").toContain("verify");
    expect(doc, "no force pushes").toMatch(/do not allow force pushes/i);
    expect(doc, "no deletions").toMatch(/do not allow deletions/i);
  });
});
