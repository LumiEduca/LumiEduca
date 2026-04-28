import { useEffect } from 'react';
import {
  requestNotificationPermission,
  registerNotificationServiceWorker,
} from '../services/notificationClient';

export default function usePushNotifications() {
  useEffect(() => {
    const setupNotifications = async () => {
      await registerNotificationServiceWorker();

      if (Notification.permission === 'default') {
        await requestNotificationPermission();
      }
    };

    setupNotifications();
  }, []);
}