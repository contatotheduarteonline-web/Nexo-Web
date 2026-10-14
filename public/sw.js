/* NEXO PWA service worker.
 * Network-only by design: it avoids caching personal study data or serving stale app code.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Keep the app online-first; Firebase/Auth and study data retain their normal behavior.
  event.respondWith(fetch(request));
});
