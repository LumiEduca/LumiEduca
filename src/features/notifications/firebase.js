import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAN2Ox6tzH1kaYEOG-r51ue1-TPNIl3InI",
  authDomain: "lumieduca-pwa.firebaseapp.com",
  projectId: "lumieduca-pwa",
  storageBucket: "lumieduca-pwa.firebasestorage.app",
  messagingSenderId: "590662774724",
  appId: "1:590662774724:web:5923612092ac159c58be91",
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);