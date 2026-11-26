import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Modo simulado: usado nos testes e quando não há credencial válida
const simulado = {
  messaging() {
    return {
      async send(message) {
        console.log("Notificação simulada:", {
          titulo: message?.notification?.title,
          corpo: message?.notification?.body,
        });
        return "mock-message-id";
      },
    };
  },
};

const lerCredencial = () => {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!base64) return null;

  try {
    const json = JSON.parse(Buffer.from(base64.trim(), "base64").toString("utf8"));
    if (!json.project_id || !json.client_email || !json.private_key) {
      throw new Error("campos ausentes");
    }
    return json;
  } catch {
    // Mensagem fixa de propósito: o erro original pode conter pedaços da credencial
    console.error("[firebase] FIREBASE_SERVICE_ACCOUNT_BASE64 inválida. Usando modo simulado.");
    return null;
  }
};

const criar = () => {
  if (process.env.NODE_ENV === "test") return simulado;

  const credencial = lerCredencial();
  if (!credencial) {
    console.warn("[firebase] Sem credencial. Usando modo simulado.");
    return simulado;
  }

  try {
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(credencial) });
    const messaging = getMessaging(app);
    console.log("[firebase] Modo real ativo.");
    return { messaging: () => messaging };
  } catch {
    console.error("[firebase] Falha ao inicializar o Firebase. Usando modo simulado.");
    return simulado;
  }
};

let instancia = null;

// Só para testes: força nova decisão na próxima chamada
export const resetarFirebaseParaTestes = () => {
  instancia = null;
};

const admin = {
  messaging() {
    if (!instancia) instancia = criar();
    return instancia.messaging();
  },
};

export default admin;