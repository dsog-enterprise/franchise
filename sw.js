// Service Worker for DSOG STORES - Simplified Version
const APP_VERSION = '2.0.0';
const CACHE_NAME = `dsog-stores-${APP_VERSION}`;

// Resources to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://i.postimg.cc/CxNLzQgt/Untitled-design-3.webp',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install - Cache resources
self.addEventListener('install', event => {
  console.log(`Service Worker v${APP_VERSION}: Installing...`);
  
  // Activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log(`Service Worker v${APP_VERSION}: Installed successfully`);
      })
  );
});

// Activate - Clean old caches
self.addEventListener('activate', event => {
  console.log(`Service Worker v${APP_VERSION}: Activating...`);
  
  event.waitUntil(
    // Clean up old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log(`Service Worker v${APP_VERSION}: Activated`);
      return self.clients.claim();
    })
  );
});

// Fetch - Serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle API requests - network first
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first strategy for other resources
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if not successful
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cache the new response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            
            // For HTML pages, return offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // For images, return placeholder
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              return caches.match('https://i.postimg.cc/CxNLzQgt/Untitled-design-3.webp');
            }
            
            // Return error response
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Push notifications (optional - keep if you want push notifications)
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  const data = event.data ? JSON.parse(event.data.text()) : {
    title: 'DSOG STORES',
    body: 'New offers available!',
    icon: 'https://i.postimg.cc/CxNLzQgt/Untitled-design-3.webp'
  };
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.icon,
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        const url = event.notification.data?.url || '/';
        return clients.openWindow(url);
      }
    })
  );
});

// Handle messages from the page (simplified)
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
