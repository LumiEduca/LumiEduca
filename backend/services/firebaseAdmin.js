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

export default admin;
