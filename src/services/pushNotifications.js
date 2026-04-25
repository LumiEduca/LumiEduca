import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";

export const requestPushPermission = async (userId) => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const token = await getToken(messaging, {
    vapidKey: "BPZCclanQpjkzsRgC6RJdMCcKox0xmeNlMPGtjHAQk8SY9t7Em4mPtFgpEY-qrdmjoahRaz-Q3tAZGNHLkJ4nq8",
  });

  await fetch("/api/save-token", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ userId, token }),
  });
};