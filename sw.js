/* Çevrimdışı çalışma: dosyalar önbellekten açılır, arka planda yenilenir.
   Yeni sürüm bir sonraki açılışta görünür. */
var CACHE = 'prompter-v1';
var FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(names
          .filter(function (name) { return name !== CACHE; })
          .map(function (name) { return caches.delete(name); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(request, { ignoreSearch: true }).then(function (cached) {
        var refresh = fetch(request).then(function (response) {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        });
        if (cached) {
          event.waitUntil(refresh.catch(function () {}));
          return cached;
        }
        return refresh;
      });
    })
  );
});
