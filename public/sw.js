const CACHE_NAME = 'infi-billing-v2';
const STATIC_CACHE = 'infi-static-v2';
const DYNAMIC_CACHE = 'infi-dynamic-v2';

// Static assets to pre-cache during install
const PRECACHE_ASSETS = [
  '/offline',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Install event - pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== CACHE_NAME && name !== STATIC_CACHE && name !== DYNAMIC_CACHE;
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Helper: is the request for a static asset?
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.otf', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];
  const pathname = new URL(url).pathname;
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// Helper: is this a navigation request?
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

// Helper: is this an API/server action request?
function isApiRequest(url) {
  const pathname = new URL(url).pathname;
  return pathname.startsWith('/api/') || pathname.startsWith('/_next/data/');
}

// Fetch event - strategy-based caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET requests (POST/PUT/DELETE should always go to network)
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and non-http requests
  if (!url.startsWith('http')) {
    return;
  }

  // Skip localhost, dev servers, HMR, Turbopack, and Next.js dynamic chunks
  if (
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('turbopack') ||
    url.includes('webpack') ||
    url.includes('hot-update') ||
    url.includes('/_next/static/chunks/')
  ) {
    return;
  }

  // Strategy 1: Cache-first for static assets (JS, CSS, fonts, images)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached, but also update cache in background (stale-while-revalidate)
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return networkResponse;
            })
            .catch(() => {});
          return cachedResponse;
        }
        // Not in cache - fetch from network and cache it
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => caches.match('/offline'));
      })
    );
    return;
  }

  // Strategy 2: Network-first for navigation (HTML pages)
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache the page for offline access
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Try to serve cached version of the page
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline');
          });
        })
    );
    return;
  }

  // Strategy 3: Network-first for API/data requests
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Default: Network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
