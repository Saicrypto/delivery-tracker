// Service worker for PWA installability in Brave browser
const CACHE_NAME = 'delivery-tracker-v4';

// Core assets that must be cached for PWA installability
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing for PWA...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching core assets for PWA');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: PWA assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: PWA install failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating for PWA...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: PWA activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - minimal caching for PWA requirements
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Only handle GET requests
  if (request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fetch from network and cache for future use
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Cache the response
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Return cached index.html for navigation requests when offline
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            throw new Error('Network request failed and no cache available');
          });
      })
  );
});

console.log('🎉 Service Worker: Loaded and ready for PWA installation in Brave browser - v4.1');


