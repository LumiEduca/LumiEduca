importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAN2Ox6tzH1kaYEOG-r51ue1-TPNIl3InI",
  authDomain: "lumieduca-pwa.firebaseapp.com",
  projectId: "lumieduca-pwa",
  storageBucket: "lumieduca-pwa.firebasestorage.app",
  messagingSenderId: "590662774724",
  appId: "1:590662774724:web:5923612092ac159c58be91",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log("Mensagem recebida:", payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo192.png",
  });
});