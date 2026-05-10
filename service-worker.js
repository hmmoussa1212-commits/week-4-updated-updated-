// Hadeer Week 3 — Service Worker v4
// Cache name includes version — MUST change this when deploying updates

var CACHE = 'hadeer-week4-current-task-v1';
var FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './service-worker.js'];

// Install: cache all files, skip waiting immediately
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(FILES); })
  );
  self.skipWaiting();
});

// Activate: delete ALL old caches, claim clients immediately
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// Fetch: NETWORK FIRST for HTML (always get fresh), cache for assets
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);
  
  // For HTML: always try network first so updates are seen immediately
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        var copy = response.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
  
  // For other assets: cache first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        var copy = response.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
        return response;
      });
    }).catch(function() {
      return caches.match('./index.html');
    })
  );
});


// FULL_OFFLINE_PATCH: notification click opens app shell
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
