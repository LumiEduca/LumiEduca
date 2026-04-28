import { useEffect } from "react";

export default function usePushNotifications() {
  useEffect(() => {
    const registrar = async () => {
      try {
        if (!("Notification" in window)) return;

        const permission = await Notification.requestPermission();

        if (permission !== "granted") return;

        const fakeToken = "TOKEN_EXEMPLO_" + Date.now();

        await fetch("http://localhost:5000/api/notifications/save-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: localStorage.getItem("userName") || "aluno",
            token: fakeToken,
          }),
        });

        console.log("Push registrado");
      } catch (error) {
        console.error(error);
      }
    };

    registrar();
  }, []);
}