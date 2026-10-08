const CACHE = "atelier-electricite-v11";
const ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "circuits.js",
  "manifest.webmanifest",
  "icon.svg",
  "pdf-report.js",
  "pdf-fonts.js",
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});
// Activate after the previous app is closed, so an ongoing series stays intact.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("atelier-electricite-") && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("./").then((cached) => cached || fetch(event.request)),
    );
    return;
  }
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request)),
  );
});
