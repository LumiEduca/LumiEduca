self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const dados = event.data
    ? event.data.json()
    : {
        title: 'Nova atividade no LumiEduca! 🦊',
        body: 'Seu professor enviou um novo desafio para você.',
        icon: '/pwa-192x192.png',
        url: '/tarefas-recebidas',
      };

  event.waitUntil(
    self.registration.showNotification(dados.title || 'LumiEduca', {
      body: dados.body || 'Você tem uma nova atividade.',
      icon: dados.icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'lumieduca-notification',
      renotify: true,
      data: {
        url: dados.url || '/tarefas-recebidas',
      },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/tarefas-recebidas';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});