import { getToken, onMessage } from "firebase/messaging";
import { getMessagingInstance } from "../../lib/firebase";
import toast from "react-hot-toast";
import { saveNotification } from "./store";

const VAPID_KEY = "BI5SKk2DWgNnvMRdghXDX9XT0MK-Nmuv84FE1FXa6RjxwJIZDEByfdJx2k7KTkp1HO9RVuNV7X2s4D683_2OOeI";

// Foreground (recebe notificação com app aberto)
export function listenForegroundMessages() {
  getMessagingInstance().then((messaging) => {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log("Mensagem recebida:", payload);

      const title = payload?.notification?.title || "Nova notificação";
      const body = payload?.notification?.body || "";

      // Toast bonito
      toast.custom(() => (
        <div
          style={{
            background: "#0f172a",
            color: "#ffffff",
            padding: "12px 16px",
            borderRadius: "10px",
            borderLeft: "4px solid #22c55e",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            minWidth: "250px"
          }}
        >
          <strong>{title}</strong>
          <div style={{ fontSize: "14px", marginTop: "4px" }}>
            {body}
          </div>
        </div>
      ));

      // Salva no histórico
      saveNotification({
        title,
        body
      });
    });
  });
}

// Permissão
export async function requestPermission() {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Permissão negada");
  }
}

// Token
export async function getPushToken() {
  const messaging = await getMessagingInstance();

  if (!messaging) {
    throw new Error("Push não suportado");
  }

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY
  });

  return token;
}

// Notificação local (fallback)
export function sendLocalNotification({ title, body }) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/logo192.png"
    });
  }
}