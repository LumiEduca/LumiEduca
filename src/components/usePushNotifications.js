import { useEffect } from 'react';
import {
  registerNotificationServiceWorker,
  requestNotificationPermission,
} from '../services/notificationClient';

export default function usePushNotifications() {
  useEffect(() => {
    const setupNotifications = async () => {
      await registerNotificationServiceWorker();

      if ('Notification' in window && Notification.permission === 'default') {
        await requestNotificationPermission();
      }
    };

    setupNotifications();
  }, []);
}