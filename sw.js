// Service Worker for DSOG STORES PWA
const CACHE_NAME = 'dsog-stores-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/mens.html',
  '/womens.html',
  '/kids.html',
  '/accessories.html',
  '/gifts.html',
  'https://i.postimg.cc/CxNLzQgt/Untitled-design-3.webp',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://i.postimg.cc/kMZ1jTww/Untitled-design-4-removebg-preview.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell and resources');
        return cache.addAll(urlsToCache)
          .then(() => {
            console.log('Service Worker: All resources cached successfully');
            return self.skipWaiting();
          })
          .catch(error => {
            console.error('Service Worker: Caching failed:', error);
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests and Chrome extensions
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Handle API requests differently
  if (event.request.url.includes('script.google.com')) {
    // For Google Apps Script API, network first
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response for offline use
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other resources, cache first with network fallback
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
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
            console.error('Service Worker: Fetch failed:', error);
            
            // For HTML pages, return offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // For images, return placeholder
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              return caches.match('https://i.postimg.cc/CxNLzQgt/Untitled-design-3.webp');
            }
            
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync for offline orders
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    console.log('Service Worker: Syncing offline orders');
    event.waitUntil(syncOrders());
  }
});

// Push notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  let data = {
    title: 'DSOG STORES',
    body: 'New offers available!',
    icon: 'https://i.postimg.cc/CxNLzQgt/Untitled-design-3.webp',
    badge: 'https://i.postimg.cc/CxNLzQgt/Untitled-design-3.webp',
    vibrate: [200, 100, 200]
  };
  
  if (event.data) {
    data = { ...data, ...JSON.parse(event.data.text()) };
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: data.vibrate,
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View Products'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
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

// Periodic sync for content updates
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    console.log('Service Worker: Periodic sync for content updates');
    event.waitUntil(updateContent());
  }
});

// Helper functions
async function syncOrders() {
  try {
    const db = await openOrderDB();
    const orders = await getAllOfflineOrders(db);
    
    for (const order of orders) {
      const response = await fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
      });
      
      if (response.ok) {
        await deleteOfflineOrder(db, order.id);
        console.log('Order synced:', order.id);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

async function updateContent() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = urlsToCache.map(url => new Request(url));
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response);
          console.log('Updated:', request.url);
        }
      } catch (error) {
        console.error('Failed to update:', request.url, error);
      }
    }
  } catch (error) {
    console.error('Content update failed:', error);
  }
}

// IndexedDB for offline orders
function openOrderDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dsog-orders', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('orders')) {
        const store = db.createObjectStore('orders', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

function getAllOfflineOrders(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('orders', 'readonly');
    const store = transaction.objectStore('orders');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteOfflineOrder(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('orders', 'readwrite');
    const store = transaction.objectStore('orders');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
