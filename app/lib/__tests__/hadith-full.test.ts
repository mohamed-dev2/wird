// Full-book English editions (STEP 5 follow-up: translation for every
// full book, not just Arabic). Mocks the transport: verifies
// hadithnumber-merge, empty-text skipping, and graceful degradation when
// the English edition is missing or blocked.
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadFullBook, loadFullBookEn } from "../hadith-full";

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

const mirrorPayload = {
  metadata: { id: 8 },
  chapters: [
    { id: 1, arabic: "chapter one" },
    { id: 2, arabic: "" },
  ],
  hadiths: [
    {
      id: 36164,
      idInBook: 1,
      chapterId: 1,
      arabic: "matn one",
      english: { narrator: "Qais", text: "One" },
    },
    {
      id: 36165,
      idInBook: 2,
      chapterId: 1,
      arabic: "matn two",
      english: { narrator: "", text: "  " },
    },
    { id: 36166, idInBook: -3, chapterId: 1, arabic: "bad num", english: { text: "Bad" } },
  ],
};

describe("mirror books (Ahmed/Darimi)", () => {
  it("maps in-book numbers, chapter sections, and refs", async () => {
    vi.stubGlobal(
      "fetch",
      fakeFetch((url) => {
        if (!url.includes("AhmedBaset/hadith-json")) throw new Error("wrong upstream: " + url);
        return mirrorPayload;
      }),
    );
    const b = await loadFullBook("ahmed");
    expect(b.count).toBe(2);
    expect(b.hadiths.map((h) => h.num)).toEqual([1, 2]);
    expect(b.hadiths[0]).toMatchObject({ text: "matn one", book: 1, ref: "#1" });
    expect(b.sections).toEqual({ 1: "chapter one" });
  });
  it("maps the second mirror book independently", async () => {
    vi.stubGlobal(
      "fetch",
      fakeFetch(() => mirrorPayload),
    );
    const b = await loadFullBook("darimi");
    expect(b.id).toBe("darimi");
    expect(b.count).toBe(2);
    expect(b.sections).toEqual({ 1: "chapter one" });
  });
  it("mirror EN failure resolves empty instead of rejecting", async () => {
    vi.stubGlobal(
      "fetch",
      fakeFetch(() => {
        throw new TypeError("fetch failed");
      }),
    );
    vi.resetModules();
    const fresh = await import("../hadith-full");
    await expect(fresh.loadFullBookEn("darimi")).resolves.toEqual(new Map());
  });
  it("derives the EN map from the same bilingual payload", async () => {
    vi.stubGlobal(
      "fetch",
      fakeFetch(() => mirrorPayload),
    );
    const m = await loadFullBookEn("darimi");
    expect(m.get(1)).toBe("One");
    expect(m.has(2)).toBe(false);
  });
  it("rejects corrupt mirror payloads (UI shows its calm retry state)", async () => {
    vi.stubGlobal(
      "fetch",
      fakeFetch(() => ({ hadiths: "nope" })),
    );
    vi.resetModules();
    const fresh = await import("../hadith-full");
    await expect(fresh.loadFullBook("ahmed")).rejects.toThrow();
  });
  it("book + EN derive from one download (no double fetch/parse)", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      fakeFetch(() => {
        calls++;
        return mirrorPayload;
      }),
    );
    vi.resetModules();
    const fresh = await import("../hadith-full");
    const b = await fresh.loadFullBook("darimi");
    const en = await fresh.loadFullBookEn("darimi");
    expect(calls).toBe(1);
    expect(b.count).toBe(2);
    expect(en.get(1)).toBe("One");
  });
  it("precomputes normalized search text at load", async () => {
    vi.stubGlobal(
      "fetch",
      fakeFetch(() => mirrorPayload),
    );
    vi.resetModules();
    const fresh = await import("../hadith-full");
    const { normalizeAr } = await import("../quran");
    const b = await fresh.loadFullBook("ahmed");
    const first = b.hadiths[0];
    expect(first?.ntext).toBe(normalizeAr(first?.text ?? ""));
  });
});
