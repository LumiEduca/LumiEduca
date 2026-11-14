import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import API_BASE_URL from "./apiConfig";

const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};
const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;
const ESCOPO_SW = "/firebase-cloud-messaging-push-scope";

const configurado = () =>
  Object.values(config).every(Boolean) && Boolean(VAPID_KEY);

// Registra o token deste navegador no back (POST /api/v1/notificacoes/token).
// Nunca lança erro: devolve { ok, motivo } e o app segue normalmente.
export async function ativarPush(tokenJwt) {
  try {
    if (!tokenJwt) return { ok: false, motivo: "sem-login" };
    if (!configurado()) return { ok: false, motivo: "sem-config" };
    if (!(await isSupported())) return { ok: false, motivo: "nao-suportado" };

    let permissao = Notification.permission;
    if (permissao === "default") permissao = await Notification.requestPermission();
    if (permissao !== "granted") return { ok: false, motivo: "permissao-negada" };

    const query = new URLSearchParams(config).toString();
    const registro = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${query}`,
      { scope: ESCOPO_SW }
    );

    const app = getApps().length ? getApp() : initializeApp(config);
    const token = await getToken(getMessaging(app), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registro,
    });
    if (!token) return { ok: false, motivo: "sem-token" };

    const res = await fetch(`${API_BASE_URL}/api/v1/notificacoes/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenJwt}`,
      },
      body: JSON.stringify({ token }),
    });
    return res.ok ? { ok: true } : { ok: false, motivo: "api-recusou" };
  } catch (error) {
    console.error("Falha ao ativar notificações push:", error?.code || error?.message);
    return { ok: false, motivo: "erro" };
  }
}
const firebaseConfig = { /* cola aqui */ };

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);