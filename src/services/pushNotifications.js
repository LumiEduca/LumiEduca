import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";

export const requestPushPermission = async () => {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") return;

  const token = await getToken(messaging, {
    vapidKey: "SUA_VAPID_KEY",
  });

  console.log("TOKEN:", token);
};