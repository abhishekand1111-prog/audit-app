const CACHE = 'diagnosis-room-v10';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', function(event){
  event.waitUntil(caches.open(CACHE).then(function(cache){ return cache.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;
  var isPage = event.request.mode === 'navigate' || event.request.destination === 'document';
  if (isPage){
    event.respondWith(
      fetch(event.request).then(function(networkResponse){
        if (networkResponse && networkResponse.ok){
          var copy = networkResponse.clone();
          caches.open(CACHE).then(function(cache){ cache.put(event.request, copy); });
        }
        return networkResponse;
      }).catch(function(){ return caches.match(event.request); })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function(cached){
      var fetchPromise = fetch(event.request).then(function(networkResponse){
        if (networkResponse && networkResponse.ok){
          var copy = networkResponse.clone();
          caches.open(CACHE).then(function(cache){ cache.put(event.request, copy); });
        }
        return networkResponse;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
