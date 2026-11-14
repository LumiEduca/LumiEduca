import { useEffect } from 'react';
import {
  registerNotificationServiceWorker,
  requestNotificationPermission,
} from '../services/notificationClient';
import { ativarPush } from '../services/firebase';

export default function usePushNotifications() {
  useEffect(() => {
    const setupNotifications = async () => {
      await registerNotificationServiceWorker();

      if ('Notification' in window && Notification.permission === 'default') {
        const resultado = await requestNotificationPermission();

        // Permissão acabou de ser concedida: registra o token no back sem esperar recarregar
        if (resultado === 'granted') {
          await ativarPush(localStorage.getItem('token'), { pedirPermissao: false });
        }
      }
    };

    setupNotifications();
  }, []);
}