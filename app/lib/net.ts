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
