import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
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

const obterApp = () => (getApps().length ? getApp() : initializeApp(config));

// Registra o token deste navegador no back (POST /api/v1/notificacoes/token).
// Nunca lança erro: devolve { ok, motivo } e o app segue normalmente.
// pedirPermissao=false: só renova o token se o usuário já tiver permitido.
export async function ativarPush(tokenJwt, { pedirPermissao = true } = {}) {
  try {
    if (!tokenJwt) return { ok: false, motivo: "sem-login" };
    if (!configurado()) return { ok: false, motivo: "sem-config" };
    if (!(await isSupported())) return { ok: false, motivo: "nao-suportado" };

    let permissao = Notification.permission;
    if (permissao === "default" && pedirPermissao) {
      permissao = await Notification.requestPermission();
    }
    if (permissao === "default") return { ok: false, motivo: "permissao-pendente" };
    if (permissao !== "granted") return { ok: false, motivo: "permissao-negada" };

    const query = new URLSearchParams(config).toString();
    const registro = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${query}`,
      { scope: ESCOPO_SW }
    );

    const token = await getToken(getMessaging(obterApp()), {
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

// Mensagens recebidas com o app aberto e em foco. Devolve a função para parar de ouvir.
export async function ouvirMensagens(aoReceber) {
  try {
    if (!configurado() || !(await isSupported())) return () => {};
    return onMessage(getMessaging(obterApp()), (payload) =>
      aoReceber(payload?.notification || {})
    );
  } catch (error) {
    console.error("Falha ao ouvir mensagens push:", error?.code || error?.message);
    return () => {};
  }
}