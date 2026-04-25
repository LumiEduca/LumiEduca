import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = { /* cola aqui */ };

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);