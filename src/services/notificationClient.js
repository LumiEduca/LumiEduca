const NOTIFICATION_SW_PATH = '/lumi-notification-sw.js';

export async function registerNotificationServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não é suportado neste navegador.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(NOTIFICATION_SW_PATH);

    await navigator.serviceWorker.ready;

    return registration;
  } catch (error) {
    console.error('Erro ao registrar Service Worker de notificações:', error);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notificações não são suportadas neste navegador.');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error);
    return 'default';
  }
}

export async function showLumiNotification(title, body) {
  if (!('Notification' in window)) {
    console.warn('Notificações não são suportadas neste navegador.');
    return;
  }

  let permission = Notification.permission;

  if (permission === 'default') {
    permission = await requestNotificationPermission();
  }

  if (permission !== 'granted') {
    console.warn('Permissão de notificação não concedida.');
    return;
  }

  const registration =
    (await registerNotificationServiceWorker()) ||
    (await navigator.serviceWorker?.ready);

  const notificationOptions = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'lumieduca-notification',
    renotify: true,
    data: {
      url: '/tarefas-recebidas',
    },
  };

  if (registration?.showNotification) {
    await registration.showNotification(title, notificationOptions);
    return;
  }

  new Notification(title, notificationOptions);
}