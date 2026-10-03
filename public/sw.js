/* PAANO service worker — app shell + runtime cache para sa PWA offline. */
const CACHE = "paano-v3";
const APP_SHELL = [
  "/",
  "/paano",
  "/manifest.webmanifest",
  "/bot-avatar.svg",
  "/brand/paano-ai-logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
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
  const url = new URL(event.request.url);

  // API at ibang origin: network-first, may offline fallback.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({
            answer: null,
            error: "Offline — walang koneksyon. Subukan kapag online ka na.",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    return;
  }

  // Ibang origin (fonts, etc): network-only.
  if (url.origin !== self.location.origin) return;

  // Static assets at pages: stale-while-revalidate.
  if (event.request.method === "GET") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      }),
    );
  }
});
