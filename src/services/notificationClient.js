export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  return Notification.requestPermission();
}

export async function registerNotificationServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  return navigator.serviceWorker.register('/lumi-notification-sw.js');
}

export async function showLumiNotification(title, body) {
  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    return false;
  }

  const registration = await registerNotificationServiceWorker();

  if (registration) {
    await registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
    });

    return true;
  }

  new Notification(title, {
    body,
    icon: '/pwa-192x192.png',
  });

  return true;
}