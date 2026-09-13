// Full-book English editions (STEP 5 follow-up: translation for every
// full book, not just Arabic). Mocks the transport: verifies
// hadithnumber-merge, empty-text skipping, and graceful degradation when
// the English edition is missing or blocked.
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadFullBookEn } from "../hadith-full";

afterEach(() => {
  vi.unstubAllGlobals();
});

function fakeFetch(handler: (url: string) => unknown): typeof fetch {
  return ((url: unknown) => {
    try {
      const out = handler(String(url));
      if (out instanceof Error) return Promise.reject(out);
      return Promise.resolve({ ok: true, json: () => Promise.resolve(out) } as Response);
    } catch (e) {
      return Promise.reject(e);
    }
  }) as typeof fetch;
}

describe("loadFullBookEn", () => {
  it("merges English text by hadith number, skipping blanks", async () => {
    vi.stubGlobal(
      "fetch",
      fakeFetch((url) => {
        if (!url.includes("eng-dehlawi")) throw new Error("wrong edition: " + url);
        return {
          hadiths: [
            { hadithnumber: 1, text: "One" },
            { hadithnumber: 2, text: "  " },
          ],
        };
      }),
    );
    const m = await loadFullBookEn("dehlawi");
    expect(m.get(1)).toBe("One");
    expect(m.has(2)).toBe(false);
  });
  it("resolves empty (never rejects) when the English edition is blocked", async () => {
    vi.stubGlobal(
      "fetch",
      fakeFetch(() => {
        throw new TypeError("fetch failed");
      }),
    );
    await expect(loadFullBookEn("malik")).resolves.toEqual(new Map());
  });
  it("resolves empty on corrupt English payload", async () => {
    vi.stubGlobal(
      "fetch",
      fakeFetch(() => ({ nonsense: true })),
    );
    const m = await loadFullBookEn("qudsi");
    expect(m.size).toBe(0);
  });
});
