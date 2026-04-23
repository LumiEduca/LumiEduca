import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAN2Ox6tzH1kaYEOG-r51ue1-TPNIl3InI",
  authDomain: "lumieduca-pwa.firebaseapp.com",
  projectId: "lumieduca-pwa",
  storageBucket: "lumieduca-pwa.firebasestorage.app",
  messagingSenderId: "590662774724",
  appId: "1:590662774724:web:bb14a2e1800db72f58be91",
};

const app = initializeApp(firebaseConfig);

// 🔥 ESSA FUNÇÃO É O QUE FALTAVA
export async function getMessagingInstance() {
  const supported = await isSupported();

  if (!supported) {
    console.warn("Push não suportado");
    return null;
  }

  return getMessaging(app);
}