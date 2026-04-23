const KEY = "lumi_notifications";

export function getNotifications() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function saveNotification(notification) {
  const current = getNotifications();

  const newList = [
    {
      id: Date.now(),
      read: false,
      createdAt: new Date().toISOString(),
      ...notification,
    },
    ...current,
  ];

  localStorage.setItem(KEY, JSON.stringify(newList));
}

export function markAllAsRead() {
  const list = getNotifications().map((n) => ({
    ...n,
    read: true,
  }));

  localStorage.setItem(KEY, JSON.stringify(list));
}