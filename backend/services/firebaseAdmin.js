
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Modo simulado: usado nos testes e quando não há credencial válida
const simulado = {
  messaging() {
    return {
      async send(message) {
        console.log("Notificação simulada.");
        return "mock-message-id";
      },
    };
  },
};

let admin = simulado;

if (process.env.NODE_ENV !== "test" && process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    const app = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }),
        });

    admin = {
      messaging() {
        return getMessaging(app);
      },
    };
  } catch (error) {
    console.error("Firebase indisponível. Usando modo simulado:", error.message);
  }
}

export default admin;
