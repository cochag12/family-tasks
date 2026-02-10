// LOBALI Service Worker v9.3
// Elite Procrastination Management - PWA Support

const CACHE_NAME = 'lobali-v9.3';
const RUNTIME_CACHE = 'lobali-runtime-v9.3';

// קבצים שנשמור בקאש
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// התקנת Service Worker
self.addEventListener('install', (event) => {
  console.log('🚀 LOBALI Service Worker התקנה...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 שמירת קבצים בקאש...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// הפעלת Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ LOBALI Service Worker הופעל');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('lobali-') && 
                   cacheName !== CACHE_NAME && 
                   cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('🗑️ מוחק קאש ישן:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// טיפול בבקשות רשת
self.addEventListener('fetch', (event) => {
  // התעלם מבקשות שאינן HTTP/HTTPS (chrome-extension, etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // התעלם מבקשות Firebase
  if (event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // מצאנו בקאש - החזר את התשובה
          return cachedResponse;
        }
        
        // אין בקאש - נסה להביא מהרשת
        return fetch(event.request)
          .then((response) => {
            // אל תשמור בקאש תשובות לא תקינות
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            // שמור בקאש runtime
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // אין רשת - נסה להחזיר את index.html מהקאש
            return caches.match('./index.html');
          });
      })
  );
});

// טיפול בהתראות Push (אופציונלי)
self.addEventListener('push', (event) => {
  console.log('📬 התראה התקבלה:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'משימה חדשה מחכה לך!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'lobali-notification',
    renotify: true
  };
  
  event.waitUntil(
    self.registration.showNotification('LOBALI 💜', options)
  );
});

// טיפול בקליק על התראה
self.addEventListener('notificationclick', (event) => {
  console.log('👆 קליק על התראה');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

console.log('💜 LOBALI Service Worker v9.3 מוכן!');
