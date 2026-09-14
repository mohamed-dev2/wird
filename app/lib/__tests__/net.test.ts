// Bounded fetch (STEP 5: server failure degrades, never hangs). Mocks the
// transport to simulate timeout / 500 / DNS failure / partial responses;
// asserts the loaders reject with plain Errors that existing UI catch
// handlers already turn into calm retry states (no crashes, no hangs).
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTafsir } from "../tafsir";
import { loadFullBook } from "../hadith-full";
import { FETCH_TIMEOUT_MS, circuitGet, createCircuitBreaker, fetchWithTimeout } from "../net";

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

describe("circuit breaker (7.10)", () => {
  const fail = () => Promise.reject(new Error("down"));
  const ok = (v = "up") => Promise.resolve(v);
  it("passes calls through while healthy and counts failures", async () => {
    const b = createCircuitBreaker({ threshold: 3, cooldownMs: 1000, now: () => 0 });
    await expect(b.call(() => ok())).resolves.toBe("up");
    expect(b.state).toBe("closed");
    await expect(b.call(fail)).rejects.toThrow("down");
    await expect(b.call(fail)).rejects.toThrow("down");
    expect(b.state).toBe("closed");
    expect(b.failures).toBe(2);
  });
  it("opens after threshold and rejects without touching the service", async () => {
    let calls = 0;
    const b = createCircuitBreaker({ threshold: 2, cooldownMs: 60000, now: () => 0 });
    await expect(
      b.call(() => {
        calls++;
        return fail();
      }),
    ).rejects.toThrow("down");
    await expect(
      b.call(() => {
        calls++;
        return fail();
      }),
    ).rejects.toThrow("down");
    expect(b.state).toBe("open");
    await expect(
      b.call(() => {
        calls++;
        return ok();
      }),
    ).rejects.toThrow("circuit open");
    expect(calls).toBe(2);
  });
  it("half-open trial recovers on success, re-opens on failure", async () => {
    let t = 0;
    const now = () => t;
    const b = createCircuitBreaker({ threshold: 1, cooldownMs: 1000, now });
    await expect(b.call(fail)).rejects.toThrow("down");
    expect(b.state).toBe("open");
    t = 1500;
    await expect(b.call(() => ok())).resolves.toBe("up");
    expect(b.state).toBe("closed");
    expect(b.failures).toBe(0);
    await expect(b.call(fail)).rejects.toThrow("down");
    t = 3000;
    await expect(b.call(fail)).rejects.toThrow("down");
    expect(b.state).toBe("open");
  });
  it("circuitGet bounds and breaks a stalled host", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const b = createCircuitBreaker({ threshold: 10, cooldownMs: 60000 });
    await expect(circuitGet(b, "https://example.invalid/x", 30)).rejects.toThrow();
    expect(b.failures).toBe(1);
  });
});
