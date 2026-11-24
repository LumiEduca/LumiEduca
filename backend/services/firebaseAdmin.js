// TODO: substituir mock por firebase-admin real (módulo push-notifications)

const admin = {
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
