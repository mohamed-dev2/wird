/* Wird service worker: offline shell + notification deep-links. No build step.
 * Offline contract (STEP 5): precached route shells + cached static assets
 * let the app LAUNCH offline after one online visit; navigations are
 * network-first (fresh shell when online) with cache fallback (usable
 * Today screen when offline). Bump CACHE on shell changes — activate
 * purges older versions and the in-app update banner applies them. */
const CACHE = "wird-v4";
const CORE = [
  "/",
  "/calendar",
  "/insights",
  "/review",
  "/library",
  "/account",
  "/recovery",
  "/private-plans",
  "/manifest.webmanifest",
  "/data/quran-uthmani.min.json",
  "/data/en-clear.min.json",
  "/data/ar-jalalayn.min.json",
  "/data/bip39-en.txt",
  "/data/ar-nawawi.min.json",
];

function cacheable(url) {
  // local bundles + hadith/tafsir CDN JSON (never audio streams)
  if (url.origin === self.location.origin && url.pathname.startsWith("/data/")) return true;
  if (url.hostname === "cdn.jsdelivr.net" && url.pathname.includes("hadith-api")) return true;
  if (url.hostname === "cdn.jsdelivr.net" && url.pathname.includes("AhmedBaset/hadith-json"))
    return true;
  if (url.hostname === "api.quran.com" && url.pathname.includes("/tafsirs/")) return true;
  return false;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(CORE))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  // Navigations: network first (fresh shell + instant updates when online),
  // cache fallback (precached route shell, else Today) when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then((hit) => {
            if (hit) return hit;
            return caches.match("/");
          }),
        ),
    );
    return;
  }
  // Same-origin static assets (JS chunks, fonts, icons): cache-first at
  // runtime so the shell boots offline after one online visit.
  if (url.origin === self.location.origin && !cacheable(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }
  if (!cacheable(url)) return;
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/review";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) return w.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
