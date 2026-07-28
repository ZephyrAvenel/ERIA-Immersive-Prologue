const CACHE_NAME = "ine-player-v2";
const APP_SHELL = ["./", "./manifest.webmanifest", "./icon.svg", "./player.config.json"];

function isImageRequest(request) {
  return request.destination === "image" || new URL(request.url).pathname.endsWith(".png");
}

function isCacheableResponse(request, response) {
  if (!response || !response.ok) return false;
  const contentType = response.headers.get("Content-Type") ?? "";
  if (isImageRequest(request)) return contentType.startsWith("image/");
  return true;
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (isCacheableResponse(event.request, response)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        throw new Error("INE_SERVICE_WORKER_CACHE_MISS");
      }),
  );
});
