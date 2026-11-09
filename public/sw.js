// MediAlarm Service Worker for offline support & notifications
const CACHE_NAME = 'medialarm-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/pwa-192x192.png',
        '/icon.svg'
      ]).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Required fetch listener for Chromium/Android PWA installability criteria
self.addEventListener('fetch', (event) => {
  // Let network handle requests with fallback
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          if (action) {
            client.postMessage({ type: 'NOTIFICATION_ACTION', action, data: event.notification.data });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      ...options,
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200, 100, 200, 100, 400],
      requireInteraction: true,
      actions: [
        { action: 'taken', title: '✅ Taken' },
        { action: 'snooze', title: '⏱️ Snooze (5m)' },
        { action: 'skip', title: '❌ Skip' }
      ]
    });
  }
});
