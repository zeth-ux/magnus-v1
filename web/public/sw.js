/*
 * Bayu's service worker: one job only. When a page can't load because the
 * phone is offline, show offline.html instead of the browser's error. Nothing
 * else is cached (no stale shelves, no signed-in pages kept on the device).
 *
 * Kill switch: if this ever misbehaves, deploy a sw.js that calls
 * self.registration.unregister(). It's served with no-cache, so phones pick
 * the fix up on their next visit.
 */
const CACHE = "bayu-offline-v2"; // bump when offline.html changes
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Start page loads while the worker boots, so it adds no delay.
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("bayu-") && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  // Only plain page loads. Form posts and sign-in callbacks go straight to the network.
  if (request.mode !== "navigate" || request.method !== "GET") return;
  if (new URL(request.url).pathname.startsWith("/auth/")) return;
  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse;
        return preloaded || (await fetch(request));
      } catch {
        const cached = await caches.match(OFFLINE_URL, { cacheName: CACHE });
        return cached || Response.error();
      }
    })(),
  );
});
