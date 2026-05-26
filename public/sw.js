// FinTrack service worker — minimal, network-first.
// Required for PWA installability. Extend later for offline support.

const CACHE = "fintrack-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Network-first for everything. Falls back to cache only if offline.
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res.ok && req.url.startsWith(self.location.origin)) {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        return new Response("Hors ligne", { status: 503, statusText: "Offline" });
      }
    })(),
  );
});
