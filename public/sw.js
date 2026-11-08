// MediAlarm Service Worker for offline support & notifications
const CACHE_NAME = 'medialarm-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
