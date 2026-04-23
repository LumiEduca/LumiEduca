import { useEffect, useState } from "react";
import { getNotifications, markAllAsRead } from "./store";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setNotifications(getNotifications());
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAll = () => {
    markAllAsRead();
    setNotifications(getNotifications());
  };

  return {
    notifications,
    unreadCount,
    markAll,
  };
}