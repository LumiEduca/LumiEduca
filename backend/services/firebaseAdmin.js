// TODO: substituir mock por firebase-admin real (módulo push-notifications)

const admin = {
  messaging() {
    return {
      async send(message) {
        console.log('Notificação simulada:', message);
        return 'mock-message-id';
      },
    };
  },
};

export default admin;