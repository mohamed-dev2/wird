// Bounded fetch (STEP 5: server failure degrades, never hangs). Mocks the
// transport to simulate timeout / 500 / DNS failure / partial responses;
// asserts the loaders reject with plain Errors that existing UI catch
// handlers already turn into calm retry states (no crashes, no hangs).
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTafsir } from "../tafsir";
import { loadFullBook } from "../hadith-full";
import { FETCH_TIMEOUT_MS, fetchWithTimeout } from "../net";

afterEach(() => {
  vi.unstubAllGlobals();
});

function hangingFetch(): typeof fetch {
  return ((_url: unknown, init?: { signal?: AbortSignal }) =>
    new Promise((_res, rej) => {
      init?.signal?.addEventListener("abort", () =>
        rej(new DOMException("TimeoutError", "TimeoutError")),
      );
    })) as typeof fetch;
}

function failingFetch(status = 500): typeof fetch {
  return (() => Promise.resolve({ ok: false, status } as Response)) as typeof fetch;
}

describe("fetchWithTimeout", () => {
  it(`rejects a stalled request (default budget ${FETCH_TIMEOUT_MS}ms, tested with 30ms)`, async () => {
    vi.stubGlobal("fetch", hangingFetch());
    await expect(fetchWithTimeout("https://example.invalid/x", 30)).rejects.toThrow();
  });
  it("passes through successful responses untouched", async () => {
    vi.stubGlobal("fetch", (() => Promise.resolve({ ok: true } as Response)) as typeof fetch);
    await expect(fetchWithTimeout("https://example.invalid/x", 1000)).resolves.toMatchObject({
      ok: true,
    });
  });
});

describe("loader failure behavior (5.16 matrix)", () => {
  it("tafsir: 500 from the API rejects (UI shows its calm retry state)", async () => {
    vi.stubGlobal("fetch", failingFetch(500));
    await expect(fetchTafsir("ar-tafsir-muyassar", 1, 1)).rejects.toThrow("tafsir missing");
  });
  it("tafsir: DNS/connection failure rejects instead of hanging", async () => {
    vi.stubGlobal("fetch", (() => Promise.reject(new TypeError("fetch failed"))) as typeof fetch);
    await expect(fetchTafsir("ar-tafsir-muyassar", 1, 2)).rejects.toThrow();
  });
  it("tafsir: stalled connection hits the timeout budget", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    await expect(fetchTafsir("ar-tafsir-muyassar", 1, 3)).rejects.toThrow();
  }, 15000);
  it("hadith book: connection refused rejects (UI shows its calm retry state)", async () => {
    vi.stubGlobal("fetch", (() => Promise.reject(new TypeError("fetch failed"))) as typeof fetch);
    await expect(loadFullBook("bukhari")).rejects.toThrow();
  });
  it("hadith book: corrupt payload rejects instead of producing garbage", async () => {
    vi.stubGlobal("fetch", (() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.reject(new SyntaxError("bad json")),
      } as unknown as Response)) as typeof fetch);
    await expect(loadFullBook("muslim")).rejects.toThrow();
  });
});
