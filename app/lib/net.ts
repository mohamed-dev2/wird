// Bounded network fetch for optional-online loaders (STEP 5: server
// failure must degrade, never hang). Same-origin bundles stay on plain
// fetch (service worker + localhost); external hosts go through here so a
// stalled connection rejects instead of spinning the UI forever.
export const FETCH_TIMEOUT_MS = 10000;

export function fetchWithTimeout(url: string, ms = FETCH_TIMEOUT_MS): Promise<Response> {
  try {
    return fetch(url, { signal: AbortSignal.timeout(ms) });
  } catch (e) {
    return Promise.reject(e);
  }
}

// ---------- circuit breaker (STEP 7.10) ----------
//
// Repeatedly failing optional services stop getting hammered: after
// `threshold` consecutive failures the breaker OPENS for `cooldownMs`
// (calls reject immediately, no network touched), then a single trial
// call decides between recovery (CLOSED) and another cooldown (OPEN).
// Callers already render calm retry UI on rejection, so an open breaker
// just reaches that UI faster. Pure except the injected clock (tests).
export type BreakerState = "closed" | "open" | "half-open";

export type CircuitBreaker = {
  readonly state: BreakerState;
  readonly failures: number;
  call<T>(fn: () => Promise<T>): Promise<T>;
};

/**
 * @param threshold consecutive failures before opening (default 5 — above
 *   what any test suite fires without resetModules; see net.test.ts)
 * @param cooldownMs quiet period before one trial call is allowed
 * @param now injectable clock (default Date.now)
 */
export function createCircuitBreaker(
  opts: { threshold?: number; cooldownMs?: number; now?: () => number } = {},
): CircuitBreaker {
  const threshold = opts.threshold ?? 5;
  const cooldownMs = opts.cooldownMs ?? 30000;
  const now = opts.now ?? Date.now;
  let state: BreakerState = "closed";
  let failures = 0;
  let openedAt = 0;
  let trialing = false;
  return {
    get state() {
      return state;
    },
    get failures() {
      return failures;
    },
    call<T>(fn: () => Promise<T>): Promise<T> {
      if (state === "open") {
        if (now() - openedAt < cooldownMs) {
          return Promise.reject(new Error("circuit open"));
        }
        if (trialing) return Promise.reject(new Error("circuit open"));
        state = "half-open";
        trialing = true;
      }
      return fn().then(
        (v) => {
          state = "closed";
          failures = 0;
          trialing = false;
          return v;
        },
        (e) => {
          failures += 1;
          trialing = false;
          if (state === "half-open" || failures >= threshold) {
            state = "open";
            openedAt = now();
          }
          throw e;
        },
      );
    },
  };
}

/** Bounded fetch through a breaker (one line at each external call site). */
export function circuitGet(
  breaker: CircuitBreaker,
  url: string,
  ms = FETCH_TIMEOUT_MS,
): Promise<Response> {
  return breaker.call(() => fetchWithTimeout(url, ms));
}
